import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShaderAnimation } from '@/components/shader-animation';
import { Typewriter } from '@/components/ui/typewriter';
import { ModelSelector } from '@/components/ui/model-selector';
import { Link2, CornerDownLeft } from 'lucide-react';
import floAIAPI from '@/lib/api';
import { useDesignerStore } from '@/store/designerStore';

// Styles personnalisés pour forcer les bordures noires sur toute la landing page
const landingPageStyles = `
  .landing-page :global(.border-input) {
    border-color: black !important;
  }
  .landing-page button:focus {
    border-color: black !important;
    box-shadow: 0 0 0 1px black !important;
    outline: none !important;
  }
  .landing-page input:focus {
    border-color: black !important;
    box-shadow: 0 0 0 1px black !important;
    outline: none !important;
  }
  .landing-page [data-radix-select-trigger]:focus {
    border-color: black !important;
    box-shadow: 0 0 0 1px black !important;
    outline: none !important;
  }
`;

interface LandingPageProps {
  onStartDesigning: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartDesigning }) => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const importWorkflowWithAnimation = useDesignerStore((state) => state.importWorkflowWithAnimation);
  const setGeneratingWorkflow = useDesignerStore((state) => state.setGeneratingWorkflow);
  const selectedModelId = useDesignerStore((state) => state.selectedModelId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);

    // Ouvre le studio immédiatement après 2-3 secondes pour une meilleure UX
    setTimeout(() => {
      onStartDesigning();
    }, 2500); // 2.5 secondes

    // Fait l'appel API en arrière-plan
    const generateWorkflow = async () => {
      try {
        // Indique que la génération est en cours dans le store
        setGeneratingWorkflow(true);

        const response = await floAIAPI.generateStudioWorkflow({ prompt, model: selectedModelId });

        if (response.status === 'success' && (response.data as any)?.yaml) {
          const yamlContent = (response.data as any).yaml as string;
          try {
            await importWorkflowWithAnimation(yamlContent);
          } catch (yamlError) {
            console.error('Failed to import generated YAML workflow:', yamlError);
          }
        } else {
          console.error('Failed to generate workflow from AI:', response.error || response.data);
        }
      } catch (error) {
        console.error('AI workflow generation failed:', error);
      } finally {
        // Arrête l'indicateur de génération
        setGeneratingWorkflow(false);
        setIsLoading(false);
      }
    };

    void generateWorkflow();
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = e.target.files ? Array.from(e.target.files) : [];
    if (newFiles.length > 0) {
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: landingPageStyles }} />
      <div className="relative min-h-screen w-full bg-gray-900 overflow-hidden landing-page">
      {/* Bordure extérieure - effet de carte flottante */}
      <div className="absolute inset-0 bg-gray-900" style={{ padding: '15px' }}>
        <div className="w-full h-full bg-black rounded-[35px] shadow-2xl">
          {/* Contenu intérieur avec espace */}
          <div className="w-full h-full rounded-[30px] overflow-hidden relative">
            <ShaderAnimation />
            <div className="relative z-10 w-full max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center space-y-12 px-4">
              {/* Logo + Tagline */}
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

              {/* Prompt Bar (like screenshot) */}
              <form onSubmit={handleSubmit} className="w-full max-w-4xl">
                <div className="flex flex-col gap-3">
                  {/* Model Selector Row */}
                  <div className="flex justify-center">
                    <ModelSelector />
                  </div>

                  {/* Main Prompt Bar */}
                  <div className="flex items-center gap-4 rounded-3xl bg-neutral-900 border-16 border-black px-6 py-3">
                    {/* Left icons */}
                    <div className="flex items-center gap-4 text-neutral-400">
                      <button
                        type="button"
                        onClick={handleFileClick}
                        className="hover:text-neutral-200 transition-colors"
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

                    {/* Prompt input */}
                    <input
                      type="text"
                      placeholder=""
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="flex-1 bg-transparent border-0 outline-none text-base text-neutral-100"
                    />

                    {/* Send button */}
              <Button
                type="submit"
                size="icon"
                disabled={isLoading}
                className="h-9 w-9 rounded-full bg-neutral-200 text-neutral-900 hover:bg-white shrink-0 disabled:opacity-60 disabled:hover:bg-neutral-200 border-8 border-black focus:border-black focus:ring-0 focus:ring-black !border-black"
              >
                      <CornerDownLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </form>

              {files.length > 0 && (
                <div className="w-full max-w-3xl text-xs text-neutral-300/80 mt-2 border-8 border-black rounded-lg px-3 py-2 bg-black">
                  {files.length === 1
                    ? `1 fichier ajouté : ${files[0].name}`
                    : `${files.length} fichiers ajoutés`}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default LandingPage;
