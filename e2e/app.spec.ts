import { test, expect } from '@playwright/test';

test.describe('Fabric Automation App - End to End', () => {
  test('loads the form with default values', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('Fabric Automation App');
    await expect(page.locator('h2')).toContainText('Configure Fabric Deployment');

    // Form has pre-filled default values
    await expect(page.locator('#requirement')).toHaveValue('create hello world notebook');
    await expect(page.locator('#devWorkspace')).toHaveValue('fabric-workspace-dev');
    await expect(page.locator('#qaWorkspace')).toHaveValue('fabric-workspace-qa');
    await expect(page.locator('#prodWorkspace')).toHaveValue('fabric-workspace-prod');
  });

  test('shows backend connected status', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.connection-status')).toHaveClass(/connected/, { timeout: 10000 });
    await expect(page.locator('.connection-status')).toContainText('Backend Connected');
  });

  test('runs a sample deployment end to end', async ({ page }) => {
    await page.goto('/');

    // Wait for backend to be connected
    await expect(page.locator('.connection-status')).toHaveClass(/connected/, { timeout: 10000 });

    // Use the pre-filled default values — set a notebook name to exercise Phase 2
    await page.locator('#notebookName').fill('HelloWorldNotebook');

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Deployment Progress section should appear
    await expect(page.locator('.deployment-progress')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h2').filter({ hasText: 'Deployment Progress' })).toBeVisible();

    // Progress bar should be visible
    await expect(page.locator('.progress-bar-container')).toBeVisible();

    // Wait for deployment to complete successfully (Copilot SDK runs real tools — up to 10 minutes)
    await expect(page.locator('.status-badge')).toContainText('COMPLETED', { timeout: 600000 });

    // Progress should be 100%
    await expect(page.locator('.progress-text')).toContainText('100%');

    // Activity log should contain key phase messages
    const log = page.locator('.messages-list');
    await expect(log).toContainText('Phase 1');
    await expect(log).toContainText('Phase 2');
    await expect(log).toContainText('Phase 3');
    await expect(log).toContainText('completed successfully');

    // Result section should be visible with deployed resources
    await expect(page.locator('.result-container')).toBeVisible();
  });

  test('can start a new deployment after completion', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.connection-status')).toHaveClass(/connected/, { timeout: 10000 });

    await page.locator('button[type="submit"]').click();
    await expect(page.locator('.status-badge')).toContainText('COMPLETED', { timeout: 600000 });

    // Click "Start New Deployment"
    await page.locator('button').filter({ hasText: 'Start New Deployment' }).click();

    // Form should be visible again
    await expect(page.locator('h2').filter({ hasText: 'Configure Fabric Deployment' })).toBeVisible();
    await expect(page.locator('#requirement')).toBeVisible();
  });
});
