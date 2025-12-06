# Guide de Déploiement - Aurora AI Studio sur Render

## 🚀 Déploiement Rapide sur Render

### Option 1 : Déploiement Manuel (Recommandé)

#### Étape 1 : Créer le Static Site

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Cliquez sur **"New +"** → **"Static Site"**
3. Connectez votre repository GitHub :
   - **Repository** : `https://github.com/ILYESS24/flo`
   - **Branch** : `studio-frontend`

#### Étape 2 : Configuration

Remplissez les champs suivants :

- **Name** : `aurora-ai-studio` (ou le nom de votre choix)
- **Branch** : `studio-frontend`
- **Root Directory** : (laissez vide)
- **Build Command** : `pnpm install && pnpm build`
- **Publish Directory** : `dist`

#### Étape 3 : Variables d'Environnement

**IMPORTANT** : Ajoutez ces variables AVANT de créer le site (cliquez sur "Advanced" pour les voir) :

1. Cliquez sur **"Advanced"** pour voir les options avancées
2. Dans **"Environment Variables"**, ajoutez :

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://flo-nusb.onrender.com` |
   | `VITE_OPENROUTER_API_KEY` | `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` |

   ⚠️ **Note** : Remplacez la clé OpenRouter par la vôtre si nécessaire.

#### Étape 4 : Créer le Site

1. Cliquez sur **"Create Static Site"**
2. Render va automatiquement :
   - Cloner le repository
   - Installer les dépendances avec `pnpm`
   - Builder l'application avec `pnpm build`
   - Déployer le contenu du dossier `dist`

#### Étape 5 : Accès à l'Interface

Une fois déployé (2-5 minutes), Render vous donnera une URL comme :
```
https://aurora-ai-studio.onrender.com
```

🎉 **Votre interface sera accessible publiquement à cette URL !**

---

### Option 2 : Déploiement via render.yaml (Avancé)

Si vous préférez utiliser le fichier `render.yaml` :

1. Allez sur [Render Dashboard](https://dashboard.render.com/)
2. Cliquez sur **"New +"** → **"Blueprint"**
3. Connectez le repository : `https://github.com/ILYESS24/flo`
4. Sélectionnez la branche : `studio-frontend`
5. Render détectera automatiquement le fichier `render.yaml`

⚠️ **Note** : Vous devrez quand même configurer `VITE_OPENROUTER_API_KEY` manuellement dans le dashboard.

---

## ✅ Vérification après Déploiement

Une fois déployé, vérifiez que :

1. ✅ L'interface se charge correctement à l'URL fournie
2. ✅ Les modèles OpenRouter sont chargés (ouvrez la console du navigateur F12)
3. ✅ L'API backend est accessible (testez en créant un workflow)

## 🔧 Dépannage

### Le build échoue

- Vérifiez que `pnpm` est disponible (Render l'installe automatiquement)
- Vérifiez les logs de build dans le dashboard Render
- Assurez-vous que toutes les variables d'environnement sont configurées

### L'interface ne charge pas les modèles OpenRouter

- Vérifiez que `VITE_OPENROUTER_API_KEY` est bien configurée
- Vérifiez la console du navigateur pour les erreurs
- Assurez-vous que la clé API est valide

### Erreurs CORS

- Vérifiez que votre API backend (`https://flo-nusb.onrender.com`) autorise les requêtes depuis votre domaine Render
- Vérifiez la configuration CORS dans `api.py`

## 📝 Notes Importantes

- ⚠️ Les variables d'environnement doivent être configurées AVANT le premier build
- 🔄 Si vous changez les variables d'environnement, Render redéploiera automatiquement
- 📝 L'URL de l'API backend doit être accessible publiquement (pas de localhost)
- 🔒 Ne commitez JAMAIS votre clé API OpenRouter dans le code (elle est déjà sécurisée via les variables d'environnement)

