import React, { useRef, useState, useCallback, memo, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Typewriter } from '@/components/ui/typewriter';
import { ModelSelector } from '@/components/ui/model-selector';
import { Link2, CornerDownLeft, Loader2, Library } from 'lucide-react';
import floAIAPI from '@/lib/api';
import { useDesignerStore } from '@/store/designerStore';

// Lazy load shader for better initial load
const ShaderAnimation = lazy(() => 
  import('@/components/shader-animation').then(m => ({ default: m.ShaderAnimation }))
);

// Simple loading fallback
const ShaderFallback = memo(() => (
  <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 animate-pulse" />
));
ShaderFallback.displayName = 'ShaderFallback';

interface LandingPageProps {
  onStartDesigning: () => void;
}

const LandingPage: React.FC<LandingPageProps> = memo(({ onStartDesigning }) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Optimized store selectors - only subscribe to what we need
  const importWorkflowWithAnimation = useDesignerStore(state => state.importWorkflowWithAnimation);
  const setGeneratingWorkflow = useDesignerStore(state => state.setGeneratingWorkflow);
  const selectedModelId = useDesignerStore(state => state.selectedModelId);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isLoading) return;

    setIsLoading(true);
    setGeneratingWorkflow(true);

    try {
      // Appel API optimisé
      const response = await floAIAPI.generateStudioWorkflow({ 
        prompt: trimmedPrompt, 
        model: selectedModelId 
      });

      let yamlContent: string | null = null;
      
      if (response.status === 'success' && response.data) {
        const apiData = response.data as { yaml?: string; status?: string };
        yamlContent = apiData.yaml || null;
      }

      // Ouvrir le studio immédiatement
      onStartDesigning();

      if (yamlContent) {
        // Nettoyer le YAML
        const cleanedYaml = yamlContent
          .replace(/^```yaml\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        
        // Import différé pour laisser le studio se monter
        requestAnimationFrame(() => {
          setTimeout(async () => {
            try {
              await importWorkflowWithAnimation(cleanedYaml);
            } catch (err) {
              console.error('Import error:', err);
            }
          }, 500);
        });
      }
    } catch (error) {
      console.error('Workflow generation error:', error);
      onStartDesigning();
    } finally {
      setGeneratingWorkflow(false);
      setIsLoading(false);
    }
  }, [prompt, isLoading, selectedModelId, onStartDesigning, setGeneratingWorkflow, importWorkflowWithAnimation]);

  const handleFileClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files;
    if (newFiles?.length) {
      setFiles(prev => [...prev, ...Array.from(newFiles)]);
    }
  }, []);

  const handlePromptChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-gray-900 overflow-hidden">
      <div className="absolute inset-0 bg-gray-900" style={{ padding: 15 }}>
        <div className="w-full h-full bg-black rounded-[35px] shadow-2xl">
          <div className="w-full h-full rounded-[30px] overflow-hidden relative">
            <Suspense fallback={<ShaderFallback />}>
              <ShaderAnimation />
            </Suspense>
            
            <div className="relative z-10 w-full max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center space-y-12 px-4">
              <div className="text-center space-y-4">
                <Typewriter
                  text={[
                    'Stop building complex workflows, one prompt is enough',
                    'Describe what you want, we build it for you',
                  ]}
                  loop
                  speed={80}
                  deleteSpeed={40}
                  delay={1600}
                  className="block text-lg md:text-xl font-semibold text-gray-100/90 drop-shadow-md"
                />
              </div>

              <form onSubmit={handleSubmit} className="w-full max-w-4xl">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-center">
                    <ModelSelector />
                  </div>

                  <div className="flex items-center gap-4 rounded-3xl bg-neutral-900 px-6 py-3">
                    <div className="flex items-center gap-4 text-neutral-400">
                      <button
                        type="button"
                        onClick={handleFileClick}
                        className="hover:text-neutral-200 transition-colors"
                        aria-label="Attach file"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFilesChange}
                      />
                    </div>

                    <input
                      type="text"
                      placeholder="Describe your automation..."
                      value={prompt}
                      onChange={handlePromptChange}
                      className="flex-1 bg-transparent border-0 outline-none text-base text-neutral-100 placeholder:text-neutral-500"
                      disabled={isLoading}
                    />

                    <Button
                      type="submit"
                      size="icon"
                      disabled={isLoading || !prompt.trim()}
                      className="h-9 w-9 rounded-full bg-neutral-200 text-neutral-900 hover:bg-white shrink-0 disabled:opacity-60"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CornerDownLeft className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>

              {/* AI Agent Library Button */}
              <a
                href="https://2c4e1142.n8n-react-app.pages.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-800/50 hover:bg-neutral-700/50 text-neutral-300 hover:text-white text-sm transition-all duration-200 backdrop-blur-sm"
              >
                <Library className="w-4 h-4" />
                <span>AI Agent Library</span>
              </a>

              {files.length > 0 && (
                <div className="w-full max-w-3xl text-xs text-neutral-300/80 mt-2 rounded-lg px-3 py-2 bg-black/50">
                  {files.length === 1
                    ? `1 file attached: ${files[0].name}`
                    : `${files.length} files attached`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

LandingPage.displayName = 'LandingPage';

export default LandingPage;
