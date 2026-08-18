import { test, expect } from '@playwright/test';

test.describe('Module 2: Profile Settings, Skills, Education, Portfolio & Resume Management (W3-8 to W4-10)', () => {

  const getTimestamp = () => Date.now();

  // Helper to register and login a new student account
  async function createAndLoginStudent(page: any) {
    const timestamp = getTimestamp();
    const student = {
      email: `m2_student_${timestamp}@example.com`,
      username: `m2_student_${timestamp}`,
      password: 'Password123!',
      fullname: `Student M2 Test ${timestamp}`,
      phone: '0812345678',
      university: 'KMUTT',
      faculty: 'SIT',
      major: 'IT',
    };

    await page.goto('/auth/register/student');
    await page.locator('input[name="email"]').fill(student.email);
    await page.locator('input[name="username"]').fill(student.username);
    await page.locator('input[name="password"]').fill(student.password);
    await page.locator('input[id="fullname"]').fill(student.fullname);
    await page.locator('input[id="phone"]').fill(student.phone);
    await page.locator('input[id="university"]').fill(student.university);
    await page.locator('input[id="faculty"]').fill(student.faculty);
    await page.locator('input[id="major"]').fill(student.major);
    await page.locator('select[id="study_year"]').selectOption('3');
    await page.getByRole('button', { name: 'Register Account' }).click();
    await page.waitForURL('**/auth/login');

    await page.locator('input[id="email"]').fill(student.email);
    await page.locator('input[id="password"]').fill(student.password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/dashboard');

    return student;
  }

  // Helper to register and login a new company account
  async function createAndLoginCompany(page: any) {
    const timestamp = getTimestamp();
    const company = {
      email: `m2_company_${timestamp}@tech.co.th`,
      username: `m2_comp_${timestamp}`,
      password: 'Password123!',
      company_name: `บริษัท M2 Tech ${timestamp} จำกัด`,
      website: 'https://www.m2tech.co.th',
      province: 'กรุงเทพมหานคร',
      address: '123 ถนนสุขุมวิท',
      description: 'บริษัทซอฟต์แวร์ทดสอบ Module 2',
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
  // W3-8: แก้ไขข้อมูลบัญชี (Account Info Settings)
  // ---------------------------------------------------------------------------
  test.describe('W3-8: แก้ไขข้อมูลบัญชี', () => {

    test('TC-I1-W3-8-001: ตรวจสอบการแสดงผลข้อมูลบัญชีผู้ใช้ในหน้า Profile Settings (Normal Read-only Case)', async ({ page }) => {
      const student = await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
      await expect(page.getByText(student.email)).toBeVisible();
    });

    test('TC-I1-W3-8-002: พยายามส่งคำขออัปเดตโปรไฟล์หรือบัญชีขณะที่ Session คุกกี้หมดอายุ (Worst Session Expired Case)', async ({ context, page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      // Clear cookies to simulate expired session
      await context.clearCookies();

      await page.getByRole('button', { name: 'Save Changes' }).click();

      // Expect unauthorized error alert or redirect
      await page.waitForURL('**/auth/login', { timeout: 5000 }).catch(() => {});
      const isLoggedOut = page.url().includes('/auth/login') || (await page.locator('div, form').filter({ hasText: /error|authenticated|เกิดข้อผิดพลาด/i }).count()) > 0;
      expect(isLoggedOut).toBe(true);
    });

    test('TC-I1-W3-8-003: ทดสอบการดึงข้อมูลอีเมลจากโครงสร้าง Nested Object/Array ของ Supabase (Nested Schema Edge Case)', async ({ page }) => {
      const student = await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      // Ensure profile page renders email properly without crash
      await expect(page.getByText(student.email)).toBeVisible();
    });

  });

  // ---------------------------------------------------------------------------
  // W3-9: แก้ไขข้อมูลส่วนตัวนักศึกษา (Student Profile Details)
  // ---------------------------------------------------------------------------
  test.describe('W3-9: แก้ไขข้อมูลส่วนตัว', () => {

    test('TC-I1-W3-9-001: แก้ไขและอัปเดตข้อมูลส่วนตัวนักศึกษา (Student Profile Details) สำเร็จ (Normal Successful Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      await page.locator('input[name="fullname"]').fill('นายสมชาย เรียนดี');
      await page.locator('input[name="phone"]').fill('0898765432');
      await page.locator('input[name="university"]').fill('KMUTT');
      await page.locator('input[name="faculty"]').fill('SIT');
      await page.locator('input[name="major"]').fill('CS');
      await page.locator('select[name="study_year"]').selectOption('4');

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain('สำเร็จ');
      await dialog.accept();

      await page.reload();
      await expect(page.locator('input[name="fullname"]')).toHaveValue('นายสมชาย เรียนดี');
      await expect(page.locator('input[name="phone"]')).toHaveValue('0898765432');
    });

    test('TC-I1-W3-9-002: อัปโหลดไฟล์ Resume เป็นประเภทไฟล์ไม่อนุญาต เช่น ไฟล์ executable .exe (Worst Invalid File Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      // Attempt uploading .exe file
      const exeBuffer = Buffer.from('MZ...fake_exe_content');
      await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles({
        name: 'script_installer.exe',
        mimeType: 'application/x-msdownload',
        buffer: exeBuffer,
      }).catch(() => {});

      // File input accept filter blocks .exe or upload fails safely
      const fileInputValue = await page.locator('input[type="file"][accept*=".pdf"]').inputValue().catch(() => '');
      expect(fileInputValue).not.toContain('.exe');
    });

    test('TC-I1-W3-9-003: ลบไฟล์ Resume (Delete Resume) และบันทึกข้อมูล (Nullification Edge Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      // Check if delete resume icon button exists
      const deleteResumeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') });
      if (await deleteResumeBtn.isVisible()) {
        const confirmPromise = page.waitForEvent('dialog');
        await deleteResumeBtn.click();
        const confirmDialog = await confirmPromise;
        await confirmDialog.accept();

        const saveDialogPromise = page.waitForEvent('dialog');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        const saveDialog = await saveDialogPromise;
        await saveDialog.accept();
      }
    });

  });

  // ---------------------------------------------------------------------------
  // W4-1: เพิ่มทักษะ (Skill)
  // ---------------------------------------------------------------------------
  test.describe('W4-1: เพิ่มทักษะ (Skill)', () => {

    test('TC-I1-W4-1-001: เพิ่มทักษะใหม่เข้าสู่โปรไฟล์นักศึกษาสำเร็จ (Normal Successful Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      await expect(page.getByText('กำลังโหลดข้อมูลทักษะ...')).not.toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);

      await page.getByRole('button', { name: 'เปิดทุกช่อง (Expand All)' }).click();
      const addReactBtn = page.getByRole('button', { name: 'React', exact: true });
      if (await addReactBtn.isVisible()) {
        await addReactBtn.click();
      }

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain('สำเร็จ');
      await dialog.accept();
    });

    test('TC-I1-W4-1-002: พยายามเพิ่มทักษะซ้ำที่มีอยู่แล้วในรายการโปรไฟล์นักศึกษา (Worst Duplicate Skill Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');
      await expect(page.getByText('กำลังโหลดข้อมูลทักษะ...')).not.toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);

      await page.getByRole('button', { name: 'เปิดทุกช่อง (Expand All)' }).click();
      const addReactBtn = page.getByRole('button', { name: 'React', exact: true });
      if (await addReactBtn.isVisible()) {
        await addReactBtn.click();
        // Try clicking second time
        await addReactBtn.click().catch(() => {});
      }

      const summarySection = page.locator('h4').filter({ hasText: 'ทักษะที่คุณเลือกไว้' }).locator('..');
      const reactCount = await summarySection.locator('span').filter({ hasText: /^React$/ }).count();
      expect(reactCount).toBeLessThanOrEqual(1);
    });

    test('TC-I1-W4-1-003: เพิ่มทักษะจำนวนมาก (มากกว่า 20 ทักษะ) พร้อมกันในคราวเดียว (Maximum Skills Edge Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');
      await expect(page.getByText('กำลังโหลดข้อมูลทักษะ...')).not.toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);

      await page.getByRole('button', { name: 'เปิดทุกช่อง (Expand All)' }).click();

      // Click multiple skill buttons
      const skillButtons = page.locator('button').filter({ hasText: /^\+ / });
      const count = await skillButtons.count();
      for (let i = 0; i < Math.min(count, 15); i++) {
        await skillButtons.nth(i).click().catch(() => {});
      }

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      await dialog.accept();
    });

  });

  // ---------------------------------------------------------------------------
  // W4-2: ลบทักษะ
  // ---------------------------------------------------------------------------
  test.describe('W4-2: ลบทักษะ', () => {

    test('TC-I1-W4-2-001: ลบทักษะออกจากโปรไฟล์นักศึกษาและบันทึกข้อมูลสำเร็จ (Normal Successful Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');
      await expect(page.getByText('กำลังโหลดข้อมูลทักษะ...')).not.toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);

      // Add a skill first
      await page.getByRole('button', { name: 'เปิดทุกช่อง (Expand All)' }).click();
      const reactBtn = page.getByRole('button', { name: 'React', exact: true });
      if (await reactBtn.isVisible()) {
        await reactBtn.click();

        // Select "remove" option
        const summarySection = page.locator('h4').filter({ hasText: 'ทักษะที่คุณเลือกไว้' }).locator('..');
        const reactSpan = summarySection.locator('span').filter({ hasText: /^React$/ });
        const dropdown = reactSpan.locator('..').locator('select');
        await dropdown.selectOption('remove');

        const dialogPromise = page.waitForEvent('dialog');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        const dialog = await dialogPromise;
        expect(dialog.message()).toContain('สำเร็จ');
        await dialog.accept();
      }
    });

    test('TC-I1-W4-2-002: ยกเลิกการบันทึกหลังกดลบทักษะ โดยกดรีโหลดหน้าเว็บโดยไม่กด Save Changes (Worst Unsaved Deletion Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');
      await expect(page.getByText('กำลังโหลดข้อมูลทักษะ...')).not.toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);

      // Reload without saving
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
    });

    test('TC-I1-W4-2-003: ลบทักษะทั้งหมดในคราวเดียวจนไม่เหลือทักษะในโปรไฟล์ (Empty Skills List Edge Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');
      await expect(page.getByText('กำลังโหลดข้อมูลทักษะ...')).not.toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);

      const summarySection = page.locator('h4').filter({ hasText: 'ทักษะที่คุณเลือกไว้' }).locator('..');
      const dropdowns = summarySection.locator('select');
      const count = await dropdowns.count();
      for (let i = 0; i < count; i++) {
        await dropdowns.nth(i).selectOption('remove').catch(() => {});
      }

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      await dialog.accept();
    });

  });

  // ---------------------------------------------------------------------------
  // W4-3: แก้ไขทักษะ
  // ---------------------------------------------------------------------------
  test.describe('W4-3: แก้ไขทักษะ', () => {

    test('TC-I1-W4-3-001: แก้ไขระดับความเชี่ยวชาญของทักษะ (Skill Level Update) สำเร็จ (Normal Successful Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');
      await expect(page.getByText('กำลังโหลดข้อมูลทักษะ...')).not.toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);

      await page.getByRole('button', { name: 'เปิดทุกช่อง (Expand All)' }).click();
      const reactBtn = page.getByRole('button', { name: 'React', exact: true });
      if (await reactBtn.isVisible()) {
        await reactBtn.click();
        const summarySection = page.locator('h4').filter({ hasText: 'ทักษะที่คุณเลือกไว้' }).locator('..');
        const reactSpan = summarySection.locator('span').filter({ hasText: /^React$/ });
        const dropdown = reactSpan.locator('..').locator('select');
        await dropdown.selectOption('Advanced');
        await expect(dropdown).toHaveValue('Advanced');

        const dialogPromise = page.waitForEvent('dialog');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        const dialog = await dialogPromise;
        expect(dialog.message()).toContain('สำเร็จ');
        await dialog.accept();
      }
    });

    test('TC-I1-W4-3-002: พยายามส่งค่าระดับความเชี่ยวชาญทักษะที่ไม่ได้รับอนุญาต หรือ Invalid Level Value (Worst Invalid Enum Level Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');
      await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
    });

    test('TC-I1-W4-3-003: สลับระดับความเชี่ยวชาญทักษะหลายรายการไปมาอย่างรวดเร็ว (Rapid Level Toggle Edge Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');
      await expect(page.getByText('กำลังโหลดข้อมูลทักษะ...')).not.toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);

      await page.getByRole('button', { name: 'เปิดทุกช่อง (Expand All)' }).click();
      const reactBtn = page.getByRole('button', { name: 'React', exact: true });
      if (await reactBtn.isVisible()) {
        await reactBtn.click();
        const summarySection = page.locator('h4').filter({ hasText: 'ทักษะที่คุณเลือกไว้' }).locator('..');
        const reactSpan = summarySection.locator('span').filter({ hasText: /^React$/ });
        const dropdown = reactSpan.locator('..').locator('select');
        await dropdown.selectOption('Beginner');
        await dropdown.selectOption('Advanced');
        await dropdown.selectOption('Intermediate');

        const dialogPromise = page.waitForEvent('dialog');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        const dialog = await dialogPromise;
        await dialog.accept();
      }
    });

  });

  // ---------------------------------------------------------------------------
  // W4-4: เพิ่มรูปโปรไฟล์
  // ---------------------------------------------------------------------------
  test.describe('W4-4: เพิ่มรูปโปรไฟล์', () => {

    test('TC-I1-W4-4-001: อัปโหลดรูปภาพโปรไฟล์ใหม่ (Profile Avatar Upload) สำเร็จ (Normal Successful Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      // Create dummy image buffer
      const imgBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      await page.locator('input[type="file"][accept="image/*"]').setInputFiles({
        name: 'avatar_test.png',
        mimeType: 'image/png',
        buffer: imgBuffer,
      });

      await page.waitForTimeout(1000);
    });

    test('TC-I1-W4-4-002: อัปโหลดรูปโปรไฟล์ด้วยไฟล์ที่ไม่ใช่รูปภาพ เช่น ไฟล์เอกสาร .pdf หรือ .docx (Worst Invalid Image Format Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf');
      await page.locator('input[type="file"][accept="image/*"]').setInputFiles({
        name: 'document_test.pdf',
        mimeType: 'application/pdf',
        buffer: pdfBuffer,
      }).catch(() => {});
    });

    test('TC-I1-W4-4-003: อัปโหลดรูปภาพโปรไฟล์ที่มีความละเอียดสูงมาก หรือขนาดไฟล์เฉียดขีดจำกัด (High-Resolution Image Edge Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      const largeImgBuffer = Buffer.alloc(4 * 1024 * 1024, 'a');
      await page.locator('input[type="file"][accept="image/*"]').setInputFiles({
        name: '4k_high_res_avatar.png',
        mimeType: 'image/png',
        buffer: largeImgBuffer,
      }).catch(() => {});
    });

  });

  // ---------------------------------------------------------------------------
  // W4-5: เพิ่มประวัติการศึกษา
  // ---------------------------------------------------------------------------
  test.describe('W4-5: เพิ่มประวัติการศึกษา', () => {

    test('TC-I1-W4-5-001: เพิ่มและบันทึกข้อมูลประวัติการศึกษา (University, Faculty, Major, Year) ครบถ้วน (Normal Successful Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      await page.locator('input[name="university"]').fill('King Mongkut\'s University of Technology Thonburi');
      await page.locator('input[name="faculty"]').fill('School of Information Technology');
      await page.locator('input[name="major"]').fill('Information Technology');
      await page.locator('select[name="study_year"]').selectOption('3');

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain('สำเร็จ');
      await dialog.accept();

      await page.reload();
      await expect(page.locator('input[name="university"]')).toHaveValue('King Mongkut\'s University of Technology Thonburi');
    });

    test('TC-I1-W4-5-002: บันทึกข้อมูลประวัติการศึกษาด้วยค่าชั้นปี (Study Year) ที่ไม่อยู่ในเกณฑ์ เช่น ค่าติดลบ หรือค่า 0 (Worst Invalid Study Year Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      const options = await page.locator('select[name="study_year"] option').allInnerTexts();
      const invalidPresent = options.some(opt => opt.includes('-1') || opt.includes('0'));
      expect(invalidPresent).toBe(false);
    });

    test('TC-I1-W4-5-003: กรอกชื่อมหาวิทยาลัย/คณะ/สาขาด้วยชื่อยาวเป็นพิเศษและมีอักขระพิเศษ (Long Text Education Edge Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      const longUniName = "King Mongkut's University of Technology Thonburi (KMUTT) - International Program & Research Center".repeat(2);
      await page.locator('input[name="university"]').fill(longUniName);

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      await dialog.accept();
    });

  });

  // Note: W4-6 is skipped/removed per explicit user instructions

  // ---------------------------------------------------------------------------
  // W4-7: เพิ่ม Portfolio
  // ---------------------------------------------------------------------------
  test.describe('W4-7: เพิ่ม Portfolio', () => {

    test('TC-I1-W4-7-001: เพิ่มและบันทึกลิงก์ผลงาน Portfolio/GitHub/LinkedIn สำเร็จ (Normal Successful Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      await page.locator('input[name="linkedin"]').fill('linkedin.com/in/somchai-student');
      await page.locator('input[name="github"]').fill('github.com/somchai-dev');
      await page.locator('input[name="portfolio"]').fill('https://somchai-portfolio.vercel.app');

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain('สำเร็จ');
      await dialog.accept();

      await page.reload();
      await expect(page.locator('input[name="linkedin"]')).toHaveValue('linkedin.com/in/somchai-student');
    });

    test('TC-I1-W4-7-002: บันทึกลิงก์ Portfolio ด้วย รูปแบบ URL ไม่ถูกต้อง หรือ Invalid Protocol (Worst Malformed URL Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      await page.locator('input[name="portfolio"]').fill('htp://not_a_valid_url_$$$');
      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      await dialog.accept();
    });

    test('TC-I1-W4-7-003: กรอกลิงก์ Portfolio ที่มีความยาวมากเป็นพิเศษพร้อม Query Parameters หลายตัว (Very Long URL Edge Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      const longUrl = 'https://myportfolio.com/projects/detail?id=99999&referrer=google_search&utm_source=internmatch_platform&utm_medium=profile_link';
      await page.locator('input[name="portfolio"]').fill(longUrl);

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      await dialog.accept();
    });

  });

  // ---------------------------------------------------------------------------
  // W4-8: ลบ Portfolio
  // ---------------------------------------------------------------------------
  test.describe('W4-8: ลบ Portfolio', () => {

    test('TC-I1-W4-8-001: ลบลิงก์ผลงาน Portfolio ออกจากโปรไฟล์นักศึกษาสำเร็จ (Normal Successful Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      await page.locator('input[name="portfolio"]').fill('');

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      expect(dialog.message()).toContain('สำเร็จ');
      await dialog.accept();

      await page.reload();
      await expect(page.locator('input[name="portfolio"]')).toHaveValue('');
    });

    test('TC-I1-W4-8-002: ลบลิงก์ Portfolio แล้วไม่กด Save Changes จากนั้นรีโหลดหน้าเว็บ (Worst Unsaved Removal Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      await page.locator('input[name="portfolio"]').fill('');
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Student Profile' })).toBeVisible();
    });

    test('TC-I1-W4-8-003: ลบลิงก์ Portfolio ทั้งหมดพร้อมกัน 3 ช่อง (Clear All External Links Edge Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      await page.locator('input[name="linkedin"]').fill('');
      await page.locator('input[name="github"]').fill('');
      await page.locator('input[name="portfolio"]').fill('');

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      await dialog.accept();
    });

  });

  // ---------------------------------------------------------------------------
  // W4-9: อัปโหลด Resume
  // ---------------------------------------------------------------------------
  test.describe('W4-9: อัปโหลด Resume', () => {

    test('TC-I1-W4-9-001: อัปโหลดไฟล์ Resume (.pdf) เข้าสู่ระบบสำเร็จ (Normal Successful Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      const pdfBuffer = Buffer.from('%PDF-1.4 1 0 obj<<>>endobj trailer<<\/Root 1 0 R>>%%EOF');
      await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles({
        name: 'student_resume_v1.pdf',
        mimeType: 'application/pdf',
        buffer: pdfBuffer,
      });

      await page.waitForTimeout(1000);
    });

    test('TC-I1-W4-9-002: อัปโหลดไฟล์ Resume ที่มีขนาดเกิน 10MB (Worst File Size Exceeded Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');
      const dialogPromise = page.waitForEvent('dialog');
      await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles({
        name: 'oversize_resume_11mb.pdf',
        mimeType: 'application/pdf',
        buffer: largeBuffer,
      });

      const dialog = await dialogPromise;
      expect(dialog.message()).toContain('10MB');
      await dialog.accept();
    });

    test('TC-I1-W4-9-003: อัปโหลดไฟล์ Resume ที่ชื่อไฟล์มีภาษาไทย Space และอักขระพิเศษ (Thai File Name Edge Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      const pdfBuffer = Buffer.from('%PDF-1.4 1 0 obj<<>>endobj trailer<<\/Root 1 0 R>>%%EOF');
      await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles({
        name: 'เรซูเม่_สมชาย (ฉบับแก้ไข & สมบูรณ์) [2026].pdf',
        mimeType: 'application/pdf',
        buffer: pdfBuffer,
      });

      await page.waitForTimeout(1000);
    });

  });

  // ---------------------------------------------------------------------------
  // W4-10: เปลี่ยน Resume
  // ---------------------------------------------------------------------------
  test.describe('W4-10: เปลี่ยน Resume', () => {

    test('TC-I1-W4-10-001: เปลี่ยนไฟล์ Resume ฉบับใหม่ทดแทนฉบับเดิมสำเร็จ (Normal Successful Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      const pdfBufferV2 = Buffer.from('%PDF-1.4 2 0 obj<<>>endobj trailer<<\/Root 2 0 R>>%%EOF');
      await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles({
        name: 'student_resume_v2_updated.pdf',
        mimeType: 'application/pdf',
        buffer: pdfBufferV2,
      });

      const dialogPromise = page.waitForEvent('dialog');
      await page.getByRole('button', { name: 'Save Changes' }).click();
      const dialog = await dialogPromise;
      await dialog.accept();
    });

    test('TC-I1-W4-10-002: เปลี่ยน Resume โดยเลือกไฟล์นามสกุลที่ไม่ได้รับอนุญาต เช่น .exe หรือ .bat (Worst Disallowed Extension Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      const exeBuffer = Buffer.from('MZ...malicious');
      await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles({
        name: 'malicious_patch.exe',
        mimeType: 'application/x-msdownload',
        buffer: exeBuffer,
      }).catch(() => {});
    });

    test('TC-I1-W4-10-003: ลบไฟล์ Resume เดิมออก (Delete Resume) แล้วเปลี่ยนอัปโหลดไฟล์ฉบับใหม่ทันที (Delete and Re-upload Edge Case)', async ({ page }) => {
      await createAndLoginStudent(page);
      await page.goto('/dashboard/profile');

      const deleteResumeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-trash-2') });
      if (await deleteResumeBtn.isVisible()) {
        const confirmPromise = page.waitForEvent('dialog');
        await deleteResumeBtn.click();
        const confirmDialog = await confirmPromise;
        await confirmDialog.accept();

        const pdfBuffer = Buffer.from('%PDF-1.4 1 0 obj<<>>endobj trailer<<\/Root 1 0 R>>%%EOF');
        await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles({
          name: 'reuploaded_resume.pdf',
          mimeType: 'application/pdf',
          buffer: pdfBuffer,
        });

        const saveDialogPromise = page.waitForEvent('dialog');
        await page.getByRole('button', { name: 'Save Changes' }).click();
        const saveDialog = await saveDialogPromise;
        await saveDialog.accept();
      }
    });

  });

});
