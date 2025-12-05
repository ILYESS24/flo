// OpenRouter API service
// Documentation: https://openrouter.ai/docs

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  architecture?: {
    modality: string;
    tokenizer: string;
    instruct_type?: string;
  };
  top_provider?: {
    max_completion_tokens?: number;
    is_moderated?: boolean;
  };
  per_request_limits?: {
    prompt_tokens?: string;
    completion_tokens?: string;
  };
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

class OpenRouterService {
  private apiKey: string;
  private baseURL = 'https://openrouter.ai/api/v1';

  constructor(apiKey?: string) {
    // Get API key from environment or use provided one
    this.apiKey = apiKey || (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';
  }

  /**
   * Fetch all available models from OpenRouter
   */
  async fetchModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data: OpenRouterModelsResponse = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
      throw error;
    }
  }

  /**
   * Convert OpenRouter models to LLMConfig format
   */
  convertToLLMConfigs(models: OpenRouterModel[]): Array<{ provider: 'openrouter'; name: string; base_url?: string }> {
    return models.map(model => ({
      provider: 'openrouter' as const,
      name: model.id,
      base_url: 'https://openrouter.ai/api/v1',
    }));
  }

  /**
   * Get models grouped by provider/name prefix
   */
  getGroupedModels(models: OpenRouterModel[]): Record<string, OpenRouterModel[]> {
    const grouped: Record<string, OpenRouterModel[]> = {};
    
    models.forEach(model => {
      // Extract provider from model id (e.g., "openai/gpt-4o" -> "openai")
      const provider = model.id.split('/')[0];
      if (!grouped[provider]) {
        grouped[provider] = [];
      }
      grouped[provider].push(model);
    });

    return grouped;
  }

  /**
   * Filter models by search term
   */
  filterModels(models: OpenRouterModel[], searchTerm: string): OpenRouterModel[] {
    if (!searchTerm) return models;
    
    const term = searchTerm.toLowerCase();
    return models.filter(model => 
      model.id.toLowerCase().includes(term) ||
      model.name?.toLowerCase().includes(term) ||
      model.description?.toLowerCase().includes(term)
    );
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();

// Export factory function for custom API keys
export const createOpenRouterService = (apiKey: string) => new OpenRouterService(apiKey);

