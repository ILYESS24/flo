# Configuration OpenRouter

Cette application est configurée pour utiliser OpenRouter, qui donne accès à tous les modèles LLM disponibles via une seule API.

## Clé API OpenRouter

La clé API de production est déjà configurée dans le code :
```
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
```

## Configuration

### Variables d'environnement

Vous pouvez également définir la clé API via une variable d'environnement :

```bash
# Dans un fichier .env.local (pour le développement)
VITE_OPENROUTER_API_KEY=sk-or-v1-votre-cle-api
```

### Chargement automatique des modèles

Les modèles OpenRouter sont automatiquement chargés au démarrage de l'application via l'API OpenRouter. Cela donne accès à **tous les modèles disponibles** sur OpenRouter, incluant :

- Tous les modèles OpenAI (GPT-4, GPT-3.5, etc.)
- Tous les modèles Anthropic (Claude 3.5, Claude 3, etc.)
- Tous les modèles Google (Gemini, etc.)
- Tous les modèles Meta (Llama, etc.)
- Et bien d'autres...

## Utilisation dans l'interface

1. **Créer un Agent** : Sélectionnez "OpenRouter (All Models)" comme provider
2. **Sélectionner un modèle** : Tous les modèles OpenRouter seront listés avec leur format `provider/model-name`
3. **Créer un Router** : Même processus, sélectionnez OpenRouter comme provider

## Format des modèles

Les modèles OpenRouter utilisent le format : `provider/model-name`

Exemples :
- `openai/gpt-4o`
- `anthropic/claude-3-5-sonnet-20240620`
- `google/gemini-pro`
- `meta-llama/llama-3-70b-instruct`

## Export YAML

Lors de l'export YAML, les modèles OpenRouter incluront automatiquement :
- `provider: openrouter`
- `name: provider/model-name`
- `base_url: https://openrouter.ai/api/v1`

## Documentation OpenRouter

Pour plus d'informations sur OpenRouter :
- [Documentation OpenRouter](https://openrouter.ai/docs)
- [Liste des modèles disponibles](https://openrouter.ai/models)

