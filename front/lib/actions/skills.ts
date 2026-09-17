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

interface StudentSkillQueryResult {
  id: number;
  level: string;
  skill_id: number;
  skills: {
    name: string;
    category: string;
  } | null;
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

// Fetch all available master skills from public.skills table
export async function getMasterSkills() {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("skills")
      .select("id, name, category")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching master skills:", error);
      return { success: false, error: error.message };
    }

    return { success: true, skills: data || [] };
  } catch (err: unknown) {
    console.error("Exception in getMasterSkills:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Failed to fetch master skills list" 
    };
  }
}

// Fetch skills currently selected by the authenticated student
export async function getStudentSkills() {
  try {
    const supabase = getSupabaseAdmin();
    const studentId = await getCurrentStudentId(supabase);

    const { data, error } = await supabase
      .from("student_skills")
      .select(`
        id,
        level,
        skill_id,
        skills (
          name,
          category
        )
      `)
      .eq("student_id", studentId);

    if (error) {
      console.error("Error fetching student skills:", error);
      return { success: false, error: error.message };
    }

    // Map nested join results to flat object format with explicit type casting
    const queryResults = (data || []) as unknown as StudentSkillQueryResult[];
    const mappedSkills = queryResults.map((item) => ({
      id: item.id.toString(),
      skill_id: Number(item.skill_id),
      name: item.skills?.name || "Unknown",
      category: item.skills?.category || "Unknown",
      level: item.level as "Advanced" | "Intermediate" | "Beginner"
    }));

    return { success: true, skills: mappedSkills };
  } catch (err: unknown) {
    console.error("Exception in getStudentSkills:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Failed to fetch student skills" 
    };
  }
}

// Update the student's skills: deletes old list and inserts the new list
export async function updateStudentSkills(selectedSkills: { skill_id: number; level: string }[]) {
  try {
    if (selectedSkills.length > 20) {
      return { success: false, error: "เลือกทักษะได้สูงสุด 20 ทักษะเท่านั้น (Hard limit)" };
    }
    const supabase = getSupabaseAdmin();
    const studentId = await getCurrentStudentId(supabase);

    // 1. Delete all existing skills for this student
    const { error: deleteError } = await supabase
      .from("student_skills")
      .delete()
      .eq("student_id", studentId);

    if (deleteError) {
      console.error("Error deleting old student skills:", deleteError);
      return { success: false, error: `Failed to reset skills: ${deleteError.message}` };
    }

    // 2. If no new skills are selected, we are done
    if (selectedSkills.length === 0) {
      return { success: true, message: "อัปเดตทักษะเสร็จสิ้น (ไม่มีทักษะที่เลือก)" };
    }

    // 3. Insert new skills
    const insertData = selectedSkills.map(s => {
      let dbLevel = s.level;
      if (dbLevel.toLowerCase() === "beginner") dbLevel = "Beginner";
      else if (dbLevel.toLowerCase() === "intermediate") dbLevel = "Intermediate";
      else if (dbLevel.toLowerCase() === "advanced") dbLevel = "Advanced";
      
      return {
        student_id: studentId,
        skill_id: s.skill_id,
        level: dbLevel
      };
    });

    const { data, error: insertError } = await supabase
      .from("student_skills")
      .insert(insertData)
      .select();

    if (insertError) {
      console.error("Error inserting new student skills:", insertError);
      return { success: false, error: `Failed to insert skills: ${insertError.message}` };
    }

    return { success: true, message: "อัปเดตทักษะและความสามารถสำเร็จเรียบร้อย! 🎉", count: data?.length || 0 };
  } catch (err: unknown) {
    console.error("Exception in updateStudentSkills:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Failed to update student skills" 
    };
  }
}
