import { test, expect } from '@playwright/test';

test.describe('Dashboard Profile Skills Management', () => {
  // Generate a unique user each time to avoid database constraints/conflicts
  const timestamp = Date.now();
  const testUser = {
    email: `test_skills_${timestamp}@example.com`,
    username: `skills_user_${timestamp}`,
    password: 'Password123!',
    fullname: `Skills Test Student ${timestamp}`,
    phone: '0812345678',
    university: 'KMUTT',
    faculty: 'SIT',
    major: 'IT',
  };

  test('should register, login, add, edit, and delete skills', async ({ page }) => {
    // 1. Register a new student account
    await page.goto('/auth/register/student');

    // Fill the account credentials
    await page.locator('input[name="email"]').fill(testUser.email);
    await page.locator('input[name="username"]').fill(testUser.username);
    await page.locator('input[name="password"]').fill(testUser.password);

    // Fill student profile details
    await page.locator('input[id="fullname"]').fill(testUser.fullname);
    await page.locator('input[id="phone"]').fill(testUser.phone);
    await page.locator('input[id="university"]').fill(testUser.university);
    await page.locator('input[id="faculty"]').fill(testUser.faculty);
    await page.locator('input[id="major"]').fill(testUser.major);
    await page.locator('select[id="study_year"]').selectOption('3');

    // Click register button and wait for redirect to login page
    await page.getByRole('button', { name: 'Register Account' }).click();
    await page.waitForURL('**/auth/login');

    // 2. Login with the registered user
    await page.locator('input[id="email"]').fill(testUser.email);
    await page.locator('input[id="password"]').fill(testUser.password);
    await page.getByRole('button', { name: 'Login' }).click();

    // Verify redirected to dashboard
    await page.waitForURL('**/dashboard');

    // 3. Go to Profile page
    await page.goto('/dashboard/profile');
    
    // Expect to be on the profile page
    await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();

    // 4. Test ADDING a skill
    // Wait for the skills loading indicator to disappear
    await expect(page.getByText('กำลังโหลดข้อมูลทักษะ...')).not.toBeVisible();
    
    // Wait 1 second to ensure React hydration is complete and event listeners are active
    await page.waitForTimeout(1000);

    // Click "Expand All" button to show all skills categories
    await page.getByRole('button', { name: 'เปิดทุกช่อง (Expand All)' }).click();

    // Verify categories expanded by asserting the split pane header is visible
    await expect(page.getByText('หมวดหมู่ที่กำลังเปิดจัดการทักษะ')).toBeVisible({ timeout: 5000 });

    // Find and click the skill button "+ React" to add it
    const addReactButton = page.getByRole('button', { name: 'React', exact: true });
    await expect(addReactButton).toBeVisible();
    await addReactButton.click();

    // Verify React is added to the selected skills summary
    const summarySection = page.locator('h4').filter({ hasText: 'ทักษะที่คุณเลือกไว้' }).locator('..');
    const reactSpan = summarySection.locator('span').filter({ hasText: /^React$/ });
    await expect(reactSpan).toBeVisible();

    // Verify default level is "Intermediate"
    const selectedReactSkill = reactSpan.locator('..');
    const selectDropdown = selectedReactSkill.locator('select');
    await expect(selectDropdown).toHaveValue('Intermediate');

    // 5. Test EDITING a skill (change level to Advanced)
    await selectDropdown.selectOption('Advanced');
    await expect(selectDropdown).toHaveValue('Advanced');

    // Save changes and dismiss the alert dialog
    const saveDialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    const saveDialog = await saveDialogPromise;
    expect(saveDialog.message()).toContain('สำเร็จ');
    await saveDialog.accept();

    // Reload the page to test persistence
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
    await expect(page.getByText('กำลังโหลดข้อมูลทักษะ...')).not.toBeVisible();
    await page.waitForTimeout(1000);

    // Locate the skill container after reload
    const reloadedSummarySection = page.locator('h4').filter({ hasText: 'ทักษะที่คุณเลือกไว้' }).locator('..');
    const reloadedReactSpan = reloadedSummarySection.locator('span').filter({ hasText: /^React$/ });
    await expect(reloadedReactSpan).toBeVisible();
    
    const reloadedReactSkill = reloadedReactSpan.locator('..');
    const selectDropdownReloaded = reloadedReactSkill.locator('select');
    await expect(selectDropdownReloaded).toHaveValue('Advanced');

    // 6. Test DELETING a skill (select remove option)
    await selectDropdownReloaded.selectOption('remove');

    // Verify React is removed from the list immediately
    await expect(reloadedReactSpan).not.toBeVisible();

    // Save changes again
    const deleteDialogPromise = page.waitForEvent('dialog');
    await page.getByRole('button', { name: 'Save Changes' }).click();
    const deleteDialog = await deleteDialogPromise;
    expect(deleteDialog.message()).toContain('สำเร็จ');
    await deleteDialog.accept();

    // Reload the page and verify that React is no longer selected
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
    await expect(page.getByText('กำลังโหลดข้อมูลทักษะ...')).not.toBeVisible();
    await page.waitForTimeout(1000);

    const finalSummarySection = page.locator('h4').filter({ hasText: 'ทักษะที่คุณเลือกไว้' }).locator('..');
    await expect(finalSummarySection.locator('span').filter({ hasText: /^React$/ })).not.toBeVisible();
  });
});
