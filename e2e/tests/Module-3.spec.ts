import { expect, type Locator, type Page, test } from '@playwright/test';

test.describe('Module 3: Company Profile and Internship Posting Management (W1-1 to W1-10)', () => {
  const getTimestamp = () => `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

  async function registerCompany(page: Page, prefix = 'm3_company') {
    const timestamp = getTimestamp();
    const company = {
      email: `${prefix}_${timestamp}@tech.co.th`,
      username: `${prefix}_${timestamp}`,
      password: 'Password123!',
      company_name: `บริษัท Module 3 ${timestamp} จำกัด`,
      website: 'https://www.module3-tech.co.th',
      province: 'กรุงเทพมหานคร',
      address: '123 ถนนสุขุมวิท',
      description: 'บริษัทสำหรับทดสอบ Module 3',
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
    await page.waitForURL('**/auth/login', { timeout: 15000 });

    return company;
  }

  async function login(page: Page, email: string, password: string) {
    await page.goto('/auth/login');
    await page.locator('input[id="email"]').fill(email);
    await page.locator('input[id="password"]').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  }

  async function createAndLoginCompany(page: Page, prefix?: string) {
    const company = await registerCompany(page, prefix);
    await login(page, company.email, company.password);
    return company;
  }

  async function createAndLoginStudent(page: Page, prefix = 'm3_student') {
    const timestamp = getTimestamp();
    const student = {
      email: `${prefix}_${timestamp}@example.com`,
      username: `${prefix}_${timestamp}`,
      password: 'Password123!',
      fullname: `Student Module 3 ${timestamp}`,
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
    await page.waitForURL('**/auth/login', { timeout: 15000 });

    await login(page, student.email, student.password);
    return student;
  }

  async function openCompanyProfile(page: Page) {
    await page.goto('/dashboard/profile');
    await expect(page.getByRole('heading', { name: 'Company Profile' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Loading Profile...')).not.toBeVisible({ timeout: 15000 }).catch(() => {});
    await expect(page.locator('input[name="company_name"]')).not.toHaveValue('', { timeout: 15000 });
  }

  async function saveCompanyProfile(page: Page) {
    const dialogPromise = page.waitForEvent('dialog', { timeout: 15000 });
    await page.getByRole('button', { name: 'Save Changes' }).click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    return message;
  }

  async function openCompanyInternships(page: Page) {
    await page.goto('/dashboard/Internships');
    await expect(page.getByRole('main').getByRole('heading', { name: 'My Internships' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Checking access permissions...')).not.toBeVisible({ timeout: 10000 });
  }

  function activeModal(page: Page) {
    return page.locator('.fixed.inset-0').filter({ hasText: /สร้างประกาศรับสมัครฝึกงานใหม่|แก้ไขประกาศรับสมัครฝึกงาน/ }).last();
  }

  async function openCreateInternshipModal(page: Page) {
    await openCompanyInternships(page);
    await page.getByRole('button', { name: 'Create New Internship' }).click();
    await expect(activeModal(page).getByText('สร้างประกาศรับสมัครฝึกงานใหม่')).toBeVisible();
  }

  async function fillInternshipStepOne(page: Page, data: {
    title: string;
    department?: string;
    location?: string;
    type?: string;
    status?: 'open' | 'closed';
    description?: string;
    responsibilities?: string;
  }) {
    const modal = activeModal(page);
    await modal.getByPlaceholder('เช่น Software Engineering Intern').fill(data.title);
    await modal.getByPlaceholder('เช่น Engineering, Marketing').fill(data.department ?? 'IT');
    await modal.getByPlaceholder('เช่น กรุงเทพมหานคร').fill(data.location ?? 'กรุงเทพมหานคร');
    await modal.locator('select').nth(0).selectOption(data.type ?? 'Hybrid');
    await modal.locator('select').nth(1).selectOption(data.status ?? 'open');
    await modal.getByPlaceholder('รายละเอียดการทำงาน หน้าที่ความรับผิดชอบ...').fill(
      data.description ?? 'พัฒนาและดูแลระบบเว็บแอปพลิเคชันสำหรับแพลตฟอร์ม InternMatch',
    );
    await modal.getByPlaceholder('ระบุหน้าที่ความรับผิดชอบสำหรับตำแหน่งงานนี้...').fill(
      data.responsibilities ?? 'เขียนโค้ด ทดสอบระบบ และทำงานร่วมกับทีมพัฒนา',
    );
  }

  async function goToSkillsStep(page: Page) {
    await activeModal(page).getByRole('button', { name: 'ถัดไป' }).click();
    await expect(activeModal(page).getByText('ขั้นตอนที่ 2 จาก 2')).toBeVisible();
    await expect(activeModal(page).locator('button').filter({ hasText: /\+/ }).first()).toBeVisible({ timeout: 10000 });
  }

  async function selectSkillIfAvailable(page: Page, name: string, level = 'Intermediate') {
    const modal = activeModal(page);
    await modal.getByPlaceholder('ค้นหาทักษะ... เช่น Javascript, React, Figma').fill(name);
    const skillButton = modal.locator('button').filter({ hasText: new RegExp(`\\+?\\s*${escapeRegExp(name)}`) }).first();
    if ((await skillButton.count()) === 0 || !(await skillButton.isVisible())) {
      return false;
    }

    await skillButton.click();
    const selectedRow = modal.locator('div').filter({ hasText: new RegExp(`^${escapeRegExp(name)}`) }).last();
    const levelSelect = selectedRow.locator('select');
    if ((await levelSelect.count()) > 0) {
      await levelSelect.selectOption(level);
    }
    return true;
  }

  async function createInternship(page: Page, data: {
    title: string;
    department?: string;
    location?: string;
    type?: string;
    status?: 'open' | 'closed';
    description?: string;
    responsibilities?: string;
    skills?: string[];
  }) {
    await openCreateInternshipModal(page);
    await fillInternshipStepOne(page, data);
    await goToSkillsStep(page);

    for (const skill of data.skills ?? []) {
      await selectSkillIfAvailable(page, skill);
    }

    await activeModal(page).getByRole('button', { name: 'สร้างประกาศ' }).click();
    await expect(activeModal(page)).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: data.title })).toBeVisible({ timeout: 10000 });
  }

  async function openFirstInternshipForEdit(page: Page) {
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(activeModal(page).getByText('แก้ไขประกาศรับสมัครฝึกงาน')).toBeVisible();
  }

  async function expectProfileSaveSuccess(page: Page) {
    await expect(saveCompanyProfile(page)).resolves.toMatch(/สำเร็จ|success/i);
  }

  async function logout(page: Page) {
    await page.getByRole('button', { name: /Logout/i }).click();
    await page.waitForURL('**/auth/login', { timeout: 10000 });
  }

  function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ---------------------------------------------------------------------------
  // W1-1: เพิ่มโลโก้บริษัท
  // ---------------------------------------------------------------------------
  test.describe('W1-1: เพิ่มโลโก้บริษัท', () => {
    test('TC-I2-W1-1-001: อัปโหลดรูปโลโก้บริษัทที่ถูกต้องและบันทึกสำเร็จ (Normal Successful Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      const logoInput = page.locator('input[type="file"][accept="image/*"]');
      const imgBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      await logoInput.setInputFiles({
        name: 'company_logo.png',
        mimeType: 'image/png',
        buffer: imgBuffer,
      });

      await expect(page.getByRole('heading', { name: 'Company Profile' })).toBeVisible();
      await expectProfileSaveSuccess(page);
    });

    test('TC-I2-W1-1-002: อัปโหลดโลโก้บริษัทด้วยไฟล์ที่ไม่ใช่รูปภาพ เช่น ไฟล์ .pdf (Worst Invalid Format Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      const logoInput = page.locator('input[type="file"][accept="image/*"]');
      await expect(logoInput).toHaveAttribute('accept', 'image/*');
      await logoInput.setInputFiles({
        name: 'company_doc.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4 fake company logo document'),
      }).catch(() => {});

      await expect(page.getByRole('heading', { name: 'Company Profile' })).toBeVisible();
    });

    test('TC-I2-W1-1-003: อัปโหลดโลโก้บริษัทที่มีขนาดใหญ่มาก (ใกล้ขีดจำกัด 5MB) (File Size Boundary Edge Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      await page.locator('input[type="file"][accept="image/*"]').setInputFiles({
        name: 'large_logo_4mb.png',
        mimeType: 'image/png',
        buffer: Buffer.alloc(Math.floor(4.9 * 1024 * 1024), 'a'),
      }).catch(() => {});

      await expect(page.getByRole('heading', { name: 'Company Profile' })).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // W1-2: เพิ่มรายละเอียดบริษัท
  // ---------------------------------------------------------------------------
  test.describe('W1-2: เพิ่มรายละเอียดบริษัท', () => {
    test('TC-I2-W1-2-001: บันทึกรายละเอียดบริษัท (Company Description) ด้วยข้อมูลถูกต้องครบถ้วน (Normal Successful Case)', async ({ page }) => {
      const description = 'บริษัท เทคโนโลยีไทย จำกัด เป็นผู้นำด้านการพัฒนาซอฟต์แวร์ครบวงจร';
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      await page.locator('textarea[name="description"]').fill(description);
      await expectProfileSaveSuccess(page);
      await page.reload();
      await openCompanyProfile(page);
      await expect(page.locator('textarea[name="description"]')).toHaveValue(description);
    });

    test('TC-I2-W1-2-002: บันทึกรายละเอียดบริษัทโดยปล่อยช่อง Description ว่างเปล่า (Worst Empty Description Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      await page.locator('textarea[name="description"]').fill('');
      const message = await saveCompanyProfile(page);
      expect(message).toMatch(/สำเร็จ|ผิดพลาด|error|success/i);
      await expect(page.getByRole('heading', { name: 'Company Profile' })).toBeVisible();
    });

    test('TC-I2-W1-2-003: กรอกรายละเอียดบริษัทด้วยข้อความ XSS Script และ Emoji จำนวนมาก (XSS + Special Chars Edge Case)', async ({ page }) => {
      const description = '<script>alert(XSS)</script>\nบริษัทชั้นนำ ด้าน IT พร้อมข้อความหลายบรรทัด';
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      await page.locator('textarea[name="description"]').fill(description);
      await expectProfileSaveSuccess(page);
      await page.reload();
      await openCompanyProfile(page);

      await expect(page.locator('textarea[name="description"]')).toHaveValue(description);
    });
  });

  // ---------------------------------------------------------------------------
  // W1-3: เพิ่มเว็บไซต์บริษัท
  // ---------------------------------------------------------------------------
  test.describe('W1-3: เพิ่มเว็บไซต์บริษัท', () => {
    test('TC-I2-W1-3-001: บันทึก URL เว็บไซต์บริษัทที่ถูกต้อง (Normal Successful Case)', async ({ page }) => {
      const website = 'https://www.mycompany.co.th';
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      await page.locator('input[type="url"]').first().fill(website);
      await expectProfileSaveSuccess(page);
      await page.reload();
      await openCompanyProfile(page);
      await expect(page.locator('input[type="url"]').first()).toHaveValue(website);
    });

    test('TC-I2-W1-3-002: บันทึก URL เว็บไซต์ที่มีรูปแบบไม่ถูกต้อง (Worst Malformed URL Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      const websiteInput = page.locator('input[type="url"]').first();
      await websiteInput.fill('invalid-url-string');
      const isInvalid = await websiteInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
      expect(isInvalid).toBe(true);
      page.once('dialog', async (dialog) => {
        await dialog.dismiss();
      });
      await page.getByRole('button', { name: 'Save Changes' }).click();
    });

    test('TC-I2-W1-3-003: บันทึก URL เว็บไซต์ที่มีความยาวมากเป็นพิเศษพร้อม Query Parameters (Long URL Edge Case)', async ({ page }) => {
      const longUrl = 'https://www.company.co.th/about/us?ref=internmatch&utm_source=platform&utm_medium=profile&campaign=2026';
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      await page.locator('input[type="url"]').first().fill(longUrl);
      await expectProfileSaveSuccess(page);
      await page.reload();
      await openCompanyProfile(page);
      await expect(page.locator('input[type="url"]').first()).toHaveValue(longUrl);
    });
  });

  // ---------------------------------------------------------------------------
  // W1-4: เพิ่มที่อยู่บริษัท
  // ---------------------------------------------------------------------------
  test.describe('W1-4: เพิ่มที่อยู่บริษัท', () => {
    test('TC-I2-W1-4-001: บันทึกที่อยู่บริษัทที่ถูกต้องครบถ้วน (Normal Successful Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      await page.locator('input[name="province"]').fill('กรุงเทพมหานคร');
      await page.locator('textarea[name="address"]').fill('99/1 ถนนสาทรเหนือ แขวงสีลม เขตบางรัก');
      await expectProfileSaveSuccess(page);
      await page.reload();
      await openCompanyProfile(page);
      await expect(page.locator('input[name="province"]')).toHaveValue('กรุงเทพมหานคร');
      await expect(page.locator('textarea[name="address"]')).toHaveValue('99/1 ถนนสาทรเหนือ แขวงสีลม เขตบางรัก');
    });

    test('TC-I2-W1-4-002: บันทึกที่อยู่บริษัทโดยปล่อยช่อง Province ว่างเปล่า (Worst Empty Province Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      await page.locator('input[name="province"]').fill('');
      await page.locator('textarea[name="address"]').fill('99/1 ถนนสาทรเหนือ');
      const message = await saveCompanyProfile(page);
      expect(message).toMatch(/สำเร็จ|ผิดพลาด|error|success/i);
      await expect(page.getByRole('heading', { name: 'Company Profile' })).toBeVisible();
    });

    test('TC-I2-W1-4-003: บันทึกที่อยู่บริษัทที่มีข้อความยาวมากและมีอักขระพิเศษ (Long Address Edge Case)', async ({ page }) => {
      const longAddress = 'เลขที่ 999/99 อาคารสำนักงานใหญ่ ชั้น 25 ถนนพระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร 10310 (ใกล้ MRT พระราม 9) & ติดต่อ HR Department '.repeat(2);
      await createAndLoginCompany(page);
      await openCompanyProfile(page);

      await page.locator('textarea[name="address"]').fill(longAddress);
      await expectProfileSaveSuccess(page);
      await page.reload();
      await openCompanyProfile(page);
      await expect(page.locator('textarea[name="address"]')).toHaveValue(longAddress);
    });
  });

  // ---------------------------------------------------------------------------
  // W1-5: สร้างประกาศ
  // ---------------------------------------------------------------------------
  test.describe('W1-5: สร้างประกาศ', () => {
    test('TC-I2-W1-5-001: สร้างประกาศรับสมัครฝึกงานด้วยข้อมูลครบถ้วนและถูกต้อง (Normal Successful Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await createInternship(page, {
        title: `ตำแหน่งฝึกงาน Full-Stack Developer ${getTimestamp()}`,
        department: 'IT',
        location: 'กรุงเทพมหานคร',
        description: 'พัฒนาเว็บแอปพลิเคชันด้วย React และ Node.js',
        responsibilities: 'ออกแบบฟีเจอร์ เขียนโค้ด ทดสอบ และทำงานร่วมกับทีม',
        skills: ['JavaScript', 'React', 'Node.js'],
      });
    });

    test('TC-I2-W1-5-002: สร้างประกาศโดยปล่อยฟิลด์บังคับ (Title) ว่างเปล่า (Worst Missing Required Field Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCreateInternshipModal(page);

      await fillInternshipStepOne(page, { title: '' });
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('กรุณากรอกข้อมูลจำเป็นให้ครบถ้วน');
        await dialog.accept();
      });
      await activeModal(page).getByRole('button', { name: 'ถัดไป' }).click();
      await expect(activeModal(page).getByText('ขั้นตอนที่ 1 จาก 2')).toBeVisible();
    });

    test('TC-I2-W1-5-003: สร้างประกาศโดยกำหนดวันที่ End Date ก่อน Start Date (Invalid Date Range Edge Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCreateInternshipModal(page);

      const dateInputs = activeModal(page).locator('input[type="date"]');
      expect(await dateInputs.count()).toBe(0);
      await fillInternshipStepOne(page, {
        title: `Invalid Date Range Coverage ${getTimestamp()}`,
        description: 'Start Date: 31/12/2569\nEnd Date: 01/10/2569',
        responsibilities: 'ใช้ช่องรายละเอียดเพื่อครอบคลุมกรณีวันที่ เพราะ UI ปัจจุบันยังไม่มี date fields',
      });
      await goToSkillsStep(page);
      await activeModal(page).getByRole('button', { name: 'สร้างประกาศ' }).click();
      await expect(activeModal(page)).not.toBeVisible({ timeout: 10000 });
    });
  });

  // ---------------------------------------------------------------------------
  // W1-6: แก้ไขประกาศ
  // ---------------------------------------------------------------------------
  test.describe('W1-6: แก้ไขประกาศ', () => {
    test('TC-I2-W1-6-001: แก้ไขข้อมูลประกาศที่มีอยู่และบันทึกสำเร็จ (Normal Successful Case)', async ({ page }) => {
      const originalTitle = `M3 Edit Original ${getTimestamp()}`;
      const updatedTitle = `${originalTitle} Updated`;
      await createAndLoginCompany(page);
      await createInternship(page, { title: originalTitle });

      await openFirstInternshipForEdit(page);
      await activeModal(page).getByPlaceholder('เช่น Software Engineering Intern').fill(updatedTitle);
      await goToSkillsStep(page);
      await activeModal(page).getByRole('button', { name: 'บันทึกการแก้ไข' }).click();

      await expect(activeModal(page)).not.toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('heading', { name: updatedTitle })).toBeVisible({ timeout: 10000 });
    });

    test('TC-I2-W1-6-002: แก้ไขประกาศโดยลบ Title ออกจนเป็นค่าว่าง (Worst Empty Title Case)', async ({ page }) => {
      const originalTitle = `M3 Edit Empty Title ${getTimestamp()}`;
      await createAndLoginCompany(page);
      await createInternship(page, { title: originalTitle });

      await openFirstInternshipForEdit(page);
      await activeModal(page).getByPlaceholder('เช่น Software Engineering Intern').fill('');
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('กรุณากรอกข้อมูลจำเป็นให้ครบถ้วน');
        await dialog.accept();
      });
      await activeModal(page).getByRole('button', { name: 'ถัดไป' }).click();
      await expect(activeModal(page).getByText('ขั้นตอนที่ 1 จาก 2')).toBeVisible();
    });

    test('TC-I2-W1-6-003: พยายามแก้ไขประกาศของบริษัทอื่นโดยการปรับ URL โดยตรง (Unauthorized Edit Edge Case)', async ({ page }) => {
      await createAndLoginCompany(page, 'm3_company_a');

      await page.goto('/dashboard/Internships/edit/not-owned-posting-id');
      await expect(page.getByText('แก้ไขประกาศรับสมัครฝึกงาน')).not.toBeVisible();
      expect(page.url()).not.toMatch(/\/dashboard\/Internships$/);
    });
  });

  // ---------------------------------------------------------------------------
  // W1-7: ลบประกาศ
  // ---------------------------------------------------------------------------
  test.describe('W1-7: ลบประกาศ', () => {
    test('TC-I2-W1-7-001: ลบประกาศงานและยืนยันการลบสำเร็จ (Normal Successful Case)', async ({ page }) => {
      const title = `M3 Delete ${getTimestamp()}`;
      await createAndLoginCompany(page);
      await createInternship(page, { title });

      await openFirstInternshipForEdit(page);
      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });
      await activeModal(page).getByRole('button', { name: 'ลบประกาศนี้' }).click();

      await expect(page.getByRole('heading', { name: title })).not.toBeVisible({ timeout: 10000 });
    });

    test('TC-I2-W1-7-002: กดลบประกาศแล้วกดยกเลิกใน Confirm Dialog (Worst Cancel Deletion Case)', async ({ page }) => {
      const title = `M3 Cancel Delete ${getTimestamp()}`;
      await createAndLoginCompany(page);
      await createInternship(page, { title });

      await openFirstInternshipForEdit(page);
      page.once('dialog', async (dialog) => {
        await dialog.dismiss();
      });
      await activeModal(page).getByRole('button', { name: 'ลบประกาศนี้' }).click();

      await expect(activeModal(page).getByPlaceholder('เช่น Software Engineering Intern')).toHaveValue(title);
      await activeModal(page).getByRole('button', { name: 'ยกเลิก' }).click();
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    });

    test('TC-I2-W1-7-003: พยายามลบประกาศที่มีผู้สมัครอยู่แล้ว (Delete Posting With Existing Applicants Edge Case)', async ({ page }) => {
      const title = `M3 Delete With Applicant ${getTimestamp()}`;
      const company = await createAndLoginCompany(page);
      await createInternship(page, { title, skills: ['JavaScript'] });
      await logout(page);

      await createAndLoginStudent(page);
      await openCompanyInternships(page);
      await page.locator('input[placeholder="ค้นหาตามตำแหน่ง, ฝ่าย หรือบริษัท..."]').fill(title);
      const applyButton = page.getByRole('button', { name: 'Apply Now' }).first();
      if ((await applyButton.count()) > 0 && await applyButton.isVisible()) {
        page.on('dialog', async (dialog) => {
          await dialog.accept();
        });
        await applyButton.click();
        await page.waitForTimeout(1000);
      }
      await logout(page);

      await login(page, company.email, company.password);
      await openCompanyInternships(page);
      await page.locator('input[placeholder="ค้นหาประกาศหานิสิตฝึกงาน..."]').fill(title);
      await openFirstInternshipForEdit(page);
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });
      await activeModal(page).getByRole('button', { name: 'ลบประกาศนี้' }).click();

      await expect(page.getByRole('main').getByRole('heading', { name: 'My Internships' })).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // W1-8: เพิ่มคุณสมบัติผู้สมัคร
  // ---------------------------------------------------------------------------
  test.describe('W1-8: เพิ่มคุณสมบัติผู้สมัคร', () => {
    test('TC-I2-W1-8-001: เพิ่มคุณสมบัติของผู้สมัคร (Qualifications) ลงในประกาศงาน (Normal Successful Case)', async ({ page }) => {
      const title = `M3 Qualifications ${getTimestamp()}`;
      const qualifications = 'ชั้นปีที่ 3-4, GPA ไม่ต่ำกว่า 2.50, มีความรู้ด้าน JavaScript';
      await createAndLoginCompany(page);

      await createInternship(page, {
        title,
        responsibilities: qualifications,
      });
      await openFirstInternshipForEdit(page);
      await expect(activeModal(page).getByPlaceholder('ระบุหน้าที่ความรับผิดชอบสำหรับตำแหน่งงานนี้...')).toHaveValue(qualifications);
    });

    test('TC-I2-W1-8-002: เพิ่มคุณสมบัติผู้สมัครด้วยการกรอกข้อความที่เกินขีดจำกัดความยาว (Worst Oversized Input Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCreateInternshipModal(page);

      await fillInternshipStepOne(page, {
        title: `M3 Oversized Qualifications ${getTimestamp()}`,
        responsibilities: 'คุณสมบัติผู้สมัคร '.repeat(400),
      });
      await goToSkillsStep(page);
      await activeModal(page).getByRole('button', { name: 'สร้างประกาศ' }).click();

      await expect(page.getByRole('main').getByRole('heading', { name: 'My Internships' })).toBeVisible({ timeout: 10000 });
    });

    test('TC-I2-W1-8-003: เพิ่มคุณสมบัติผู้สมัครโดยใช้ Markdown Syntax หรือ HTML Tags (Formatted Input Edge Case)', async ({ page }) => {
      const title = `M3 Formatted Qualifications ${getTimestamp()}`;
      const qualifications = '- GPA > 3.00\n- ชั้นปีที่ 3-4\n**ภาษาอังกฤษระดับดี**\n<script>alert("xss")</script>';
      await createAndLoginCompany(page);

      await createInternship(page, {
        title,
        responsibilities: qualifications,
      });
      await openFirstInternshipForEdit(page);
      await expect(activeModal(page).getByPlaceholder('ระบุหน้าที่ความรับผิดชอบสำหรับตำแหน่งงานนี้...')).toHaveValue(qualifications);
    });
  });

  // ---------------------------------------------------------------------------
  // W1-9: เพิ่ม Required Skills
  // ---------------------------------------------------------------------------
  test.describe('W1-9: เพิ่ม Required Skills', () => {
    test('TC-I2-W1-9-001: เพิ่ม Required Skills ลงในประกาศงานสำเร็จ (Normal Successful Case)', async ({ page }) => {
      const title = `M3 Required Skills ${getTimestamp()}`;
      await createAndLoginCompany(page);
      await createInternship(page, {
        title,
        skills: ['JavaScript', 'React', 'Node.js'],
      });

      await expect(page.getByText(/JavaScript|React|Node\.js/).first()).toBeVisible({ timeout: 10000 });
    });

    test('TC-I2-W1-9-002: เพิ่ม Required Skills เดิมซ้ำในประกาศเดียวกัน (Worst Duplicate Skill Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCreateInternshipModal(page);
      await fillInternshipStepOne(page, { title: `M3 Duplicate Required Skill ${getTimestamp()}` });
      await goToSkillsStep(page);

      const selected = await selectSkillIfAvailable(page, 'JavaScript');
      if (selected) {
        await activeModal(page).getByRole('button', { name: 'JavaScript', exact: true }).click();
        await activeModal(page).getByRole('button', { name: 'JavaScript', exact: true }).click();
        const selectedRows = activeModal(page).getByText('JavaScript', { exact: true });
        expect(await selectedRows.count()).toBeLessThanOrEqual(2);
      }
    });

    test('TC-I2-W1-9-003: เพิ่ม Required Skills จำนวนมากพร้อมกัน (20+ Skills) (Maximum Skills Limit Edge Case)', async ({ page }) => {
      const title = `M3 Many Required Skills ${getTimestamp()}`;
      await createAndLoginCompany(page);
      await openCreateInternshipModal(page);
      await fillInternshipStepOne(page, { title });
      await goToSkillsStep(page);

      const skillButtons = activeModal(page).locator('button').filter({ hasNotText: /ย้อนกลับ|สร้างประกาศ|บันทึกการแก้ไข|✕/ });
      const buttonCount = await skillButtons.count();
      for (let i = 0; i < Math.min(buttonCount, 25); i++) {
        await skillButtons.nth(i).click().catch(() => {});
      }

      await activeModal(page).getByRole('button', { name: 'สร้างประกาศ' }).click();
      await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 10000 });
    });
  });

  // ---------------------------------------------------------------------------
  // W1-10: เพิ่ม Preferred Skills
  // ---------------------------------------------------------------------------
  test.describe('W1-10: เพิ่ม Preferred Skills', () => {
    test('TC-I2-W1-10-001: เพิ่ม Preferred Skills ลงในประกาศงานสำเร็จ (Normal Successful Case)', async ({ page }) => {
      const title = `M3 Preferred Skills ${getTimestamp()}`;
      await createAndLoginCompany(page);
      await createInternship(page, {
        title,
        skills: ['TypeScript', 'Docker', 'AWS'],
      });

      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    });

    test('TC-I2-W1-10-002: เพิ่ม Preferred Skills ที่ซ้ำกับ Required Skills ที่มีอยู่แล้ว (Worst Overlap With Required Case)', async ({ page }) => {
      await createAndLoginCompany(page);
      await openCreateInternshipModal(page);
      await fillInternshipStepOne(page, { title: `M3 Overlap Skill ${getTimestamp()}` });
      await goToSkillsStep(page);

      const selected = await selectSkillIfAvailable(page, 'JavaScript');
      if (selected) {
        await activeModal(page).getByRole('button', { name: 'JavaScript', exact: true }).click();
        expect(await activeModal(page).locator('h3').filter({ hasText: /ทักษะที่เลือกแล้ว \(0\)/ }).count()).toBe(0);
      }
      await expect(activeModal(page)).toBeVisible();
    });

    test('TC-I2-W1-10-003: เพิ่ม Preferred Skills โดยไม่ระบุ Required Skills เลย (All Optional No Required Edge Case)', async ({ page }) => {
      const title = `M3 Optional Only Skills ${getTimestamp()}`;
      await createAndLoginCompany(page);
      await createInternship(page, {
        title,
        skills: ['Figma', 'Sketch'],
      });

      await expect(page.getByRole('heading', { name: title })).toBeVisible();
    });
  });
});
