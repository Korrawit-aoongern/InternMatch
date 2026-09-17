# Profile Change Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement current password validation and password updating in the custom `users` database table in Supabase via a Server Action.

**Architecture:** Create a server action `changeUserPassword` that authenticates the user using their cookie JWT, retrieves the hashed password from the `users` table, verifies it with `bcrypt.compare`, and if correct, updates it to the new `bcrypt`-hashed password. The profile page form will call this action and handle feedback.

**Tech Stack:** Next.js Server Actions, Supabase client (`@supabase/supabase-js`), JWT verification, `bcryptjs`.

---

### Task 1: Create the Server Action

**Files:**
- Modify: `D:/internmatch/front/lib/actions/auth.ts`

- [ ] **Step 1: Add the changeUserPassword server action**

Add `changeUserPassword` to the end of `lib/actions/auth.ts`.
```typescript
export async function changeUserPassword(currentPassword: string, newPassword: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

    if (!token) {
      return { success: false, error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" };
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as unknown as DecodedToken;

    const supabase = getSupabaseAdmin();

    // 1. Fetch user's current password hash
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("password")
      .eq("id", decoded.userId)
      .single();

    if (fetchError || !user) {
      console.error("Fetch current password error:", fetchError);
      return { success: false, error: "ไม่พบข้อมูลผู้ใช้งานหรือเกิดข้อผิดพลาด" };
    }

    // 2. Compare current password with database hash
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return { success: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // 4. Update password in database
    const { error: updateError } = await supabase
      .from("users")
      .update({ password: newPasswordHash })
      .eq("id", decoded.userId);

    if (updateError) {
      console.error("Update password error:", updateError);
      return { success: false, error: `ไม่สามารถอัปเดตรหัสผ่านใหม่ได้: ${updateError.message}` };
    }

    return { success: true, message: "อัปเดตรหัสผ่านใหม่สำเร็จเรียบร้อย! 🎉" };
  } catch (err) {
    console.error("Error in changeUserPassword action:", err);
    return { success: false, error: "เกิดข้อผิดพลาดในการตรวจสอบหรืออัปเดตรหัสผ่าน" };
  }
}
```

- [ ] **Step 2: Commit changes**

```bash
git add D:/internmatch/front/lib/actions/auth.ts
git commit -m "feat: add changeUserPassword server action with current password verification"
```

---

### Task 2: Integrate Password Change on the Profile Page

**Files:**
- Modify: `D:/internmatch/front/app/dashboard/profile/page.tsx`

- [ ] **Step 1: Import the new server action**

Add `changeUserPassword` to imports from `@/lib/actions/auth` in `app/dashboard/profile/page.tsx` (around line 19):
```typescript
import { getStudentProfile, updateStudentProfile, getCompanyProfile, updateCompanyProfile, changeUserPassword } from "@/lib/actions/auth";
```

- [ ] **Step 2: Update handleUpdatePassword in app/dashboard/profile/page.tsx**

Replace `handleUpdatePassword` implementation (around line 163):
```typescript
  // ฟังก์ชันเปลี่ยนรหัสผ่าน
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPasswordMsg({ text: "กรุณากรอกข้อมูลให้ครบทุกช่อง", type: "error" });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setPasswordMsg({ text: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร", type: "error" });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMsg({ text: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน", type: "error" });
      return;
    }

    // Call the server action to verify current password and update new password
    const result = await changeUserPassword(passwords.currentPassword, passwords.newPassword);

    if (result.success) {
      setPasswordMsg({ text: result.message || "อัปเดตรหัสผ่านสำเร็จเรียบร้อย!", type: "success" });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPasswordMsg({ text: result.error || "เกิดข้อผิดพลาด", type: "error" });
    }
  };
```

- [ ] **Step 3: Commit changes**

```bash
git add D:/internmatch/front/app/dashboard/profile/page.tsx
git commit -m "feat: integrate changeUserPassword server action into ProfilePage"
```
