// Hook to load and manage OpenRouter models
import { useState, useEffect } from 'react';
import { openRouterService, OpenRouterModel } from '@/lib/openrouter';
import { LLMConfig } from '@/types/agent';

interface UseOpenRouterModelsReturn {
  models: OpenRouterModel[];
  llmConfigs: LLMConfig[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useOpenRouterModels = (apiKey?: string): UseOpenRouterModelsReturn => {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const service = apiKey 
        ? (await import('@/lib/openrouter')).createOpenRouterService(apiKey)
        : openRouterService;
      
      const fetchedModels = await service.fetchModels();
      setModels(fetchedModels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load OpenRouter models';
      setError(errorMessage);
      console.error('Error loading OpenRouter models:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadModels();
  }, [apiKey]);

  // Convert models to LLMConfig format
  const llmConfigs: LLMConfig[] = models.map(model => ({
    provider: 'openrouter',
    name: model.id,
    base_url: 'https://openrouter.ai/api/v1',
  }));

  return {
    models,
    llmConfigs,
    isLoading,
    error,
    refresh: loadModels,
  };
};

