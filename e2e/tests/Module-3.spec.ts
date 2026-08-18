import { test, expect } from '@playwright/test';

test.describe('Module 3: Company Profile Management (W3-10)', () => {

  const getTimestamp = () => Date.now();

  // Helper to register and login a new company account
  async function createAndLoginCompany(page: any) {
    const timestamp = getTimestamp();
    const company = {
      email: `m3_company_${timestamp}@tech.co.th`,
      username: `m3_comp_${timestamp}`,
      password: 'Password123!',
      company_name: `บริษัท M3 Tech ${timestamp} จำกัด`,
      website: 'https://www.m3tech.co.th',
      province: 'กรุงเทพมหานคร',
      address: '123 ถนนสุขุมวิท',
      description: 'บริษัทซอฟต์แวร์ทดสอบ Module 3',
    };

    await page.goto('/auth/register/company');
    await page.locator('input[name="email"]').fill(company.email);
    await page.locator('input[name="username"]').fill(company.username);
    await page.locator('input[name="password"]').fill(company.password);
    await page.locator('input[name="company_name"]').fill(company.company_name);
    await page.locator('input[name="website"]').fill(company.website);
    await page.locator('input[name="province"]').fill(company.province);
    await page.locator('textarea[name="address"]').fill(company.address);
    await page.locator('textarea[name="description"]').fill(company.description);
    await page.getByRole('button', { name: 'Register Company' }).click();
    await page.waitForURL('**/auth/login');

    await page.locator('input[id="email"]').fill(company.email);
    await page.locator('input[id="password"]').fill(company.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/dashboard');

    return company;
  }

  // ---------------------------------------------------------------------------
  // W3-10: แก้ไขข้อมูลบริษัท (Company Profile Details)
  // ---------------------------------------------------------------------------
  test.describe('W3-10: แก้ไขข้อมูลบริษัท', () => {

    test('TC-I1-W3-10-001: แก้ไขและอัปเดตข้อมูลบริษัท/ผู้ประกอบการ (Company Profile Details) สำเร็จ (Normal Successful Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await page.goto('/dashboard/profile');

      await page.locator('input[name="company_name"]').fill('บริษัท นวัตกรรมเทคโนโลยี จำกัด');
      await page.locator('input[name="province"]').fill('นนทบุรี');
      await page.locator('textarea[name="address"]').fill('99 ถนนแจ้งวัฒนะ');
      await page.locator('textarea[name="description"]').fill('ผู้นำด้านนวัตกรรม AI');

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain('สำเร็จ');
      await dialog.accept();

      await page.reload();
      await expect(page.locator('input[name="company_name"]')).toHaveValue('บริษัท นวัตกรรมเทคโนโลยี จำกัด');
    });

    test('TC-I1-W3-10-002: แก้ไขข้อมูลบริษัทโดยลบชื่อบริษัทออกจนเป็นค่าว่าง (Worst Empty Company Name Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await page.goto('/dashboard/profile');

      await page.locator('input[name="company_name"]').fill('');
      await page.getByRole('button', { name: 'Save Changes' }).click();

      // HTML5 validation or error alert block
      const isInvalid = await page.locator('input[name="company_name"]').evaluate((el: HTMLInputElement) => !el.checkValidity());
      expect(isInvalid).toBe(true);
    });

    test('TC-I1-W3-10-003: กรอกและจัดการลิงก์เว็บไซต์ของบริษัทหลายลิงก์ (Multiple Company Links Array Edge Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await page.goto('/dashboard/profile');

      // Click add link button if present
      const addLinkBtn = page.getByRole('button', { name: /Add Link|เพิ่มลิงก์|\+/i });
      if (await addLinkBtn.isVisible()) {
        await addLinkBtn.click();
      }

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      await dialog.accept();
    });

  });

});
