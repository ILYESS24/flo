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

class FloAIAPI {
  private baseURL: string;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor() {
    this.baseURL = config.API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    timeout = REQUEST_TIMEOUT
  ): Promise<APIResponse<T>> {
    // Create abort controller for timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeout);
    
    // Store controller for potential cancellation
    this.abortControllers.set(endpoint, abortController);

    try {
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        signal: abortController.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Handle response structure
      if (data.status) {
        return { 
          status: data.status === 'success' ? 'success' : 'error', 
          data, 
          error: data.detail || data.error 
        };
      }
      
      return { status: 'success', data };
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return { status: 'error', error: 'Request timeout' };
      }
      
      console.error('API request failed:', error);
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
    return this.request('/studio/ai-workflow', {
      method: 'POST',
      body: JSON.stringify(request),
    }, 60000); // 60s timeout for AI generation
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
