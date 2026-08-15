"use server";

import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "../supabase/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface DecodedToken {
  userId: string;
  email: string;
  username: string;
  fullname?: string;
}

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
  resume_path?: string;

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
          email: formData.email.trim().toLowerCase(),
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
          resume_path: formData.resume_path || null,
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

export async function getStudentProfile() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as unknown as DecodedToken;
    
    const supabase = getSupabaseAdmin();
    const { data: student, error } = await supabase
      .from("students")
      .select("*, users (email)")
      .eq("user_id", decoded.userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching student profile:", error);
      return { success: false, error: error.message };
    }
    
    if (!student) {
      return { success: false, error: "Student profile not found" };
    }
    
    if (student && student.resume_path) {
      try {
        const { data: signData, error: signError } = await supabase.storage
          .from("resumes")
          .createSignedUrl(student.resume_path, 60 * 60);
        if (!signError && signData) {
          student.resume_url = signData.signedUrl;
        }
      } catch (err) {
        console.error("Error creating signed URL for resume:", err);
      }
    }
    
    return { success: true, profile: student };
  } catch (err) {
    console.error("Error in getStudentProfile:", err);
    return { success: false, error: "Failed to get profile" };
  }
}

export async function updateStudentProfile(profileData: {
  fullname: string;
  phone: string | null;
  university: string | null;
  faculty: string | null;
  major: string | null;
  study_year: number | null;
  profile_image: string | null;
  resume_path: string | null;
}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as unknown as DecodedToken;
    
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("students")
      .update({
        fullname: profileData.fullname,
        phone: profileData.phone,
        university: profileData.university,
        faculty: profileData.faculty,
        major: profileData.major,
        study_year: profileData.study_year,
        profile_image: profileData.profile_image,
        resume_path: profileData.resume_path,
      })
      .eq("user_id", decoded.userId);
      
    if (error) {
      console.error("Error updating student profile:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, message: "อัปเดตข้อมูลโปรไฟล์สำเร็จเรียบร้อย! 🎉" };
  } catch (err) {
    console.error("Error in updateStudentProfile:", err);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function getCompanyProfile() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as unknown as DecodedToken;
    
    const supabase = getSupabaseAdmin();
    const { data: company, error } = await supabase
      .from("companies")
      .select("*, users (email)")
      .eq("user_id", decoded.userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching company profile:", error);
      return { success: false, error: error.message };
    }
    
    if (!company) {
      return { success: false, error: "Company profile not found" };
    }
    
    return { success: true, profile: company };
  } catch (err) {
    console.error("Error in getCompanyProfile:", err);
    return { success: false, error: "Failed to get profile" };
  }
}

export async function updateCompanyProfile(profileData: {
  company_name: string;
  description: string | null;
  website: string | null;
  address: string | null;
  province: string | null;
  logo: string | null;
}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }
    
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as unknown as DecodedToken;
    
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("companies")
      .update({
        company_name: profileData.company_name,
        description: profileData.description,
        website: profileData.website,
        address: profileData.address,
        province: profileData.province,
        logo: profileData.logo,
      })
      .eq("user_id", decoded.userId);
      
    if (error) {
      console.error("Error updating company profile:", error);
      return { success: false, error: error.message };
    }
    
    return { success: true, message: "อัปเดตข้อมูลบริษัทสำเร็จเรียบร้อย! 🎉" };
  } catch (err) {
    console.error("Error in updateCompanyProfile:", err);
    return { success: false, error: "Failed to update profile" };
  }
}

export async function uploadProfileImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No file provided" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const supabase = getSupabaseAdmin();

    // Ensure the bucket 'avatars' exists (or ignore error if it already does)
    try {
      await supabase.storage.createBucket("avatars", {
        public: true,
      });
    } catch {
      // Ignore if bucket already exists
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, buffer, {
        contentType: file.type,
        duplex: "half",
      });

    if (error) {
      console.error("Storage upload error:", error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (err) {
    console.error("Error in uploadProfileImage server action:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Failed to upload image" 
    };
  }
}

export async function uploadResume(formData: FormData) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    try {
      jwt.verify(
        token,
        process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
      );
    } catch (err) {
      console.error("JWT verification failed:", err);
      return { success: false, error: "Invalid token" };
    }

    // 2. Validate file existence and type
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return { success: false, error: "No file or invalid file provided" };
    }

    // 3. Limit file size (10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { success: false, error: "File size exceeds 10MB limit" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const supabase = getSupabaseAdmin();

    // Ensure the bucket 'resumes' exists (public access)
    try {
      await supabase.storage.createBucket("resumes", {
        public: true,
      });
    } catch {
      // Ignore if bucket already exists
    }

    const parts = file.name.split(".");
    const fileExt = parts.length > 1 ? parts.pop() : "bin";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `student-resumes/${fileName}`;

    const { error } = await supabase.storage
      .from("resumes")
      .upload(filePath, buffer, {
        contentType: file.type,
        duplex: "half",
      });

    if (error) {
      console.error("Storage upload error:", error);
      return { success: false, error: "Failed to upload file to storage" };
    }

    // Get signed URL (valid for 1 hour)
    const { data: signData, error: signError } = await supabase.storage
      .from("resumes")
      .createSignedUrl(filePath, 60 * 60);

    if (signError) {
      console.error("Storage sign URL error:", signError);
      return { success: false, error: "Failed to generate signed URL" };
    }

    return { success: true, path: filePath, url: signData.signedUrl };
  } catch (err) {
    console.error("Error in uploadResume server action:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Failed to upload resume" 
    };
  }
}

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
