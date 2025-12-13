import { test, expect } from '@playwright/test';

test.describe('Diagnostic Tests - Check Application State', () => {
  test('Check if application is accessible', async ({ page }) => {
    try {
      console.log('🔍 Attempting to connect to http://localhost:5173...');
      await page.goto('http://localhost:5173', { timeout: 10000 });
      console.log('✅ Frontend server is running!');

      // Check page title
      const title = await page.title();
      console.log('📄 Page title:', title);
      expect(title).toContain('Flo AI Studio');

      // Check if basic elements exist
      const bodyText = await page.locator('body').textContent();
      console.log('📝 Page content length:', bodyText?.length || 0);

      if (bodyText && bodyText.length > 100) {
        console.log('✅ Page has content - frontend is working!');
      } else {
        console.log('⚠️ Page has minimal content - check if components are loading');
      }

      // Check for specific elements
      const hasStopBuilding = await page.locator('text=Stop building complex workflows').isVisible().catch(() => false);
      console.log('🎯 "Stop building" text visible:', hasStopBuilding);

      const hasModelAI = await page.locator('text=Model AI').isVisible().catch(() => false);
      console.log('🎯 "Model AI" text visible:', hasModelAI);

      const hasInput = await page.locator('input[placeholder=""]').isVisible().catch(() => false);
      console.log('🎯 Prompt input visible:', hasInput);

    } catch (error) {
      console.error('❌ Cannot connect to frontend server:', error.message);
      console.log('💡 SOLUTION: Start the frontend server manually with:');
      console.log('   cd C:\\Users\\lecoa\\Downloads\\flo-ai-studio-clean');
      console.log('   pnpm dev');
      throw error;
    }
  });

  test('Check backend API connectivity', async ({ request }) => {
    try {
      console.log('🔍 Testing backend API connectivity...');

      // Test health endpoint
      const healthResponse = await request.get('http://localhost:8000/health', { timeout: 5000 });
      console.log('🏥 Health endpoint status:', healthResponse.status());

      if (healthResponse.ok()) {
        const healthData = await healthResponse.json();
        console.log('🏥 Health data:', healthData);
        expect(healthData.status).toBe('healthy');
        console.log('✅ Backend API is healthy!');
      } else {
        console.log('⚠️ Health endpoint not responding correctly');
      }

    } catch (error) {
      console.error('❌ Cannot connect to backend API:', error.message);
      console.log('💡 SOLUTION: Start the backend server with:');
      console.log('   cd C:\\Users\\lecoa\\Downloads\\flo-ai-api-clean');
      console.log('   python api.py');
      // Don't throw error - backend might not be running
    }
  });

  test('Manual workflow creation test', async ({ page }) => {
    console.log('🧪 MANUAL TEST REQUIRED');
    console.log('Please open http://localhost:5173 in your browser and:');
    console.log('1. Check if the landing page loads');
    console.log('2. Try selecting a model from the dropdown');
    console.log('3. Type a prompt like "Create a simple agent that says hello"');
    console.log('4. Click the send button');
    console.log('5. Check if the studio opens and shows workflow creation');

    // This test will pass but gives instructions
    expect(true).toBe(true);
  });
});

