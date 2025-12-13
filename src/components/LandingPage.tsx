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
  .landing-page,
  .landing-page *,
  .landing-page *::before,
  .landing-page *::after {
    border-color: black !important;
  }
  .landing-page div {
    border-color: black !important;
  }
  .landing-page form {
    border-color: black !important;
    border: 2px solid black !important;
  }
  .landing-page form > div {
    border-color: black !important;
    border: 1px solid black !important;
  }
  .landing-page button,
  .landing-page button * {
    border-color: black !important;
  }
  .landing-page button:focus,
  .landing-page button:focus-visible,
  .landing-page button:hover {
    border-color: black !important;
    box-shadow: 0 0 0 2px black !important;
    outline: 2px solid black !important;
    outline-offset: 0 !important;
    ring-color: black !important;
  }
  .landing-page input,
  .landing-page input * {
    border-color: black !important;
  }
  .landing-page input:not([type="file"]):not([type="hidden"]) {
    border: 1px solid black !important;
  }
  .landing-page input:focus,
  .landing-page input:focus-visible {
    border-color: black !important;
    border: 2px solid black !important;
    box-shadow: 0 0 0 2px black !important;
    outline: 2px solid black !important;
    outline-offset: 0 !important;
    ring-color: black !important;
  }
  .landing-page [data-radix-select-trigger],
  .landing-page [data-radix-select-trigger] * {
    border-color: black !important;
  }
  .landing-page [data-radix-select-trigger]:focus,
  .landing-page [data-radix-select-trigger]:focus-visible {
    border-color: black !important;
    box-shadow: 0 0 0 2px black !important;
    outline: 2px solid black !important;
    outline-offset: 0 !important;
    ring-color: black !important;
  }
  .landing-page [data-radix-select-content],
  .landing-page [data-radix-select-content] * {
    border-color: black !important;
  }
  .landing-page [data-radix-select-item] {
    border-color: black !important;
  }
  .landing-page :focus-visible {
    outline: 2px solid black !important;
    outline-offset: 0 !important;
    border-color: black !important;
    box-shadow: 0 0 0 2px black !important;
  }
  .landing-page .border,
  .landing-page [class*="border"] {
    border-color: black !important;
  }
  .landing-page .ring-blue-500,
  .landing-page .ring-blue-600,
  .landing-page .ring-blue-700,
  .landing-page .ring-blue-800,
  .landing-page .ring-blue-900,
  .landing-page [class*="ring-blue"] {
    --tw-ring-color: black !important;
    ring-color: black !important;
  }
  .landing-page .border-blue-500,
  .landing-page .border-blue-600,
  .landing-page .border-blue-700,
  .landing-page .border-blue-800,
  .landing-page .border-blue-900,
  .landing-page [class*="border-blue"] {
    border-color: black !important;
  }
  .landing-page [class*="rounded"] {
    border-color: black !important;
  }
  .landing-page .flex {
    border-color: black !important;
  }
  .landing-page .text-center {
    border-color: black !important;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setGeneratingWorkflow(true);

    try {
      console.log('🚀 Début de la génération du workflow...');
      console.log('📝 Prompt:', prompt);
      console.log('🤖 Modèle sélectionné:', selectedModelId);

      // Appel API pour générer le workflow
      const response = await floAIAPI.generateStudioWorkflow({ prompt, model: selectedModelId });
      console.log('📥 Réponse API complète:', JSON.stringify(response, null, 2));

      // Vérifier la structure de la réponse
      let yamlContent: string | null = null;
      
      if (response.status === 'success' && response.data) {
        // L'API backend retourne { status: "success", yaml: "..." }
        // Le client API enveloppe ça dans { status: 'success', data: { status: "success", yaml: "..." } }
        const apiData = response.data as any;
        
        if (apiData.yaml) {
          yamlContent = apiData.yaml;
        } else if (apiData.status === 'success' && apiData.yaml) {
          yamlContent = apiData.yaml;
        } else if (typeof apiData === 'string') {
          // Si data est directement une string (YAML)
          yamlContent = apiData;
        }
      }

      if (yamlContent) {
        console.log('📄 YAML brut reçu (premiers 500 caractères):', yamlContent.substring(0, 500));
        
        // Nettoyer le YAML (enlever les markdown fences si présents)
        yamlContent = yamlContent
          .replace(/^```yaml\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
        
        console.log('📄 YAML nettoyé (premiers 500 caractères):', yamlContent.substring(0, 500));
        
        // Ouvrir le studio AVANT d'importer le workflow
        console.log('🔄 Ouverture du studio...');
        onStartDesigning();
        
        // Attendre un peu pour que le studio se monte complètement
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          console.log('🔄 Import du workflow dans le studio...');
          await importWorkflowWithAnimation(yamlContent);
          console.log('✅ Workflow importé avec succès!');
        } catch (yamlError) {
          console.error('❌ Erreur lors de l\'import du workflow YAML:', yamlError);
          console.error('📄 YAML qui a causé l\'erreur:', yamlContent);
          if (yamlError instanceof Error) {
            console.error('📝 Détails de l\'erreur:', yamlError.message);
            console.error('📝 Stack:', yamlError.stack);
          }
        }
      } else {
        console.error('❌ Aucun YAML trouvé dans la réponse');
        console.error('📥 Structure de la réponse:', JSON.stringify(response, null, 2));
        // Ouvrir le studio quand même pour que l'utilisateur puisse créer manuellement
        console.log('🔄 Ouverture du studio (mode manuel)...');
        onStartDesigning();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la génération du workflow:', error);
      if (error instanceof Error) {
        console.error('📝 Message d\'erreur:', error.message);
        console.error('📝 Stack trace:', error.stack);
      }
      // Ouvrir le studio quand même en cas d'erreur
      onStartDesigning();
    } finally {
      // Arrête l'indicateur de génération
      setGeneratingWorkflow(false);
      setIsLoading(false);
      console.log('🏁 Génération terminée');
    }
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
      <div className="relative min-h-screen w-full bg-gray-900 overflow-hidden landing-page" style={{ border: '4px solid black' }}>
      {/* Bordure extérieure - effet de carte flottante */}
      <div className="absolute inset-0 bg-gray-900" style={{ padding: '15px', border: '4px solid black' }}>
        <div className="w-full h-full bg-black rounded-[35px] shadow-2xl" style={{ border: '4px solid black' }}>
          {/* Contenu intérieur avec espace */}
          <div className="w-full h-full rounded-[30px] overflow-hidden relative" style={{ border: '2px solid black' }}>
            <ShaderAnimation />
            <div className="relative z-10 w-full max-w-4xl mx-auto min-h-screen flex flex-col items-center justify-center space-y-12 px-4" style={{ border: '2px solid black', borderRadius: '8px', padding: '16px' }}>
              {/* Logo + Tagline */}
              <div className="text-center space-y-4" style={{ border: '1px solid black', borderRadius: '4px', padding: '8px' }}>
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
              <form onSubmit={handleSubmit} className="w-full max-w-4xl" style={{ border: '2px solid black', borderRadius: '8px', padding: '8px' }}>
                <div className="flex flex-col gap-3" style={{ border: '1px solid black', borderRadius: '4px', padding: '4px' }}>
                  {/* Model Selector Row */}
                  <div className="flex justify-center" style={{ border: '1px solid black', borderRadius: '4px', padding: '4px' }}>
                    <ModelSelector />
                  </div>

                  {/* Main Prompt Bar */}
                  <div className="flex items-center gap-4 rounded-3xl bg-neutral-900 border-16 border-black px-6 py-3" style={{ borderColor: 'black', border: '4px solid black' }}>
                    {/* Left icons */}
                    <div className="flex items-center gap-4 text-neutral-400" style={{ border: '1px solid black', borderRadius: '4px', padding: '4px' }}>
                      <button
                        type="button"
                        onClick={handleFileClick}
                        className="hover:text-neutral-200 transition-colors"
                        style={{ border: '1px solid black', borderRadius: '4px', padding: '4px' }}
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
                      style={{ border: '1px solid black', borderRadius: '4px', padding: '8px' }}
                    />

                    {/* Send button */}
              <Button
                type="submit"
                size="icon"
                disabled={isLoading}
                className="h-9 w-9 rounded-full bg-neutral-200 text-neutral-900 hover:bg-white shrink-0 disabled:opacity-60 disabled:hover:bg-neutral-200 border-8 border-black focus:border-black focus:ring-0 focus:ring-black !border-black"
                style={{ borderColor: 'black', border: '4px solid black' }}
              >
                      <CornerDownLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </form>

              {files.length > 0 && (
                <div className="w-full max-w-3xl text-xs text-neutral-300/80 mt-2 border-8 border-black rounded-lg px-3 py-2 bg-black" style={{ borderColor: 'black', border: '4px solid black' }}>
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
