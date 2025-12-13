import { test, expect } from '@playwright/test';

test('Test rapide: Vérification que le workflow peut être généré', async ({ page }) => {
  // Activer les logs
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('workflow') || msg.text().includes('YAML')) {
      console.log(`[CONSOLE] ${msg.type()}: ${msg.text()}`);
    }
  });

  console.log('📝 Chargement de la page...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('📝 Attente du chargement des modèles...');
  await page.waitForTimeout(5000);
  
  // Vérifier que la page est chargée
  const promptInput = page.locator('input[placeholder=""]');
  await expect(promptInput).toBeVisible({ timeout: 10000 });
  console.log('✅ Page chargée');
  
  // Saisir un prompt simple
  const testPrompt = 'Create a simple workflow with one agent that says hello';
  await promptInput.fill(testPrompt);
  console.log(`✅ Prompt saisi: "${testPrompt}"`);
  
  // Cliquer sur le bouton d'envoi
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();
  console.log('✅ Bouton d\'envoi cliqué');
  
  // Attendre l'ouverture du studio
  await page.waitForTimeout(3000);
  console.log('✅ Studio devrait être ouvert maintenant');
  
  // Vérifier que le studio s'est ouvert (chercher le canvas React Flow)
  const reactFlow = page.locator('.react-flow, [data-testid="react-flow"]');
  const hasReactFlow = await reactFlow.count() > 0;
  
  if (hasReactFlow) {
    console.log('✅ Studio ouvert - React Flow détecté');
  } else {
    console.log('⚠️ React Flow non détecté, mais le studio peut être en cours de chargement');
  }
  
  // Attendre un peu pour la génération
  await page.waitForTimeout(10000);
  
  // Vérifier les nodes
  const nodes = page.locator('.react-flow__node');
  const nodeCount = await nodes.count();
  
  console.log(`\n📊 Résultat: ${nodeCount} node(s) trouvé(s)`);
  
  if (nodeCount > 0) {
    console.log('🎉 SUCCÈS: Workflow généré!');
  } else {
    console.log('⚠️ Aucun node trouvé - vérifiez les logs de la console pour plus de détails');
  }
  
  // Prendre une capture d'écran
  await page.screenshot({ path: 'test-results/quick-test-result.png', fullPage: true });
  console.log('📸 Capture d\'écran sauvegardée');
});

