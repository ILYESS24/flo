// Optimized API client for Aurora AI Studio
import { config } from './config';

export interface AgentRequest {
  prompt: string;
  model?: string;
  provider?: string;
  temperature?: number;
}

export interface WorkflowRequest {
  yaml_config: string;
  inputs: string[];
}

export interface SimpleWorkflowRequest {
  task: string;
  agents_config?: Record<string, unknown>;
}

export interface StudioAIWorkflowRequest {
  prompt: string;
  model?: string;
}

export interface APIResponse<T = unknown> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
}

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;
const AI_GENERATION_TIMEOUT = 120000; // 2 minutes for AI generation (cold start + generation)

class FloAIAPI {
  private baseURL: string;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor() {
    this.baseURL = config.API_BASE_URL;
    console.log('🔧 API configured with baseURL:', this.baseURL);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout = REQUEST_TIMEOUT
  ): Promise<APIResponse<T>> {
    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout after', timeout, 'ms');
      abortController.abort();
    }, timeout);
    
    // Store controller for potential cancellation
    this.abortControllers.set(endpoint, abortController);

    const url = `${this.baseURL}${endpoint}`;
    console.log('📡 API Request:', options.method || 'GET', url);

    try {
      const response = await fetch(url, {
        ...options,
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Response data keys:', Object.keys(data));
      
      // Handle response structure - backend returns {status, yaml}
      if (data.status === 'success') {
        return { 
          status: 'success', 
          data,
          error: undefined
        };
      } else if (data.status === 'error' || data.detail) {
        return {
          status: 'error',
          data,
          error: data.detail || data.error || 'Unknown error'
        };
      }
      
      // Fallback: wrap response in success
      return { status: 'success', data };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('⏰ Request aborted (timeout)');
        return { status: 'error', error: 'Timeout: Le serveur met trop de temps à répondre. Réessayez.' };
      }
      
      console.error('❌ API request failed:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      this.abortControllers.delete(endpoint);
    }
  }

  // Cancel a pending request
  cancelRequest(endpoint: string): void {
    const controller = this.abortControllers.get(endpoint);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(endpoint);
    }
  }

  // Health check
  async healthCheck(): Promise<APIResponse<unknown>> {
    return this.request('/health', {}, 5000);
  }

  // Chat with agent
  async chatWithAgent(request: AgentRequest): Promise<APIResponse<unknown>> {
    return this.request('/agent/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Simple workflow
  async runSimpleWorkflow(request: SimpleWorkflowRequest): Promise<APIResponse<unknown>> {
    return this.request('/workflow/simple', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // YAML workflow
  async runYamlWorkflow(request: WorkflowRequest): Promise<APIResponse<unknown>> {
    return this.request('/workflow/yaml', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Generate workflow YAML from natural language
  async generateStudioWorkflow(request: StudioAIWorkflowRequest): Promise<APIResponse<{ yaml?: string; status?: string }>> {
    console.log('🤖 Generating workflow with model:', request.model);
    return this.request('/studio/ai-workflow', {
      method: 'POST',
      body: JSON.stringify(request),
    }, AI_GENERATION_TIMEOUT); // 2 minutes timeout (cold start + generation)
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.healthCheck();
      return response.status === 'success';
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const floAIAPI = new FloAIAPI();
export default floAIAPI;
