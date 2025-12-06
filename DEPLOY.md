# Guide de Déploiement - Aurora AI Studio

## Déploiement sur Render (Static Site)

### 1. Créer un nouveau Static Site sur Render

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Cliquez sur "New +" → "Static Site"
3. Connectez votre repository GitHub : `https://github.com/ILYESS24/flo`
4. Sélectionnez la branche : `studio-frontend`

### 2. Configuration du Build

- **Name** : `aurora-ai-studio` (ou le nom de votre choix)
- **Branch** : `studio-frontend`
- **Build Command** : `pnpm install && pnpm build`
- **Publish Directory** : `dist`

### 3. Variables d'Environnement

Ajoutez ces variables d'environnement dans les paramètres du Static Site :

- **VITE_API_URL** : L'URL de votre API backend déployée sur Render
  - Exemple : `https://votre-api.onrender.com`
  - ⚠️ N'oubliez pas le `https://` et pas de slash à la fin

- **VITE_OPENROUTER_API_KEY** : Votre clé API OpenRouter
  - Format : `sk-or-v1-...`

### 4. Déploiement

1. Cliquez sur "Create Static Site"
2. Render va automatiquement :
   - Cloner le repository
   - Installer les dépendances avec `pnpm`
   - Builder l'application avec `pnpm build`
   - Déployer le contenu du dossier `dist`

### 5. Accès à l'Interface

Une fois déployé, Render vous donnera une URL comme :
`https://aurora-ai-studio.onrender.com`

Vous pourrez accéder à l'interface Aurora AI Studio à cette URL !

## Notes Importantes

- ⚠️ Les variables d'environnement doivent être configurées AVANT le premier build
- 🔄 Si vous changez les variables d'environnement, Render redéploiera automatiquement
- 📝 L'URL de l'API backend doit être accessible publiquement (pas de localhost)

## Vérification

Une fois déployé, vérifiez que :
1. ✅ L'interface se charge correctement
2. ✅ Les modèles OpenRouter sont chargés (vérifiez dans la console du navigateur)
3. ✅ L'API backend est accessible depuis l'interface

