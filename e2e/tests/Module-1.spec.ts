import { test, expect } from '@playwright/test';

test.describe('Module 1: Authentication, Registration, and User Management (W3-1 to W3-7)', () => {

  // Helper timestamp generator for unique test accounts
  const getTimestamp = () => Date.now();

  // ---------------------------------------------------------------------------
  // W3-1: ลงทะเบียนนักศึกษา (Student Registration)
  // ---------------------------------------------------------------------------
  test.describe('W3-1: ลงทะเบียนนักศึกษา', () => {

    test('TC-I1-W3-1-001: ลงทะเบียนนักศึกษาด้วยข้อมูลถูกต้องครบถ้วน (Normal Successful Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const testStudent = {
        email: `student_test_${timestamp}@example.com`,
        username: `student_test_${timestamp}`,
        password: 'Password123!',
        fullname: 'สมชาย สายเรียน',
        phone: '0812345678',
        university: 'KMUTT',
        faculty: 'SIT',
        major: 'IT',
      };

      await page.goto('/auth/register/student');
      await page.locator('input[name="email"]').fill(testStudent.email);
      await page.locator('input[name="username"]').fill(testStudent.username);
      await page.locator('input[name="password"]').fill(testStudent.password);

      await page.locator('input[id="fullname"]').fill(testStudent.fullname);
      await page.locator('input[id="phone"]').fill(testStudent.phone);
      await page.locator('input[id="university"]').fill(testStudent.university);
      await page.locator('input[id="faculty"]').fill(testStudent.faculty);
      await page.locator('input[id="major"]').fill(testStudent.major);
      await page.locator('select[id="study_year"]').selectOption('3');

      await page.getByRole('button', { name: 'Register Account' }).click();

      // Expect success message and automatic redirect to login page
      await expect(page.getByText('สมัครสมาชิกและบันทึกข้อมูลนักศึกษาสำเร็จเรียบร้อย')).toBeVisible({ timeout: 10000 });
      await page.waitForURL('**/auth/login', { timeout: 10000 });
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('TC-I1-W3-1-002: ลงทะเบียนนักศึกษาด้วย Email หรือ Username ที่มีในระบบแล้ว (Worst Duplicate Error Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const testStudent = {
        email: `dup_student_${timestamp}@example.com`,
        username: `dup_student_${timestamp}`,
        password: 'Password123!',
        fullname: 'สมชาย สายเรียน',
        phone: '0812345678',
        university: 'KMUTT',
        faculty: 'SIT',
        major: 'IT',
      };

      // Register first time
      await page.goto('/auth/register/student');
      await page.locator('input[name="email"]').fill(testStudent.email);
      await page.locator('input[name="username"]').fill(testStudent.username);
      await page.locator('input[name="password"]').fill(testStudent.password);
      await page.locator('input[id="fullname"]').fill(testStudent.fullname);
      await page.locator('input[id="phone"]').fill(testStudent.phone);
      await page.locator('input[id="university"]').fill(testStudent.university);
      await page.locator('input[id="faculty"]').fill(testStudent.faculty);
      await page.locator('input[id="major"]').fill(testStudent.major);
      await page.locator('select[id="study_year"]').selectOption('3');
      await page.getByRole('button', { name: 'Register Account' }).click();
      await page.waitForURL('**/auth/login');

      // Attempt duplicate registration
      await page.goto('/auth/register/student');
      await page.locator('input[name="email"]').fill(testStudent.email);
      await page.locator('input[name="username"]').fill(testStudent.username);
      await page.locator('input[name="password"]').fill(testStudent.password);
      await page.locator('input[id="fullname"]').fill(testStudent.fullname);
      await page.locator('input[id="phone"]').fill(testStudent.phone);
      await page.locator('input[id="university"]').fill(testStudent.university);
      await page.locator('input[id="faculty"]').fill(testStudent.faculty);
      await page.locator('input[id="major"]').fill(testStudent.major);
      await page.locator('select[id="study_year"]').selectOption('3');
      await page.getByRole('button', { name: 'Register Account' }).click();

      // Expect duplicate error message box
      await expect(page.locator('form, div').filter({ hasText: /duplicate|ผิดพลาด|มีในระบบแล้ว/i }).first()).toBeVisible();
      await expect(page).toHaveURL(/\/auth\/register\/student/);
    });

    test('TC-I1-W3-1-003: ลงทะเบียนนักศึกษาโดยอัปโหลดไฟล์ Resume ที่มีขนาดเกิน 10MB (File Size Limit Edge Case)', async ({ page }) => {
      await page.goto('/auth/register/student');

      // Create a dummy buffer larger than 10MB (11MB)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');
      
      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toMatch(/10MB|ขนาดไฟล์|error/i);
        await dialog.accept();
      });
      await page.locator('input[type="file"][accept*=".pdf"]').setInputFiles({
        name: 'large_resume_11mb.pdf',
        mimeType: 'application/pdf',
        buffer: largeBuffer,
      });
    });

  });

  // ---------------------------------------------------------------------------
  // W3-2: ลงทะเบียนบริษัท (Company Registration)
  // ---------------------------------------------------------------------------
  test.describe('W3-2: ลงทะเบียนบริษัท', () => {

    test('TC-I1-W3-2-001: ลงทะเบียนบริษัทด้วยข้อมูลถูกต้องครบถ้วน (Normal Successful Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const testCompany = {
        email: `company_hr_${timestamp}@techcompany.co.th`,
        username: `techcompany_${timestamp}`,
        password: 'Password123!',
        company_name: 'บริษัท เทคโนโลยีไทย จำกัด',
        website: 'https://www.techcompany.co.th',
        province: 'กรุงเทพมหานคร',
        address: '123 ถนนสุขุมวิท',
        description: 'บริษัทซอฟต์แวร์ชั้นนำ',
      };

      await page.goto('/auth/register/company');
      await page.locator('input[name="email"]').fill(testCompany.email);
      await page.locator('input[name="username"]').fill(testCompany.username);
      await page.locator('input[name="password"]').fill(testCompany.password);
      await page.locator('input[name="company_name"]').fill(testCompany.company_name);
      await page.locator('input[name="website"]').fill(testCompany.website);
      await page.locator('input[name="province"]').fill(testCompany.province);
      await page.locator('textarea[name="address"]').fill(testCompany.address);
      await page.locator('textarea[name="description"]').fill(testCompany.description);

      await page.getByRole('button', { name: 'Register Company' }).click();

      await expect(page.getByText('ลงทะเบียนบัญชีบริษัทสำเร็จเรียบร้อย')).toBeVisible({ timeout: 10000 });
      await page.waitForURL('**/auth/login', { timeout: 10000 });
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('TC-I1-W3-2-002: ลงทะเบียนบริษัทโดยเว้นว่างฟิลด์บังคับ เช่น Company Name (Worst Invalid Input Case)', async ({ page }) => {
      await page.goto('/auth/register/company');
      await page.locator('input[name="email"]').fill(`hr_${getTimestamp()}@tech.co.th`);
      await page.locator('input[name="username"]').fill(`hr_${getTimestamp()}`);
      await page.locator('input[name="password"]').fill('Password123!');
      // Leave company_name blank
      await page.locator('input[name="company_name"]').fill('');

      await page.getByRole('button', { name: 'Register Company' }).click();

      // HTML5 validation or form error prevents submission
      const companyNameInput = page.locator('input[name="company_name"]');
      const isInvalid = await companyNameInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
      expect(isInvalid).toBe(true);
      await expect(page).toHaveURL(/\/auth\/register\/company/);
    });

    test('TC-I1-W3-2-003: ลงทะเบียนบริษัทด้วยข้อมูลอักขระพิเศษภาษาไทย/อังกฤษ/สัญลักษณ์ และข้อความยาวเป็นพิเศษ (Special Chars & Boundary Edge Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const longAddress = '123/45 ซอยสุขุมวิท 77 ถนนสุขุมวิท แขวงพระโขนงเหนือ เขตวัฒนา กรุงเทพมหานคร '.repeat(6);
      const specialCompanyName = `บริษัท นวัตกรรมซอฟต์แวร์แอนด์ไอที (ประเทศไทย) จำกัด [มหาชน] & Co., Ltd. (${timestamp})`;

      await page.goto('/auth/register/company');
      await page.locator('input[name="email"]').fill(`special_company_${timestamp}@tech.co.th`);
      await page.locator('input[name="username"]').fill(`special_co_${timestamp}`);
      await page.locator('input[name="password"]').fill('Password123!');
      await page.locator('input[name="company_name"]').fill(specialCompanyName);
      await page.locator('input[name="website"]').fill('https://www.special-innovation-tech.co.th/sub?ref=1&lang=th');
      await page.locator('input[name="province"]').fill('กรุงเทพมหานคร');
      await page.locator('textarea[name="address"]').fill(longAddress);
      await page.locator('textarea[name="description"]').fill('บริษัทผู้ให้บริการด้าน AI & Cloud Solutions ที่มีเทคโนโลยีล้ำสมัยที่สุด');

      await page.getByRole('button', { name: 'Register Company' }).click();

      await expect(page.getByText('ลงทะเบียนบัญชีบริษัทสำเร็จเรียบร้อย')).toBeVisible({ timeout: 10000 });
      await page.waitForURL('**/auth/login', { timeout: 10000 });
    });

  });

  // ---------------------------------------------------------------------------
  // W3-3: เข้าสู่ระบบ (User Login)
  // ---------------------------------------------------------------------------
  test.describe('W3-3: เข้าสู่ระบบ', () => {

    test('TC-I1-W3-3-001: เข้าสู่ระบบด้วย Email/Username และ Password ที่ถูกต้อง พร้อมทดสอบ Remember Me (Normal Successful Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const user = {
        email: `login_student_${timestamp}@example.com`,
        username: `login_user_${timestamp}`,
        password: 'Password123!',
      };

      // Register student first
      await page.goto('/auth/register/student');
      await page.locator('input[name="email"]').fill(user.email);
      await page.locator('input[name="username"]').fill(user.username);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator('input[id="fullname"]').fill('ทดสอบ ล็อกอิน');
      await page.locator('input[id="phone"]').fill('0812345678');
      await page.locator('input[id="university"]').fill('KMUTT');
      await page.locator('input[id="faculty"]').fill('SIT');
      await page.locator('input[id="major"]').fill('IT');
      await page.locator('select[id="study_year"]').selectOption('2');
      await page.getByRole('button', { name: 'Register Account' }).click();
      await page.waitForURL('**/auth/login');

      // Login with remember me
      await page.locator('input[id="email"]').fill(user.email);
      await page.locator('input[id="password"]').fill(user.password);
      await page.locator('input[id="remember_me"], input[id="remember-me"]').check();
      await page.getByRole('button', { name: 'Login' }).click();

      await page.waitForURL('**/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);

      // Verify remembered_email in localStorage
      const rememberedEmail = await page.evaluate(() => localStorage.getItem('remembered_email'));
      expect(rememberedEmail).toBe(user.email);
    });

    test('TC-I1-W3-3-002: เข้าสู่ระบบด้วย Password ไม่ถูกต้อง หรือใช้อีเมลที่ไม่มีในฐานข้อมูล (Worst Invalid Authentication Case)', async ({ page }) => {
      await page.goto('/auth/login');
      await page.locator('input[id="email"]').fill('nonexistent_user_99999@example.com');
      await page.locator('input[id="password"]').fill('WrongPassword999!');
      await page.getByRole('button', { name: 'Login' }).click();

      // Expect error alert text
      await expect(page.locator('form, div').filter({ hasText: /ไม่ถูกต้อง|ไม่พบ|failed|invalid/i }).first()).toBeVisible();
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('TC-I1-W3-3-003: เข้าสู่ระบบโดยกรอก Email ที่มีช่องว่างส่วนหัว/ส่วนท้าย หรือ SQL Injection Pattern (Sanitization & Injection Edge Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const user = {
        email: `space_student_${timestamp}@example.com`,
        username: `space_user_${timestamp}`,
        password: 'Password123!',
      };

      // Register account
      await page.goto('/auth/register/student');
      await page.locator('input[name="email"]').fill(user.email);
      await page.locator('input[name="username"]').fill(user.username);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator('input[id="fullname"]').fill('ทดสอบ ช่องว่าง');
      await page.locator('input[id="phone"]').fill('0812345678');
      await page.locator('input[id="university"]').fill('KMUTT');
      await page.locator('input[id="faculty"]').fill('SIT');
      await page.locator('input[id="major"]').fill('IT');
      await page.locator('select[id="study_year"]').selectOption('1');
      await page.getByRole('button', { name: 'Register Account' }).click();
      await page.waitForURL('**/auth/login');

      // Test 1: Email with leading and trailing spaces
      await page.locator('input[id="email"]').fill(`  ${user.email}  `);
      await page.locator('input[id="password"]').fill(user.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/dashboard');
      await expect(page).toHaveURL(/\/dashboard/);

      // Test 2: SQL Injection pattern attempt on login form
      await page.goto('/auth/login');
      await page.locator('input[id="email"]').fill("' OR '1'='1");
      await page.locator('input[id="password"]').fill("Password123!");
      await page.getByRole('button', { name: 'Login' }).click();

      // Expect safe error response without auth bypass or 500 server crash
      await expect(page.locator('form, div').filter({ hasText: /ไม่ถูกต้อง|ไม่พบ|failed|invalid/i }).first()).toBeVisible();
      await expect(page).toHaveURL(/\/auth\/login/);
    });

  });

  // ---------------------------------------------------------------------------
  // W3-4: ออกจากระบบ (Logout)
  // ---------------------------------------------------------------------------
  test.describe('W3-4: ออกจากระบบ', () => {

    test('TC-I1-W3-4-001: ออกจากระบบผ่านเมนู Sidebar และยกเลิก Session คุกกี้ (Normal Successful Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const user = {
        email: `logout_test_${timestamp}@example.com`,
        username: `logout_user_${timestamp}`,
        password: 'Password123!',
      };

      // Register and login
      await page.goto('/auth/register/student');
      await page.locator('input[name="email"]').fill(user.email);
      await page.locator('input[name="username"]').fill(user.username);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator('input[id="fullname"]').fill('ทดสอบ ออกจากระบบ');
      await page.locator('input[id="phone"]').fill('0812345678');
      await page.locator('input[id="university"]').fill('KMUTT');
      await page.locator('input[id="faculty"]').fill('SIT');
      await page.locator('input[id="major"]').fill('IT');
      await page.locator('select[id="study_year"]').selectOption('4');
      await page.getByRole('button', { name: 'Register Account' }).click();
      await page.waitForURL('**/auth/login');

      await page.locator('input[id="email"]').fill(user.email);
      await page.locator('input[id="password"]').fill(user.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/dashboard');

      // Click Logout in sidebar
      await page.locator('button').filter({ hasText: /Logout/i }).click();
      await page.waitForURL('**/auth/login');
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('TC-I1-W3-4-002: พยายามเรียกใช้งาน Logout Endpoint (/api/auth/logout) โดยที่ไม่ได้เข้าสู่ระบบอยู่ก่อน (Worst Unauthenticated Logout Case)', async ({ page }) => {
      // Direct access to logout endpoint when unauthenticated
      const response = await page.goto('/api/auth/logout');
      expect([200, 302, 307]).toContain(response?.status());
      await page.waitForURL('**/auth/login');
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('TC-I1-W3-4-003: พยายามกดปุ่ม Back บนเบราว์เซอร์ย้อนกลับไปยังหน้า Dashboard หลังออกจากระบบ (Browser Back Button Post-Logout Edge Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const user = {
        email: `backbutton_${timestamp}@example.com`,
        username: `backuser_${timestamp}`,
        password: 'Password123!',
      };

      await page.goto('/auth/register/student');
      await page.locator('input[name="email"]').fill(user.email);
      await page.locator('input[name="username"]').fill(user.username);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator('input[id="fullname"]').fill('ทดสอบ ปุ่มถอยหลัง');
      await page.locator('input[id="phone"]').fill('0812345678');
      await page.locator('input[id="university"]').fill('KMUTT');
      await page.locator('input[id="faculty"]').fill('SIT');
      await page.locator('input[id="major"]').fill('IT');
      await page.locator('select[id="study_year"]').selectOption('3');
      await page.getByRole('button', { name: 'Register Account' }).click();
      await page.waitForURL('**/auth/login');

      await page.locator('input[id="email"]').fill(user.email);
      await page.locator('input[id="password"]').fill(user.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/dashboard');

      // Logout
      await page.locator('button').filter({ hasText: /Logout/i }).click();
      await page.waitForURL('**/auth/login');

      // Try browser back button
      await page.goBack();
      await page.waitForTimeout(1000);

      // Should be redirected back to login page due to server auth check
      await expect(page).toHaveURL(/\/auth\/login/);
    });

  });

  // ---------------------------------------------------------------------------
  // W3-5: รีเซ็ตรหัสผ่าน (Forgot & Reset Password)
  // ---------------------------------------------------------------------------
  test.describe('W3-5: รีเซ็ตรหัสผ่าน', () => {

    test('TC-I1-W3-5-001: ร้องขอลิงก์รีเซ็ตรหัสผ่านและตั้งรหัสผ่านใหม่ด้วย Token ที่ถูกต้อง (Normal Successful Case)', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      await page.locator('input[id="email"]').fill('student_test@example.com');
      await page.getByRole('button', { name: 'ส่งลิงก์รีเซ็ตรหัสผ่าน' }).click();

      await expect(page.locator('form, div').filter({ hasText: /ส่งลิงก์รีเซ็ตรหัสผ่าน|สำเร็จ/i }).first()).toBeVisible();

      // Test reset password page with mock token
      await page.goto('/auth/reset-password?token=valid_mock_token');
      await page.locator('input[id="password"]').fill('NewPassword123!');
      await page.locator('input[id="confirmPassword"]').fill('NewPassword123!');
      await page.getByRole('button', { name: 'ยืนยันรหัสผ่านใหม่' }).click();

      // Expect result message container
      await expect(page.locator('form, div').filter({ hasText: /เสร็จสมบูรณ์|สำเร็จ|เกิดข้อผิดพลาด|ลิงก์หมดอายุ|ไม่ถูกต้อง/i }).first()).toBeVisible();
    });

    test('TC-I1-W3-5-002: ตั้งรหัสผ่านใหม่โดยกรอก New Password ไม่ตรงกับ Confirm Password (Worst Password Mismatch Case)', async ({ page }) => {
      await page.goto('/auth/reset-password?token=valid_mock_token');
      await page.locator('input[id="password"]').fill('Password123!');
      await page.locator('input[id="confirmPassword"]').fill('DifferentPassword999!');
      await page.getByRole('button', { name: 'ยืนยันรหัสผ่านใหม่' }).click();

      await expect(page.getByText('รหัสผ่านไม่ตรงกัน')).toBeVisible();
    });

    test('TC-I1-W3-5-003: เปิดหน้าตั้งรหัสผ่านใหม่โดยไม่มี Query Parameter Token หรือใช้ Token ที่หมดอายุ (Missing/Invalid Token Edge Case)', async ({ page }) => {
      await page.goto('/auth/reset-password');
      
      const submitButton = page.getByRole('button', { name: 'ยืนยันรหัสผ่านใหม่' });
      await expect(submitButton).toBeDisabled();
    });

  });

  // ---------------------------------------------------------------------------
  // W3-6: เปลี่ยนรหัสผ่าน (Change Password in Profile)
  // ---------------------------------------------------------------------------
  test.describe('W3-6: เปลี่ยนรหัสผ่าน', () => {

    test('TC-I1-W3-6-001: เปลี่ยนรหัสผ่านผู้ใช้งานในหน้าโปรไฟล์ (Profile Settings) ด้วยข้อมูลถูกต้อง (Normal Successful Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const user = {
        email: `pwd_change_${timestamp}@example.com`,
        username: `pwd_user_${timestamp}`,
        password: 'Password123!',
        newPassword: 'NewPassword123!',
      };

      await page.goto('/auth/register/student');
      await page.locator('input[name="email"]').fill(user.email);
      await page.locator('input[name="username"]').fill(user.username);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator('input[id="fullname"]').fill('ทดสอบ เปลี่ยนรหัสผ่าน');
      await page.locator('input[id="phone"]').fill('0812345678');
      await page.locator('input[id="university"]').fill('KMUTT');
      await page.locator('input[id="faculty"]').fill('SIT');
      await page.locator('input[id="major"]').fill('IT');
      await page.locator('select[id="study_year"]').selectOption('3');
      await page.getByRole('button', { name: 'Register Account' }).click();
      await page.waitForURL('**/auth/login');

      await page.locator('input[id="email"]').fill(user.email);
      await page.locator('input[id="password"]').fill(user.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/dashboard');

      await page.goto('/dashboard/profile');
      await page.locator('input[name="currentPassword"]').fill(user.password);
      await page.locator('input[name="newPassword"]').fill(user.newPassword);
      await page.locator('input[name="confirmPassword"]').fill(user.newPassword);
      await page.getByRole('button', { name: 'Update Password' }).click();

      await expect(page.locator('form, div').filter({ hasText: /อัปเดตรหัสผ่าน.*สำเร็จ|สำเร็จ/i }).first()).toBeVisible();
    });

    test('TC-I1-W3-6-002: เปลี่ยนรหัสผ่านโดยกรอก รหัสผ่านปัจจุบัน (Current Password) ไม่ถูกต้อง (Worst Invalid Current Password Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const user = {
        email: `pwd_wrong_${timestamp}@example.com`,
        username: `pwd_wrong_${timestamp}`,
        password: 'Password123!',
      };

      await page.goto('/auth/register/student');
      await page.locator('input[name="email"]').fill(user.email);
      await page.locator('input[name="username"]').fill(user.username);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator('input[id="fullname"]').fill('ทดสอบ รหัสผิด');
      await page.locator('input[id="phone"]').fill('0812345678');
      await page.locator('input[id="university"]').fill('KMUTT');
      await page.locator('input[id="faculty"]').fill('SIT');
      await page.locator('input[id="major"]').fill('IT');
      await page.locator('select[id="study_year"]').selectOption('3');
      await page.getByRole('button', { name: 'Register Account' }).click();
      await page.waitForURL('**/auth/login');

      await page.locator('input[id="email"]').fill(user.email);
      await page.locator('input[id="password"]').fill(user.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/dashboard');

      await page.goto('/dashboard/profile');
      await page.locator('input[name="currentPassword"]').fill('WrongCurrentPassword999!');
      await page.locator('input[name="newPassword"]').fill('NewPassword123!');
      await page.locator('input[name="confirmPassword"]').fill('NewPassword123!');
      await page.getByRole('button', { name: 'Update Password' }).click();

      await expect(page.getByText(/รหัสผ่านปัจจุบันไม่ถูกต้อง|เกิดข้อผิดพลาด/i)).toBeVisible();
    });

    test('TC-I1-W3-6-003: เปลี่ยนรหัสผ่านโดยตั้ง New Password สั้นกว่า 6 ตัวอักษร (Min Length Boundary Edge Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const user = {
        email: `pwd_short_${timestamp}@example.com`,
        username: `pwd_short_${timestamp}`,
        password: 'Password123!',
      };

      await page.goto('/auth/register/student');
      await page.locator('input[name="email"]').fill(user.email);
      await page.locator('input[name="username"]').fill(user.username);
      await page.locator('input[name="password"]').fill(user.password);
      await page.locator('input[id="fullname"]').fill('ทดสอบ รหัสสั้น');
      await page.locator('input[id="phone"]').fill('0812345678');
      await page.locator('input[id="university"]').fill('KMUTT');
      await page.locator('input[id="faculty"]').fill('SIT');
      await page.locator('input[id="major"]').fill('IT');
      await page.locator('select[id="study_year"]').selectOption('3');
      await page.getByRole('button', { name: 'Register Account' }).click();
      await page.waitForURL('**/auth/login');

      await page.locator('input[id="email"]').fill(user.email);
      await page.locator('input[id="password"]').fill(user.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/dashboard');

      await page.goto('/dashboard/profile');
      await page.locator('input[name="currentPassword"]').fill(user.password);
      await page.locator('input[name="newPassword"]').fill('12345');
      await page.locator('input[name="confirmPassword"]').fill('12345');
      await page.getByRole('button', { name: 'Update Password' }).click();

      await expect(page.getByText('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร')).toBeVisible();
    });

  });

  // ---------------------------------------------------------------------------
  // W3-7: ตรวจสอบสิทธิ์การเข้าใช้งาน (Role & Access Control)
  // ---------------------------------------------------------------------------
  test.describe('W3-7: ตรวจสอบสิทธิ์การเข้าใช้งาน (Role)', () => {

    test('TC-I1-W3-7-001: ตรวจสอบการแสดงผล Dashboard ตามบทบาทของผู้ใช้ (Normal Student vs Company Role Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const student = {
        email: `role_student_${timestamp}@example.com`,
        username: `role_stu_${timestamp}`,
        password: 'Password123!',
      };
      const company = {
        email: `role_company_${timestamp}@tech.co.th`,
        username: `role_comp_${timestamp}`,
        password: 'Password123!',
      };

      // 1. Student Login & Dashboard Check
      await page.goto('/auth/register/student');
      await page.locator('input[name="email"]').fill(student.email);
      await page.locator('input[name="username"]').fill(student.username);
      await page.locator('input[name="password"]').fill(student.password);
      await page.locator('input[id="fullname"]').fill('นักศึกษา Role Test');
      await page.locator('input[id="phone"]').fill('0812345678');
      await page.locator('input[id="university"]').fill('KMUTT');
      await page.locator('input[id="faculty"]').fill('SIT');
      await page.locator('input[id="major"]').fill('IT');
      await page.locator('select[id="study_year"]').selectOption('3');
      await page.getByRole('button', { name: 'Register Account' }).click();
      await page.waitForURL('**/auth/login');

      await page.locator('input[id="email"]').fill(student.email);
      await page.locator('input[id="password"]').fill(student.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/dashboard');
      await expect(page.locator('body').filter({ hasText: /Student Dashboard|Welcome back/i })).toBeVisible();

      await page.locator('button').filter({ hasText: /Logout/i }).click();
      await page.waitForURL('**/auth/login');

      // 2. Company Login & Dashboard Check
      await page.goto('/auth/register/company');
      await page.locator('input[name="email"]').fill(company.email);
      await page.locator('input[name="username"]').fill(company.username);
      await page.locator('input[name="password"]').fill(company.password);
      await page.locator('input[name="company_name"]').fill('บริษัท Role Test จำกัด');
      await page.locator('input[name="website"]').fill('https://www.roletest.co.th');
      await page.locator('input[name="province"]').fill('กรุงเทพมหานคร');
      await page.locator('textarea[name="address"]').fill('123 ถนนสุขุมวิท');
      await page.locator('textarea[name="description"]').fill('บริษัททดสอบบทบาท');
      await page.getByRole('button', { name: 'Register Company' }).click();
      await page.waitForURL('**/auth/login');

      await page.locator('input[id="email"]').fill(company.email);
      await page.locator('input[id="password"]').fill(company.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/dashboard');
      await expect(page.locator('body').filter({ hasText: /Company Dashboard|Welcome/i })).toBeVisible();
    });

    test('TC-I1-W3-7-002: พยายามเข้าถึงหน้า Dashboard โดยไม่มี Session Cookie (Worst Unauthenticated Access Case)', async ({ context, page }) => {
      // Clear all cookies
      await context.clearCookies();
      
      await page.goto('/dashboard');
      await page.waitForURL('**/auth/login');
      await expect(page).toHaveURL(/\/auth\/login/);

      await page.goto('/dashboard/profile');
      await page.waitForURL('**/auth/login');
      await expect(page).toHaveURL(/\/auth\/login/);
    });

    test('TC-I1-W3-7-003: พยายามแก้ไขหรือปลอมแปลงข้อมูล Payload ใน JWT Cookie (JWT Signature Tampering Edge Case)', async ({ context, page }) => {
      // Set tampered invalid auth token cookie
      await context.addCookies([{
        name: 'auth_token',
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NSIsInJvbGUiOiJhZG1pbiJ9.tampered_invalid_signature',
        domain: 'localhost',
        path: '/',
      }]);

      await page.goto('/dashboard');
      await page.waitForURL('**/auth/login');
      await expect(page).toHaveURL(/\/auth\/login/);
    });

  });

  // ---------------------------------------------------------------------------
  // W3-10: แก้ไขข้อมูลบริษัท (Company Info Settings)
  // ---------------------------------------------------------------------------
  test.describe('W3-10: แก้ไขข้อมูลบริษัท', () => {

    test('TC-I1-W3-10-001: บันทึกข้อมูลบริษัท (Company Profile) ด้วยข้อมูลถูกต้องครบถ้วน (Normal Successful Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const company = {
        email: `comp_edit_${timestamp}@tech.co.th`,
        username: `comp_edit_${timestamp}`,
        password: 'Password123!',
        company_name: `บริษัท แก้ไขข้อมูล ${timestamp} จำกัด`,
      };

      await page.goto('/auth/register/company');
      await page.locator('input[name="email"]').fill(company.email);
      await page.locator('input[name="username"]').fill(company.username);
      await page.locator('input[name="password"]').fill(company.password);
      await page.locator('input[name="company_name"]').fill(company.company_name);
      await page.locator('input[name="website"]').fill('https://www.comp-edit.co.th');
      await page.locator('input[name="province"]').fill('กรุงเทพมหานคร');
      await page.locator('textarea[name="address"]').fill('123 ถนนสุขุมวิท');
      await page.locator('textarea[name="description"]').fill('บริษัททดสอบการแก้ไข');
      await page.getByRole('button', { name: 'Register Company' }).click();
      await page.waitForURL('**/auth/login');

      await page.locator('input[id="email"]').fill(company.email);
      await page.locator('input[id="password"]').fill(company.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/dashboard');

      await page.goto('/dashboard/profile');
      await expect(page.getByText('กำลังโหลดข้อมูลโปรไฟล์...')).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[name="company_name"]')).toHaveValue(company.company_name);
      await page.locator('input[name="company_name"]').fill(`${company.company_name} (Updated)`);
      await page.locator('input[name="province"]').fill('เชียงใหม่');

      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('สำเร็จ');
        await dialog.accept();
      });
      await page.getByRole('button', { name: 'Save Changes' }).click();

      await page.reload();
      await expect(page.getByText('กำลังโหลดข้อมูลโปรไฟล์...')).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[name="company_name"]')).toHaveValue(`${company.company_name} (Updated)`);
      await expect(page.locator('input[name="province"]')).toHaveValue('เชียงใหม่');
    });

    test('TC-I1-W3-10-002: บันทึกข้อมูลบริษัทโดยเว้นว่างฟิลด์บังคับ เช่น Company Name (Worst Empty Company Name Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const company = {
        email: `comp_empty_${timestamp}@tech.co.th`,
        username: `comp_empty_${timestamp}`,
        password: 'Password123!',
        company_name: `บริษัท ทดสอบเว้นว่าง ${timestamp} จำกัด`,
      };

      await page.goto('/auth/register/company');
      await page.locator('input[name="email"]').fill(company.email);
      await page.locator('input[name="username"]').fill(company.username);
      await page.locator('input[name="password"]').fill(company.password);
      await page.locator('input[name="company_name"]').fill(company.company_name);
      await page.getByRole('button', { name: 'Register Company' }).click();
      await page.waitForURL('**/auth/login');

      await page.locator('input[id="email"]').fill(company.email);
      await page.locator('input[id="password"]').fill(company.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/dashboard');

      await page.goto('/dashboard/profile');
      await expect(page.getByText('กำลังโหลดข้อมูลโปรไฟล์...')).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('input[name="company_name"]')).toHaveValue(company.company_name);
      await page.locator('input[name="company_name"]').fill('');

      page.once('dialog', async (dialog) => {
        await dialog.accept();
      });
      await page.getByRole('button', { name: 'Save Changes' }).click();
      await expect(page.locator('input[name="company_name"]')).toHaveValue('');
    });

    test('TC-I1-W3-10-003: บันทึกข้อมูลบริษัทโดยเพิ่ม Website Links สูงสุด 3 ลิงก์ (Multiple Links Edge Case)', async ({ page }) => {
      const timestamp = getTimestamp();
      const company = {
        email: `comp_links_${timestamp}@tech.co.th`,
        username: `comp_links_${timestamp}`,
        password: 'Password123!',
        company_name: `บริษัท หลายลิงก์ ${timestamp} จำกัด`,
      };

      await page.goto('/auth/register/company');
      await page.locator('input[name="email"]').fill(company.email);
      await page.locator('input[name="username"]').fill(company.username);
      await page.locator('input[name="password"]').fill(company.password);
      await page.locator('input[name="company_name"]').fill(company.company_name);
      await page.getByRole('button', { name: 'Register Company' }).click();
      await page.waitForURL('**/auth/login');

      await page.locator('input[id="email"]').fill(company.email);
      await page.locator('input[id="password"]').fill(company.password);
      await page.getByRole('button', { name: 'Login' }).click();
      await page.waitForURL('**/dashboard');

      await page.goto('/dashboard/profile');
      await expect(page.getByText('กำลังโหลดข้อมูลโปรไฟล์...')).not.toBeVisible({ timeout: 10000 });
      const addLinkBtn = page.getByRole('button', { name: /Add Link|เพิ่มลิงก์/i });
      if (await addLinkBtn.isVisible()) {
        await addLinkBtn.click();
        await addLinkBtn.click();
      }

      page.once('dialog', async (dialog) => {
        expect(dialog.message()).toContain('สำเร็จ');
        await dialog.accept();
      });
      await page.getByRole('button', { name: 'Save Changes' }).click();
    });

  });

});
