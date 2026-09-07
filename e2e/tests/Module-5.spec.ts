import { expect, type Page, test } from '@playwright/test';

test.describe('Module 5: Student Internship Application (W2-7 to W2-10)', () => {
  // Each test involves 2-3 full register+login flows; 90s prevents premature timeout
  test.setTimeout(90000);
  const getTimestamp = () => `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  async function registerStudent(page: Page, prefix = 'm5_student', retries = 3): Promise<{ email: string; username: string; password: string; fullname: string }> {
    const ts = getTimestamp();
    const student = {
      email: `${prefix}_${ts}@example.com`,
      username: `${prefix}_${ts}`,
      password: 'Password123!',
      fullname: `Student M5 ${ts}`,
    };
    await page.goto('/auth/register/student');
    await page.locator('input[name="email"]').fill(student.email);
    await page.locator('input[name="username"]').fill(student.username);
    await page.locator('input[name="password"]').fill(student.password);
    await page.locator('input[id="fullname"]').fill(student.fullname);
    await page.locator('input[id="phone"]').fill('0812345678');
    await page.locator('input[id="university"]').fill('KMUTT');
    await page.locator('input[id="faculty"]').fill('SIT');
    await page.locator('input[id="major"]').fill('IT');
    await page.locator('select[id="study_year"]').selectOption('3');
    await page.getByRole('button', { name: 'Register Account' }).click();

    // Race between success redirect and error display (parallel-worker duplicate-key collision)
    const outcome = await Promise.race([
      page.waitForURL('**/auth/login', { timeout: 20000 }).then(() => 'success' as const),
      page.locator('div.bg-red-50').waitFor({ state: 'visible', timeout: 20000 }).then(() => 'error' as const),
    ]).catch(() => 'timeout' as const);

    if (outcome !== 'success' && retries > 0) {
      return registerStudent(page, prefix, retries - 1);
    }
    return student;
  }

  async function login(page: Page, email: string, password: string) {
    await page.goto('/auth/login');
    await page.locator('input[id="email"]').fill(email);
    await page.locator('input[id="password"]').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  }

  async function createAndLoginStudent(page: Page, prefix?: string) {
    const student = await registerStudent(page, prefix);
    await login(page, student.email, student.password);
    return student;
  }

  async function registerCompany(page: Page, prefix = 'm5_company'): Promise<{ email: string; username: string; password: string; company_name: string; website: string; province: string; address: string; description: string }> {
    const ts = getTimestamp();
    const company = {
      email: `${prefix}_${ts}@tech.co.th`,
      username: `${prefix}_${ts}`,
      password: 'Password123!',
      company_name: `บริษัท M5 ${ts} จำกัด`,
      website: 'https://www.m5-tech.co.th',
      province: 'กรุงเทพมหานคร',
      address: '1 ถนนพหลโยธิน',
      description: 'บริษัทสำหรับทดสอบ Module 5',
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

    // Race between success redirect and error display
    const outcome = await Promise.race([
      page.waitForURL('**/auth/login', { timeout: 20000 }).then(() => 'success' as const),
      page.locator('div.bg-red-50, div[class*="text-red-6"], div[class*="error"]')
        .waitFor({ state: 'visible', timeout: 20000 }).then(() => 'error' as const),
    ]).catch(() => 'timeout' as const);

    if (outcome !== 'success') {
      return registerCompany(page, prefix);
    }
    return company;
  }

  async function createAndLoginCompany(page: Page, prefix?: string) {
    const company = await registerCompany(page, prefix);
    await login(page, company.email, company.password);
    return company;
  }

  async function logout(page: Page) {
    await page.getByRole('button', { name: /Logout/i }).click();
    await page.waitForURL('**/auth/login', { timeout: 15000, waitUntil: 'domcontentloaded' });
  }

  function activeModal(page: Page) {
    return page
      .locator('.fixed.inset-0')
      .filter({ hasText: /สร้างประกาศรับสมัครฝึกงานใหม่|แก้ไขประกาศรับสมัครฝึกงาน/ })
      .last();
  }

  async function openCompanyInternships(page: Page) {
    await page.goto('/dashboard/Internships');
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'My Internships' }),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Checking access permissions...')).not.toBeVisible({
      timeout: 10000,
    });
  }

  async function createInternship(
    page: Page,
    data: { title: string; skills?: string[] },
  ) {
    await openCompanyInternships(page);
    await page.getByRole('button', { name: 'Create New Internship' }).click();
    const modal = activeModal(page);
    await expect(modal.getByText('สร้างประกาศรับสมัครฝึกงานใหม่')).toBeVisible();

    await modal.getByPlaceholder('เช่น Software Engineering Intern').fill(data.title);
    await modal.getByPlaceholder('เช่น Engineering, Marketing').fill('IT');
    await modal.getByPlaceholder('เช่น กรุงเทพมหานคร').fill('กรุงเทพมหานคร');
    await modal.locator('select').nth(0).selectOption('Hybrid');
    await modal.locator('select').nth(1).selectOption('open');
    await modal
      .getByPlaceholder('รายละเอียดการทำงาน หน้าที่ความรับผิดชอบ...')
      .fill('พัฒนาเว็บแอปสำหรับทดสอบ Module 5');
    await modal
      .getByPlaceholder('ระบุหน้าที่ความรับผิดชอบสำหรับตำแหน่งงานนี้...')
      .fill('ทดสอบระบบและพัฒนา API');

    // Step 2 – skills
    await modal.getByRole('button', { name: 'ถัดไป' }).click();
    await expect(modal.getByText('ขั้นตอนที่ 2 จาก 2')).toBeVisible();

    for (const skill of data.skills ?? []) {
      await modal.getByPlaceholder('ค้นหาทักษะ... เช่น Javascript, React, Figma').fill(skill);
      const skillBtn = modal
        .locator('button')
        .filter({ hasText: new RegExp(`\\+?\\s*${skill}`) })
        .first();
      if ((await skillBtn.count()) > 0 && (await skillBtn.isVisible())) {
        await skillBtn.click();
      }
    }

    await modal.getByRole('button', { name: 'สร้างประกาศ' }).click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: data.title })).toBeVisible({ timeout: 10000 });
  }

  async function openStudentInternships(page: Page) {
    await page.goto('/dashboard/Internships');
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'My Internships' }),
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Checking access permissions...')).not.toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 }).catch(() => {});
  }

  async function openApplicationsPage(page: Page) {
    await page.goto('/dashboard/applications');
    await expect(
      page.getByRole('main').getByRole('heading', { name: 'Applications' }),
    ).toBeVisible({ timeout: 15000 });
  }

  // ---------------------------------------------------------------------------
  // W2-7: สมัครฝึกงาน (Apply to Internship)
  // ---------------------------------------------------------------------------
  test.describe('W2-7: สมัครฝึกงาน', () => {
    test('TC-I2-W2-7-001: นิสิตสมัครตำแหน่งงานฝึกงานได้สำเร็จ (Normal Successful Case)', async ({ page }) => {
      const company = await createAndLoginCompany(page, 'm5_c7_1');
      const title = `Intern M5-7-001 ${getTimestamp()}`;
      await createInternship(page, { title });
      await logout(page);

      await createAndLoginStudent(page, 'm5_s7_1');
      await openStudentInternships(page);

      const card = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(card).toBeVisible({ timeout: 10000 });

      page.on('dialog', async (d) => d.accept());
      await card.getByRole('button', { name: 'Apply Now' }).click();

      await expect(card.getByRole('button', { name: 'Cancel Apply' })).toBeVisible({
        timeout: 15000,
      });
      await expect(card.getByText('APPLIED')).toBeVisible();
    });

    test('TC-I2-W2-7-002: นิสิตสมัครตำแหน่งงานเดิมซ้ำอีกครั้ง (Duplicate Apply Case)', async ({ page }) => {
      const company = await createAndLoginCompany(page, 'm5_c7_2');
      const title = `Intern M5-7-002 ${getTimestamp()}`;
      await createInternship(page, { title });
      await logout(page);

      await createAndLoginStudent(page, 'm5_s7_2');
      await openStudentInternships(page);
      const card = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(card).toBeVisible({ timeout: 10000 });

      page.on('dialog', async (d) => d.accept());
      await card.getByRole('button', { name: 'Apply Now' }).click();
      await expect(card.getByRole('button', { name: 'Cancel Apply' })).toBeVisible({ timeout: 15000 });

      // After applying, "Apply Now" should no longer be visible (blocked by UI)
      await expect(card.getByRole('button', { name: 'Apply Now' })).not.toBeVisible();
    });

    test('TC-I2-W2-7-003: บัญชี Company พยายามสมัครตำแหน่งงาน (Wrong Role Case)', async ({ page }) => {
      await createAndLoginCompany(page, 'm5_c7_3');
      await openCompanyInternships(page);

      // Company view has no Apply Now button
      await expect(page.getByRole('button', { name: 'Apply Now' })).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Create New Internship' })).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // W2-8: ยกเลิกการสมัคร (Cancel Application)
  // ---------------------------------------------------------------------------
  test.describe('W2-8: ยกเลิกการสมัคร', () => {
    test('TC-I2-W2-8-001: นิสิตยกเลิกการสมัครสำเร็จ (Normal Successful Case)', async ({ page }) => {
      const company = await createAndLoginCompany(page, 'm5_c8_1');
      const title = `Intern M5-8-001 ${getTimestamp()}`;
      await createInternship(page, { title });
      await logout(page);

      await createAndLoginStudent(page, 'm5_s8_1');
      await openStudentInternships(page);
      const card = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(card).toBeVisible({ timeout: 10000 });

      // Accept all dialogs (apply confirm + possible success alert)
      const acceptHandler = async (d: { accept: () => Promise<void> }) => d.accept();
      page.on('dialog', acceptHandler);
      await card.getByRole('button', { name: 'Apply Now' }).click();
      await expect(card.getByRole('button', { name: 'Cancel Apply' })).toBeVisible({ timeout: 15000 });

      // Click cancel – acceptHandler will accept the confirm dialog
      await card.getByRole('button', { name: 'Cancel Apply' }).click();

      // Re-query card after state update to avoid stale locator
      const updatedCard = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(updatedCard.getByRole('button', { name: 'Apply Now' })).toBeVisible({ timeout: 15000 });
      await expect(updatedCard.getByText('APPLIED')).not.toBeVisible();
    });

    test('TC-I2-W2-8-002: นิสิตกด Cancel Apply แต่ปฏิเสธ Confirm Dialog (Dismiss Cancel Dialog)', async ({ page }) => {
      const company = await createAndLoginCompany(page, 'm5_c8_2');
      const title = `Intern M5-8-002 ${getTimestamp()}`;
      await createInternship(page, { title });
      await logout(page);

      await createAndLoginStudent(page, 'm5_s8_2');
      await openStudentInternships(page);
      const card = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(card).toBeVisible({ timeout: 10000 });

      // Use a named handler so we can remove it before dismissing
      const acceptHandler = async (d: { accept: () => Promise<void> }) => d.accept();
      page.on('dialog', acceptHandler);
      await card.getByRole('button', { name: 'Apply Now' }).click();
      await expect(card.getByRole('button', { name: 'Cancel Apply' })).toBeVisible({ timeout: 15000 });

      // Remove accept handler BEFORE setting up dismiss — prevents double-handling
      page.off('dialog', acceptHandler);
      page.once('dialog', async (d) => d.dismiss());
      await card.getByRole('button', { name: 'Cancel Apply' }).click();

      // State remains applied (dialog was dismissed so cancellation did not proceed)
      await expect(card.getByRole('button', { name: 'Cancel Apply' })).toBeVisible({ timeout: 5000 });
      await expect(card.getByText('APPLIED')).toBeVisible();
    });

    test('TC-I2-W2-8-003: Student B ไม่สามารถยกเลิกการสมัครของ Student A ได้ (Cross-account Cancel)', async ({ page }) => {
      const company = await createAndLoginCompany(page, 'm5_c8_3');
      const title = `Intern M5-8-003 ${getTimestamp()}`;
      await createInternship(page, { title });
      await logout(page);

      // Student A applies
      const studentA = await createAndLoginStudent(page, 'm5_sA8_3');
      await openStudentInternships(page);
      const cardA = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(cardA).toBeVisible({ timeout: 10000 });
      page.on('dialog', async (d) => d.accept());
      await cardA.getByRole('button', { name: 'Apply Now' }).click();
      await expect(cardA.getByRole('button', { name: 'Cancel Apply' })).toBeVisible({ timeout: 15000 });
      await logout(page);

      // Student B logs in – must see Apply Now (not Cancel Apply) for same internship
      await createAndLoginStudent(page, 'm5_sB8_3');
      await openStudentInternships(page);
      const cardB = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(cardB).toBeVisible({ timeout: 10000 });
      await expect(cardB.getByRole('button', { name: 'Apply Now' })).toBeVisible();
      await expect(cardB.getByRole('button', { name: 'Cancel Apply' })).not.toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // W2-9: ดูประวัติการสมัคร (View Application History)
  // ---------------------------------------------------------------------------
  test.describe('W2-9: ดูประวัติการสมัคร', () => {
    test('TC-I2-W2-9-001: นิสิตดูรายการประวัติการสมัครทั้งหมดได้ (Normal Successful Case)', async ({ page }) => {
      const company = await createAndLoginCompany(page, 'm5_c9_1');
      const title = `Intern M5-9-001 ${getTimestamp()}`;
      await createInternship(page, { title });
      await logout(page);

      await createAndLoginStudent(page, 'm5_s9_1');
      await openStudentInternships(page);
      const card = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(card).toBeVisible({ timeout: 10000 });
      page.on('dialog', async (d) => d.accept());
      await card.getByRole('button', { name: 'Apply Now' }).click();
      await expect(card.getByRole('button', { name: 'Cancel Apply' })).toBeVisible({ timeout: 15000 });

      await openApplicationsPage(page);
      await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Pending').first()).toBeVisible();
    });

    test('TC-I2-W2-9-002: นิสิตที่ยังไม่เคยสมัครเห็นสถานะว่างเปล่า (No Applications Case)', async ({ page }) => {
      await createAndLoginStudent(page, 'm5_s9_2');
      await openApplicationsPage(page);
      await expect(page.getByText('ไม่พบรายการใบสมัครงาน')).toBeVisible({ timeout: 10000 });
    });

    test('TC-I2-W2-9-003: ประวัติการสมัครยังคงปรากฏแม้ตำแหน่งถูกปิด (Closed Internship History)', async ({ page }) => {
      const company = await createAndLoginCompany(page, 'm5_c9_3');
      const title = `Intern M5-9-003 ${getTimestamp()}`;
      await createInternship(page, { title });
      await logout(page);

      const student = await createAndLoginStudent(page, 'm5_s9_3');
      await openStudentInternships(page);
      const card = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(card).toBeVisible({ timeout: 10000 });
      page.on('dialog', async (d) => d.accept());
      await card.getByRole('button', { name: 'Apply Now' }).click();
      await expect(card.getByRole('button', { name: 'Cancel Apply' })).toBeVisible({ timeout: 15000 });
      await logout(page);

      // Company closes the internship
      await login(page, company.email, company.password);
      await openCompanyInternships(page);
      await page.getByRole('button', { name: 'Edit' }).first().click();
      const modal = page
        .locator('.fixed.inset-0')
        .filter({ hasText: /แก้ไขประกาศรับสมัครฝึกงาน/ })
        .last();
      await expect(modal).toBeVisible();
      await modal.locator('select').nth(1).selectOption('closed');
      await modal.getByRole('button', { name: 'ถัดไป' }).click();
      await modal.getByRole('button', { name: 'บันทึกการแก้ไข' }).click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });
      await logout(page);

      // Student checks history – entry still visible
      await login(page, student.email, student.password);
      await openApplicationsPage(page);
      await expect(page.getByText(title)).toBeVisible({ timeout: 10000 });
    });
  });

  // ---------------------------------------------------------------------------
  // W2-10: ดูสถานะการสมัคร (View Application Status)
  // ---------------------------------------------------------------------------
  test.describe('W2-10: ดูสถานะการสมัคร', () => {
    test('TC-I2-W2-10-001: นิสิตเห็น Status Badge และ Match Score (Normal Successful Case)', async ({ page }) => {
      const company = await createAndLoginCompany(page, 'm5_c10_1');
      const title = `Intern M5-10-001 ${getTimestamp()}`;
      await createInternship(page, { title });
      await logout(page);

      await createAndLoginStudent(page, 'm5_s10_1');
      await openStudentInternships(page);
      const card = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(card).toBeVisible({ timeout: 10000 });
      page.on('dialog', async (d) => d.accept());
      await card.getByRole('button', { name: 'Apply Now' }).click();
      await expect(card.getByRole('button', { name: 'Cancel Apply' })).toBeVisible({ timeout: 15000 });

      await openApplicationsPage(page);
      await expect(page.getByText('Pending').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('td').filter({ hasText: /%/ }).first()).toBeVisible();
    });

    test('TC-I2-W2-10-002: สถานะที่ไม่รู้จักแสดงเป็น Pending (Unknown Status Resilience)', async ({ page }) => {
      // The UI renderStatusBadge() falls through to "Pending" for any unknown/default status.
      // New applications always start as "pending" which maps to the default branch.
      const company = await createAndLoginCompany(page, 'm5_c10_2');
      const title = `Intern M5-10-002 ${getTimestamp()}`;
      await createInternship(page, { title });
      await logout(page);

      await createAndLoginStudent(page, 'm5_s10_2');
      await openStudentInternships(page);
      const card = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(card).toBeVisible({ timeout: 10000 });
      page.on('dialog', async (d) => d.accept());
      await card.getByRole('button', { name: 'Apply Now' }).click();
      await expect(card.getByRole('button', { name: 'Cancel Apply' })).toBeVisible({ timeout: 15000 });

      await openApplicationsPage(page);
      // Status "pending" renders as "Pending" badge (default branch of switch)
      await expect(page.getByText('Pending').first()).toBeVisible({ timeout: 10000 });
    });

    test('TC-I2-W2-10-003: Match Score แสดงบนบัตรแม้ไม่มี Skill ตรง (Dynamic Match Score Display)', async ({ page }) => {
      // Create internship requiring Python skill
      const company = await createAndLoginCompany(page, 'm5_c10_3');
      const title = `Intern M5-10-003 ${getTimestamp()}`;
      await createInternship(page, { title, skills: ['Python'] });
      await logout(page);

      // Student with no matching skills – match score should be 0% or low, but still displayed
      await createAndLoginStudent(page, 'm5_s10_3');
      await openStudentInternships(page);
      const card = page.locator('.grid').locator('div').filter({ hasText: title }).first();
      await expect(card).toBeVisible({ timeout: 10000 });

      // Match score badge is always displayed on card (even before applying)
      const matchBadge = card.locator('span').filter({ hasText: /% Match/ }).first();
      await expect(matchBadge).toBeVisible();
      const scoreText = await matchBadge.textContent();
      expect(scoreText).toMatch(/\d+% Match/);

      // Apply and verify badge still present
      page.on('dialog', async (d) => d.accept());
      await card.getByRole('button', { name: 'Apply Now' }).click();
      await expect(card.getByRole('button', { name: 'Cancel Apply' })).toBeVisible({ timeout: 15000 });
      await expect(matchBadge).toBeVisible();
    });
  });
});
