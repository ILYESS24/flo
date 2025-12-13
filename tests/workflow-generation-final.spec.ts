import { test, expect } from '@playwright/test';

test.describe('Test Final - Génération de Workflow', () => {
  test('Test complet: Envoi prompt → Génération workflow dans studio', async ({ page }) => {
    // Activer les logs de la console
    page.on('console', msg => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', error => console.error(`[BROWSER ERROR] ${error.message}`));
    
    // Intercepter les requêtes réseau
    page.on('request', request => {
      if (request.url().includes('/studio/ai-workflow')) {
        console.log(`[REQUEST] POST ${request.url()}`);
        console.log(`[REQUEST] Body: ${request.postData()}`);
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/studio/ai-workflow')) {
        console.log(`[RESPONSE] ${response.status()} ${response.url()}`);
        response.text().then(text => {
          console.log(`[RESPONSE] Body: ${text.substring(0, 500)}`);
        }).catch(() => {});
      }
    });

    console.log('📝 Étape 1: Chargement de la page d\'accueil...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/Flo AI Studio/);
    console.log('✅ Page chargée');

    console.log('📝 Étape 2: Attente du chargement complet de l\'interface...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Attendre que les modèles se chargent
    
    // Vérifier que le sélecteur de modèle est visible
    const modelSelector = page.locator('[data-radix-select-trigger]');
    await expect(modelSelector).toBeVisible({ timeout: 15000 });
    console.log('✅ Sélecteur de modèle visible');

    // Attendre que les modèles soient chargés (plus de "Loading models...")
    console.log('📝 Étape 3: Vérification du chargement des modèles...');
    const modelText = await modelSelector.textContent({ timeout: 10000 });
    console.log(`📝 Texte du sélecteur: "${modelText}"`);
    
    if (modelText?.includes('Loading') || !modelText?.trim() || modelText === 'Model AI') {
      console.log('📝 Ouverture du sélecteur pour charger les modèles...');
      await modelSelector.click({ timeout: 5000 });
      await page.waitForSelector('[data-radix-select-content]', { timeout: 10000 });
      
      // Attendre qu'il y ait des modèles disponibles
      const modelItems = page.locator('[data-radix-select-item]');
      const modelCount = await modelItems.count({ timeout: 10000 });
      console.log(`📝 ${modelCount} modèles disponibles`);
      
      if (modelCount > 0) {
        const firstModel = modelItems.first();
        const firstModelText = await firstModel.textContent();
        console.log(`📝 Sélection du modèle: ${firstModelText}`);
        await firstModel.click({ timeout: 5000 });
        await page.waitForTimeout(1000); // Attendre la sélection
      } else {
        console.log('⚠️ Aucun modèle disponible, utilisation du modèle par défaut');
      }
    } else {
      console.log(`✅ Modèle déjà sélectionné: ${modelText}`);
    }

    console.log('📝 Étape 4: Saisie du prompt...');
    const promptInput = page.locator('input[placeholder=""]');
    await expect(promptInput).toBeVisible({ timeout: 10000 });
    
    const testPrompt = 'Create a simple workflow with one agent that greets users';
    await promptInput.fill(testPrompt);
    await expect(promptInput).toHaveValue(testPrompt);
    console.log(`✅ Prompt saisi: "${testPrompt}"`);

    console.log('📝 Étape 5: Envoi du prompt...');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 5000 });
    await submitButton.click();
    console.log('✅ Bouton d\'envoi cliqué');

    console.log('📝 Étape 6: Attente de l\'ouverture du studio (2.5s)...');
    await page.waitForTimeout(3000); // Attendre l'ouverture automatique du studio

    // Vérifier que le studio s'est ouvert
    console.log('📝 Étape 7: Vérification de l\'ouverture du studio...');
    try {
      // Chercher différents indicateurs que le studio est ouvert
      const studioIndicators = [
        page.locator('text=Aurora AI Studio'),
        page.locator('text=Visual Workflow Designer'),
        page.locator('.react-flow'),
        page.locator('[data-testid="react-flow"]'),
      ];
      
      let studioOpened = false;
      for (const indicator of studioIndicators) {
        try {
          await expect(indicator).toBeVisible({ timeout: 5000 });
          console.log('✅ Studio ouvert détecté');
          studioOpened = true;
          break;
        } catch {
          // Continuer avec le prochain indicateur
        }
      }
      
      if (!studioOpened) {
        console.log('⚠️ Studio pas encore ouvert, vérification de l\'URL...');
        const currentUrl = page.url();
        console.log(`📝 URL actuelle: ${currentUrl}`);
      }
    } catch (error) {
      console.log(`⚠️ Erreur lors de la vérification du studio: ${error}`);
    }

    console.log('📝 Étape 8: Attente de la génération du workflow (max 60s)...');
    // Attendre la génération du workflow
    await page.waitForTimeout(5000); // Attendre initialement
    
    // Vérifier les nodes sur le canvas
    let nodeCount = 0;
    let attempts = 0;
    const maxAttempts = 12; // 12 * 5s = 60s max
    
    while (attempts < maxAttempts) {
      try {
        const nodes = page.locator('.react-flow__node');
        nodeCount = await nodes.count({ timeout: 2000 });
        
        if (nodeCount > 0) {
          console.log(`✅ Workflow généré avec succès! ${nodeCount} node(s) créé(s)`);
          break;
        }
        
        // Vérifier s'il y a des messages d'erreur
        const errorMessages = page.locator('text=/error|Error|erreur|Erreur/');
        const errorCount = await errorMessages.count();
        if (errorCount > 0) {
          const errorText = await errorMessages.first().textContent();
          console.log(`❌ Erreur détectée: ${errorText}`);
          throw new Error(`Erreur dans l'interface: ${errorText}`);
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          console.log(`⏳ Tentative ${attempts}/${maxAttempts}: Aucun node trouvé, attente de 5s...`);
          await page.waitForTimeout(5000);
        }
      } catch (error) {
        console.log(`⚠️ Erreur lors de la vérification: ${error}`);
        attempts++;
        if (attempts < maxAttempts) {
          await page.waitForTimeout(5000);
        }
      }
    }

    // Vérifier le résultat final
    if (nodeCount > 0) {
      console.log(`\n🎉 SUCCÈS: Workflow généré avec ${nodeCount} node(s)!`);
      expect(nodeCount).toBeGreaterThan(0);
      
      // Prendre une capture d'écran pour documentation
      await page.screenshot({ path: 'test-results/workflow-generated.png', fullPage: true });
      console.log('📸 Capture d\'écran sauvegardée: test-results/workflow-generated.png');
    } else {
      console.log('\n❌ ÉCHEC: Aucun workflow généré après 60 secondes');
      console.log('📝 Vérification des logs de la console...');
      
      // Prendre une capture d'écran pour debug
      await page.screenshot({ path: 'test-results/workflow-failed.png', fullPage: true });
      console.log('📸 Capture d\'écran de debug sauvegardée: test-results/workflow-failed.png');
      
      // Vérifier les logs de la console
      const consoleLogs = await page.evaluate(() => {
        return (window as any).consoleLogs || [];
      });
      
      if (consoleLogs.length > 0) {
        console.log('📝 Logs de la console:');
        consoleLogs.forEach((log: string) => console.log(`  ${log}`));
      }
      
      throw new Error('Le workflow n\'a pas été généré dans le délai imparti');
    }
  });
});

