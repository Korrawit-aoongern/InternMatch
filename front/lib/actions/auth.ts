"use server";

import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../supabase/server";

export interface UserRegisterFormData {
  email: string;
  username: string;
  password: string;
  
  // Student-specific
  fullname?: string;
  phone?: string;
  university?: string;
  faculty?: string;
  major?: string;
  study_year?: string | number;
  profile_image?: string;
  resume_url?: string;

  // Company-specific
  company_name?: string;
  description?: string;
  website?: string;
  address?: string;
  province?: string;
  logo?: string;
}

export async function checkUserExists(identity: string) {
  if (!identity) return { exists: false };

  const cleanIdentity = identity.trim().toLowerCase();
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .or(`email.eq.${cleanIdentity},username.eq.${cleanIdentity}`)
    .maybeSingle();

  if (error) {
    console.error("Database query error:", error.message);
    return { exists: false, error: true };
  }

  return { exists: !!data };
}

export async function registerUser(formData: UserRegisterFormData, role: "student" | "company") {
  const supabase = getSupabaseAdmin();

  try {
    // 1. แฮชรหัสผ่านเพื่อความปลอดภัย
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(formData.password, salt);

    // 2. บันทึกข้อมูลลงตาราง users
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          email: formData.email,
          username: formData.username,
          password: hashedPassword,
          role: role,
        },
      ])
      .select()
      .single();

    if (userError) {
      console.error("❌ Users Table Error:", userError.message);
      return { success: false, error: `ผิดพลาดฝั่งบัญชี: ${userError.message}` };
    }

    const userId = newUser.id;

    if (role === "student") {
      // 3. บันทึกข้อมูลลงตาราง students
      const { error: studentError } = await supabase.from("students").insert([
        {
          user_id: userId,
          fullname: formData.fullname || "",
          phone: formData.phone || null,
          university: formData.university || null,
          faculty: formData.faculty || null,
          major: formData.major || null,
          study_year: formData.study_year ? parseInt(formData.study_year.toString()) : null,
          profile_image: formData.profile_image || null,
          resume_url: formData.resume_url || null,
        },
      ]);

      if (studentError) {
        console.error("❌ Student Table Insert Error:", studentError.message);
        // Rollback: ลบ user ทิ้งถ้าบันทึกตารางนักศึกษาไม่ผ่าน
        await supabase.from("users").delete().eq("id", userId);
        return {
          success: false,
          error: `ผิดพลาดฝั่งโปรไฟล์นักศึกษา: ${studentError.message}`,
        };
      }
    } else if (role === "company") {
      // 3. บันทึกข้อมูลลงตาราง companies
      const { error: companyError } = await supabase
        .from("companies")
        .insert([
          {
            user_id: userId,
            company_name: formData.company_name || "",
            description: formData.description || null,
            website: formData.website || null,
            address: formData.address || null,
            province: formData.province || null,
            logo: formData.logo || null,
          },
        ]);

      if (companyError) {
        console.error("❌ Companies Table Insert Error:", companyError.message);
        // Rollback: ลบ user ทิ้งถ้าบันทึกตารางบริษัทไม่สำเร็จ
        await supabase.from("users").delete().eq("id", userId);
        return { success: false, error: `ผิดพลาดฝั่งข้อมูลบริษัท: ${companyError.message}` };
      }
    }

    return { 
      success: true, 
      message: role === "student" 
        ? "สมัครสมาชิกและบันทึกข้อมูลนักศึกษาสำเร็จเรียบร้อย! 🎉" 
        : "ลงทะเบียนบัญชีบริษัทสำเร็จเรียบร้อย! 🎉" 
    };

  } catch (err) {
    console.error(`❌ Critical ${role} Register Exception:`, err);
    return { success: false, error: "เกิดข้อผิดพลาดรุนแรงภายในระบบหลังบ้าน" };
  }
}
