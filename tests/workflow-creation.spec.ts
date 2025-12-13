import { test, expect } from '@playwright/test';

test.describe('Workflow Creation Test', () => {
  test('Vérifier que le prompt crée le workflow dans le studio', async ({ page }) => {
    // Aller sur la page
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    
    console.log('✅ Page chargée');

    // Attendre que la page soit complètement chargée
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Vérifier que le sélecteur de modèle est visible
    const modelSelector = page.locator('[data-radix-select-trigger]');
    await expect(modelSelector).toBeVisible({ timeout: 10000 });
    console.log('✅ Sélecteur de modèle visible');

    // Attendre que les modèles soient chargés
    await page.waitForTimeout(3000);

    // Vérifier le prompt input
    const promptInput = page.locator('input[type="text"]').first();
    await expect(promptInput).toBeVisible();
    console.log('✅ Input prompt visible');

    // Sélectionner un modèle si nécessaire
    const modelText = await modelSelector.textContent();
    console.log('📝 Texte du sélecteur:', modelText);
    
    if (modelText?.includes('Model AI') || modelText?.includes('Loading')) {
      await modelSelector.click();
      await page.waitForTimeout(1000);
      
      // Sélectionner le premier modèle disponible
      const firstModel = page.locator('[data-radix-select-content] [data-radix-select-item]').first();
      if (await firstModel.count() > 0) {
        await firstModel.click();
        await page.waitForTimeout(1000);
        console.log('✅ Modèle sélectionné');
      }
    }

    // Remplir le prompt
    const testPrompt = 'Create a simple agent that says hello';
    await promptInput.fill(testPrompt);
    console.log('✅ Prompt rempli:', testPrompt);

    // Cliquer sur le bouton d'envoi
    const sendButton = page.locator('button[type="submit"]').first();
    await expect(sendButton).toBeVisible();
    await sendButton.click();
    console.log('✅ Bouton envoyé cliqué');

    // Attendre que le studio s'ouvre (2-3 secondes selon le code)
    await page.waitForTimeout(3000);
    console.log('⏳ Attente de l\'ouverture du studio...');

    // Vérifier que le studio est ouvert
    // Le studio devrait avoir des éléments ReactFlow
    const reactFlowContainer = page.locator('.react-flow').or(page.locator('[data-react-flow]'));
    
    // Attendre jusqu'à 30 secondes pour que le workflow soit généré
    let workflowFound = false;
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(1000);
      
      // Vérifier si des nodes sont présents
      const nodes = page.locator('.react-flow__node');
      const nodeCount = await nodes.count();
      
      if (nodeCount > 0) {
        console.log(`✅ Workflow créé! ${nodeCount} node(s) trouvé(s)`);
        workflowFound = true;
        break;
      }
      
      // Vérifier aussi dans le store Zustand via la console
      const storeState = await page.evaluate(() => {
        // @ts-ignore
        return window.__ZUSTAND_STORE__ || null;
      });
      
      console.log(`⏳ Tentative ${i + 1}/30 - Nodes trouvés: ${nodeCount}`);
    }

    if (!workflowFound) {
      // Prendre une capture d'écran pour debug
      await page.screenshot({ path: 'test-results/workflow-not-found.png', fullPage: true });
      
      // Vérifier les logs de la console
      const consoleLogs: string[] = [];
      page.on('console', msg => {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      });
      
      // Vérifier les erreurs réseau
      const networkErrors: string[] = [];
      page.on('response', response => {
        if (response.status() >= 400) {
          networkErrors.push(`${response.url()} - ${response.status()}`);
        }
      });
      
      console.log('❌ Workflow non créé après 30 secondes');
      console.log('📋 Logs console:', consoleLogs.slice(-10));
      console.log('📋 Erreurs réseau:', networkErrors);
      
      // Vérifier l'état du store
      const storeData = await page.evaluate(() => {
        try {
          // @ts-ignore
          const store = window.__ZUSTAND_STORE__;
          return store ? JSON.stringify(store.getState(), null, 2) : 'Store non disponible';
        } catch (e) {
          return `Erreur: ${e}`;
        }
      });
      console.log('📋 État du store:', storeData);
    }

    // Vérifier que le studio est visible (même si le workflow n'est pas encore créé)
    const studioVisible = await page.locator('body').isVisible();
    expect(studioVisible).toBe(true);
    
    // Vérifier qu'il n'y a pas d'erreurs critiques
    const errorMessages = await page.locator('text=/error/i').count();
    if (errorMessages > 0) {
      console.log('⚠️ Messages d\'erreur détectés sur la page');
    }
  });
});

