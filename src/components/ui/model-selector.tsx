import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDesignerStore } from '@/store/designerStore';
import { config } from '@/lib/config';
import { Brain, Loader2 } from 'lucide-react';
import { useOpenRouterModels } from '@/hooks/useOpenRouterModels';
import { openRouterService } from '@/lib/openrouter';

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
  const { selectedModelId, setSelectedModel } = useDesignerStore();
  const { models, isLoading, error } = useOpenRouterModels();

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  // Group models by provider
  const groupedModels = openRouterService.getGroupedModels(models);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customSelectStyles }} />
      <div className={`flex items-center gap-2 ${className}`}>
        <Brain className="w-4 h-4 text-neutral-500" />
        <Select value={selectedModelId} onValueChange={handleModelChange}>
          <SelectTrigger className="h-9 bg-neutral-900 border-4 border-black text-neutral-100 hover:bg-neutral-800 focus:ring-0 focus:ring-offset-0 focus:border-black focus:ring-black focus:outline-none min-w-[200px] !border-black !ring-0 !ring-black">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading models...</span>
              </div>
            ) : error ? (
              <span className="text-red-400">Error loading models</span>
            ) : (
              <SelectValue placeholder="Model AI" />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-[400px] bg-neutral-900 border-4 border-black !border-black">
            {Object.entries(groupedModels).map(([provider, providerModels]) => (
              <div key={provider}>
                <div className="px-2 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wide border-b border-neutral-700">
                  {provider}
                </div>
                {providerModels.map((model) => (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    className="text-neutral-100 hover:bg-neutral-800 focus:bg-neutral-800 cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {model.name || model.id.split('/')[1] || model.id}
                      </span>
                      <span className="text-xs text-neutral-400 truncate max-w-[300px]">
                        {model.description || `Context: ${model.context_length?.toLocaleString() || 'Unknown'} tokens`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
            {Object.keys(groupedModels).length === 0 && !isLoading && !error && (
              <div className="px-2 py-4 text-center text-neutral-400">
                No models available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    </>
  );
};
