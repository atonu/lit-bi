import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('input[type="email"]', 'test@yopmail.com');
    await page.fill('input[type="password"]', '12121212');
    await page.click('button[type="submit"]');

    // Wait for dashboard redirection or user-specific cookie/localStorage
    await page.waitForURL('/');

    // Save state
    await page.context().storageState({ path: authFile });
});
