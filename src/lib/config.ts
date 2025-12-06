// Configuration pour Aurora AI Studio
// ⚠️ Vite expose les variables d'env côté front via `import.meta.env`
const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'https://flo-nusb.onrender.com';

// OpenRouter API Key - Production key
// Must be set via environment variable VITE_OPENROUTER_API_KEY
const OPENROUTER_API_KEY = 
  (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';

export const config = {
  // URL de l'API backend
  API_BASE_URL,

  // OpenRouter API Key
  OPENROUTER_API_KEY,

  // Configuration des providers LLM
  LLM_PROVIDERS: {
    openai: {
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
      defaultModel: 'gpt-4o-mini'
    },
    anthropic: {
      models: ['claude-3-5-sonnet-20240620', 'claude-3-haiku-20240307'],
      defaultModel: 'claude-3-5-sonnet-20240620'
    },
    gemini: {
      models: ['gemini-2.5-flash', 'gemini-1.5-pro'],
      defaultModel: 'gemini-2.5-flash'
    },
    openrouter: {
      models: [], // Will be loaded dynamically from OpenRouter API
      defaultModel: 'openai/gpt-4o-mini'
    }
  },

  // Limites de l'interface
  MAX_WORKFLOW_NODES: 50,
  MAX_PROMPT_LENGTH: 10000,

  // Timeout pour les requêtes API (en ms)
  API_TIMEOUT: 30000
};

export default config;
