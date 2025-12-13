// Optimized hook to load and manage OpenRouter models with caching
import { useState, useEffect, useCallback, useRef } from 'react';
import { openRouterService, OpenRouterModel } from '@/lib/openrouter';
import { LLMConfig } from '@/types/agent';

// Cache configuration
const CACHE_KEY = 'openrouter_models_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  models: OpenRouterModel[];
  timestamp: number;
}

interface UseOpenRouterModelsReturn {
  models: OpenRouterModel[];
  llmConfigs: LLMConfig[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// Try to get cached models from localStorage
const getCachedModels = (): OpenRouterModel[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data: CachedData = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data.models;
      }
    }
  } catch {
    // Ignore cache errors
  }
  return null;
};

// Save models to cache
const setCachedModels = (models: OpenRouterModel[]): void => {
  try {
    const data: CachedData = { models, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore cache errors
  }
};

export const useOpenRouterModels = (apiKey?: string): UseOpenRouterModelsReturn => {
  // Try to initialize with cached data
  const [models, setModels] = useState<OpenRouterModel[]>(() => getCachedModels() || []);
  const [isLoading, setIsLoading] = useState(() => !getCachedModels());
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const hasLoaded = useRef(!!getCachedModels());

  const loadModels = useCallback(async () => {
    // Skip if we already have cached models on first load
    if (hasLoaded.current && models.length > 0) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const service = apiKey 
        ? (await import('@/lib/openrouter')).createOpenRouterService(apiKey)
        : openRouterService;
      
      const fetchedModels = await service.fetchModels();
      
      if (isMounted.current) {
        setModels(fetchedModels);
        setCachedModels(fetchedModels);
        hasLoaded.current = true;
      }
    } catch (err) {
      if (isMounted.current) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load models';
        setError(errorMessage);
        console.error('Error loading OpenRouter models:', err);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [apiKey, models.length]);

  useEffect(() => {
    isMounted.current = true;
    
    // Load models if not cached
    if (!hasLoaded.current) {
      void loadModels();
    }

    return () => {
      isMounted.current = false;
    };
  }, [loadModels]);

  // Memoized LLM configs
  const llmConfigs: LLMConfig[] = models.map(model => ({
    provider: 'openrouter',
    name: model.id,
    base_url: 'https://openrouter.ai/api/v1',
  }));

  const refresh = useCallback(async () => {
    hasLoaded.current = false;
    localStorage.removeItem(CACHE_KEY);
    await loadModels();
  }, [loadModels]);

  return {
    models,
    llmConfigs,
    isLoading,
    error,
    refresh,
  };
};
