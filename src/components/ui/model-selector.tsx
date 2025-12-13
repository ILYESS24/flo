import React, { memo, useMemo, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDesignerStore } from '@/store/designerStore';
import { Brain, Loader2 } from 'lucide-react';
import { useOpenRouterModels } from '@/hooks/useOpenRouterModels';
import { openRouterService } from '@/lib/openrouter';

interface ModelSelectorProps {
  className?: string;
}

// Memoized model item to prevent re-renders
const ModelItem = memo(({ model }: { model: { id: string; name: string; description?: string; context_length?: number } }) => (
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
));
ModelItem.displayName = 'ModelItem';

// Memoized provider group
const ProviderGroup = memo(({ provider, models }: { provider: string; models: Array<{ id: string; name: string; description?: string; context_length?: number }> }) => (
  <div key={provider}>
    <div className="px-2 py-1.5 text-xs font-semibold text-neutral-400 uppercase tracking-wide border-b border-neutral-700">
      {provider}
    </div>
    {models.map(model => (
      <ModelItem key={model.id} model={model} />
    ))}
  </div>
));
ProviderGroup.displayName = 'ProviderGroup';

export const ModelSelector: React.FC<ModelSelectorProps> = memo(({ className = '' }) => {
  const selectedModelId = useDesignerStore(state => state.selectedModelId);
  const setSelectedModel = useDesignerStore(state => state.setSelectedModel);
  const { models, isLoading, error } = useOpenRouterModels();

  const handleModelChange = useCallback((modelId: string) => {
    setSelectedModel(modelId);
  }, [setSelectedModel]);

  // Memoize grouped models
  const groupedModels = useMemo(() => 
    openRouterService.getGroupedModels(models),
    [models]
  );

  const groupEntries = useMemo(() => 
    Object.entries(groupedModels),
    [groupedModels]
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Brain className="w-4 h-4 text-neutral-500" />
      <Select value={selectedModelId} onValueChange={handleModelChange}>
        <SelectTrigger className="h-9 bg-neutral-900 border border-neutral-700 text-neutral-100 hover:bg-neutral-800 focus:ring-0 focus:ring-offset-0 min-w-[200px]">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : error ? (
            <span className="text-red-400">Error</span>
          ) : (
            <SelectValue placeholder="Model AI" />
          )}
        </SelectTrigger>
        <SelectContent className="max-h-[400px] bg-neutral-900 border border-neutral-700">
          {groupEntries.map(([provider, providerModels]) => (
            <ProviderGroup key={provider} provider={provider} models={providerModels} />
          ))}
          {groupEntries.length === 0 && !isLoading && !error && (
            <div className="px-2 py-4 text-center text-neutral-400">
              No models available
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
});

ModelSelector.displayName = 'ModelSelector';
