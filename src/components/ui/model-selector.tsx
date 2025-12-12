import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOpenRouterModels } from '@/hooks/useOpenRouterModels';
import { useDesignerStore } from '@/store/designerStore';
import { OpenRouterModel } from '@/lib/openrouter';
import { config } from '@/lib/config';
import { Brain, Loader2 } from 'lucide-react';

// Styles personnalisés pour forcer les bordures noires
const customSelectStyles = `
  [data-radix-select-trigger] {
    border-color: black !important;
  }
  [data-radix-select-trigger]:focus {
    border-color: black !important;
    box-shadow: 0 0 0 1px black !important;
    outline: none !important;
  }
  [data-radix-select-content] {
    border-color: black !important;
  }
`;

interface ModelSelectorProps {
  className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ className }) => {
  const { models, isLoading, error } = useOpenRouterModels(config.OPENROUTER_API_KEY || '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');
  const { selectedModelId, setSelectedModel } = useDesignerStore();
  const [groupedModels, setGroupedModels] = useState<Record<string, OpenRouterModel[]>>({});

  useEffect(() => {
    if (models.length > 0) {
      const grouped: Record<string, OpenRouterModel[]> = {};

      models.forEach(model => {
        // Extract provider from model id (e.g., "openai/gpt-4o" -> "openai")
        const provider = model.id.split('/')[0] || 'other';
        if (!grouped[provider]) {
          grouped[provider] = [];
        }
        grouped[provider].push(model);
      });

      // Sort providers alphabetically, with popular ones first
      const sortedProviders = Object.keys(grouped).sort((a, b) => {
        const priorityProviders = ['openai', 'anthropic', 'google', 'meta', 'mistral'];
        const aPriority = priorityProviders.indexOf(a);
        const bPriority = priorityProviders.indexOf(b);

        if (aPriority !== -1 && bPriority !== -1) return aPriority - bPriority;
        if (aPriority !== -1) return -1;
        if (bPriority !== -1) return 1;
        return a.localeCompare(b);
      });

      const sortedGrouped: Record<string, OpenRouterModel[]> = {};
      sortedProviders.forEach(provider => {
        sortedGrouped[provider] = grouped[provider].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });

      setGroupedModels(sortedGrouped);
    }
  }, [models]);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const getModelDisplayName = (model: OpenRouterModel) => {
    const modelName = model.name || model.id.split('/').slice(1).join('/');

    // Format context length nicely
    const contextLength = model.context_length;
    let contextDisplay = '';
    if (contextLength >= 1000000) {
      contextDisplay = `${(contextLength / 1000000).toFixed(1)}M`;
    } else if (contextLength >= 1000) {
      contextDisplay = `${(contextLength / 1000).toFixed(0)}K`;
    } else {
      contextDisplay = contextLength.toString();
    }

    return `${modelName} (${contextDisplay} ctx)`;
  };

  if (error) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm ${className}`}>
        <Brain className="w-4 h-4" />
        <span>Erreur modèles IA</span>
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customSelectStyles }} />
      <div className={`flex items-center gap-2 ${className}`}>
      <Brain className="w-4 h-4 text-neutral-500" />
      <Select value={selectedModelId} onValueChange={handleModelChange} disabled={isLoading}>
        <SelectTrigger className="h-9 bg-neutral-900 border-4 border-black text-neutral-100 hover:bg-neutral-800 focus:ring-0 focus:ring-offset-0 focus:border-black focus:ring-black focus:outline-none min-w-[200px] !border-black !ring-0 !ring-black">
          <SelectValue placeholder={isLoading ? "Chargement..." : "Model AI"}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[400px] bg-neutral-900 border-4 border-black !border-black">
          {Object.entries(groupedModels).map(([provider, providerModels]) => (
            <div key={provider}>
              <div className="px-2 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wide border-b border-neutral-700">
                {provider === 'other' ? 'Autres' : provider}
              </div>
              {providerModels.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className="text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800 cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{getModelDisplayName(model)}</span>
                    {model.description && (
                      <span className="text-xs text-neutral-400 truncate max-w-[300px]">
                        {model.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
    </>
  );
};
