"use server";

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export interface CompanyFormData {
  email: string;
  username: string;
  password: string;
  company_name: string;
  description?: string;
  website?: string;
  address?: string;
  province?: string;
  logo?: string;
}

export async function registerCompanyAction(formData: CompanyFormData) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ [Configuration Error]: Missing Supabase URL or Service Role Key");
    return { success: false, error: "ระบบหลังบ้านยังไม่ได้เชื่อมต่อคีย์ลับ" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. แฮชรหัสผ่านเพื่อความปลอดภัย
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(formData.password, salt);

    // 2. บันทึกข้อมูลลงตาราง users (ระบุบทบาทเป็น company)
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          email: formData.email,
          username: formData.username,
          password: hashedPassword,
          role: "company", // 🌟 กำหนดสิทธิ์เป็นบริษัทเพื่อให้ผ่านกฎ Not-Null ของฐานข้อมูล
        },
      ])
      .select()
      .single();

    if (userError) {
      console.error("❌ Users Table Error:", userError.message);
      return { success: false, error: `ผิดพลาดฝั่งบัญชี: ${userError.message}` };
    }

    const userId = newUser.id;

    // 3. บันทึกข้อมูลลงตาราง companies ตาม Schema SQL เป๊ะๆ
    const { error: companyError } = await supabase
      .from("companies")
      .insert([
        {
          user_id: userId,
          company_name: formData.company_name,
          description: formData.description || null,
          website: formData.website || null,
          address: formData.address || null,
          province: formData.province || null,
          logo: formData.logo || null,
          // created_at ปล่อยให้ฐานข้อมูลแสตมป์ default now() เองอัตโนมัติ
        },
      ]);

    if (companyError) {
      console.error("❌ Companies Table Insert Error:", companyError.message);
      // Rollback: ลบ user ทิ้งถ้าบันทึกตารางบริษัทไม่สำเร็จ
      await supabase.from("users").delete().eq("id", userId);
      return { success: false, error: `ผิดพลาดฝั่งข้อมูลบริษัท: ${companyError.message}` };
    }

    return { success: true, message: "ลงทะเบียนบัญชีบริษัทสำเร็จเรียบร้อย! 🎉" };

  } catch (err) {
    console.error("❌ Critical Company Register Exception:", err);
    return { success: false, error: "เกิดข้อผิดพลาดรุนแรงภายในระบบหลังบ้าน" };
  }
}
