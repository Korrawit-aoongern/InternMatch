"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "../supabase/server";

interface DecodedToken {
  userId: string;
  email: string;
  username: string;
  fullname?: string;
  role?: string;
}

// Helper to authenticate user and get their student ID
async function getCurrentStudentId(supabase: SupabaseClient): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized: No token found");
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
  ) as unknown as DecodedToken;

  const { data: student, error } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", decoded.userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching student profile:", error);
    throw new Error(`Failed to retrieve student profile: ${error.message}`);
  }

  if (!student) {
    throw new Error("Student profile not found. Are you logged in as a candidate?");
  }

  return student.id;
}

// Fetch all portfolios currently saved by the authenticated student
export async function getStudentPortfolios() {
  try {
    const supabase = getSupabaseAdmin();
    const studentId = await getCurrentStudentId(supabase);

    const { data, error } = await supabase
      .from("portfolios")
      .select("id, title, description, url")
      .eq("student_id", studentId);

    if (error) {
      console.error("Error fetching student portfolios:", error);
      return { success: false, error: error.message };
    }

    return { success: true, portfolios: data || [] };
  } catch (err: unknown) {
    console.error("Exception in getStudentPortfolios:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Failed to fetch student portfolios" 
    };
  }
}

// Update the student's portfolios: deletes old portfolios and inserts the new ones
export async function updateStudentPortfolios(selectedPortfolios: { title: string; url: string | null }[]) {
  try {
    const supabase = getSupabaseAdmin();
    const studentId = await getCurrentStudentId(supabase);

    // 1. Delete all existing portfolios for this student
    const { error: deleteError } = await supabase
      .from("portfolios")
      .delete()
      .eq("student_id", studentId);

    if (deleteError) {
      console.error("Error deleting old student portfolios:", deleteError);
      return { success: false, error: `Failed to reset portfolios: ${deleteError.message}` };
    }

    // Filter out portfolios with empty urls
    const validPortfolios = selectedPortfolios.filter(p => p.url && p.url.trim() !== "");

    // 2. If no portfolios are provided, we are done
    if (validPortfolios.length === 0) {
      return { success: true, message: "อัปเดตลิงก์ภายนอกเรียบร้อย (ไม่มีลิงก์)" };
    }

    // 3. Insert new portfolios
    const insertData = validPortfolios.map(p => ({
      student_id: studentId,
      title: p.title,
      url: p.url?.trim(),
      description: null,
    }));

    const { data, error: insertError } = await supabase
      .from("portfolios")
      .insert(insertData)
      .select();

    if (insertError) {
      console.error("Error inserting new student portfolios:", insertError);
      return { success: false, error: `Failed to insert portfolios: ${insertError.message}` };
    }

    return { success: true, message: "อัปเดตลิงก์ภายนอกสำเร็จเรียบร้อย! 🎉", count: data?.length || 0 };
  } catch (err: unknown) {
    console.error("Exception in updateStudentPortfolios:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Failed to update student portfolios" 
    };
  }
}
