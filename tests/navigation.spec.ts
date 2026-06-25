// lit-bi/tests/navigation.spec.ts
import { test, expect } from '@playwright/test';

// Reset storage state for this test file so it starts unauthenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('should navigate to the signin page', async ({ page }) => {
    // Start from the index page (the webServer config points this to localhost:3000)
    await page.goto('/signin');

    // Verify the page contains the sign in title/input or button
    await expect(page).toHaveURL(/.*signin/);
    await expect(page.locator('h2')).toContainText(/sign in/i);
});
