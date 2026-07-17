"use server";

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export async function registerStudentAction(formData) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "❌ [Configuration Error]: Missing Supabase URL or Service Role Key",
    );
    return { success: false, error: "ระบบหลังบ้านยังไม่ได้เชื่อมต่อคีย์ลับ" };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. แฮชรหัสผ่านเพื่อความปลอดภัย
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(formData.password, salt);

    // 2. บันทึกข้อมูลลงตาราง users (เพิ่มฟิลด์ username และ role เข้าไป)
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert([
        {
          email: formData.email,
          username: formData.username,
          password: hashedPassword,
          role: "student", // 🌟 เพิ่มบรรทัดนี้เพื่อกำหนดสิทธิ์การใช้งานเป็นนักศึกษาให้ผ่านกฎ Not-Null
        },
      ])
      .select()
      .single();

    if (userError) {
      console.error("❌ Users Table Error:", userError.message);
      return {
        success: false,
        error: `ผิดพลาดฝั่งบัญชี: ${userError.message}`,
      };
    }

    const userId = newUser.id;

    // 3. บันทึกข้อมูลลงตาราง students ให้ครบถ้วนทุกฟิลด์รวมถึงรูปภาพและเรซูเม่
    const { error: studentError } = await supabase.from("students").insert([
      {
        user_id: userId,
        fullname: formData.fullname,
        phone: formData.phone || null,
        university: formData.university || null,
        faculty: formData.faculty || null,
        major: formData.major || null,
        study_year: formData.study_year ? parseInt(formData.study_year) : null,
        profile_image: formData.profile_image || null, // 🌟 บันทึกลงฐานข้อมูล
        resume_url: formData.resume_url || null, // 🌟 บันทึกลงฐานข้อมูล
      },
    ]);

    if (studentError) {
      console.error("❌ Student Table Insert Error:", studentError.message);
      // Rollback: ลบ user ทิ้งถ้าบันทึกตารางนักศึกษาไม่ผ่าน ข้อมูลจะได้ไม่ค้าง
      await supabase.from("users").delete().eq("id", userId);
      return {
        success: false,
        error: `ผิดพลาดฝั่งโปรไฟล์นักศึกษา: ${studentError.message}`,
      };
    }

    return {
      success: true,
      message: "สมัครสมาชิกและบันทึกข้อมูลนักศึกษาสำเร็จเรียบร้อย! 🎉",
    };
  } catch (err) {
    console.error("❌ Critical Register Exception:", err);
    return { success: false, error: "เกิดข้อผิดพลาดรุนแรงภายในระบบหลังบ้าน" };
  }
}
