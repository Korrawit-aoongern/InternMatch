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

export interface InternshipInput {
  title: string;
  description: string;
  location: string;
  internship_type: string;
  status: "open" | "draft" | "closed";
}

async function getCurrentCompanyId(supabase: SupabaseClient): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Unauthorized: No token found");
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
  ) as unknown as DecodedToken;

  if (decoded.role !== "company") {
    throw new Error("Unauthorized: Only companies can access this resources");
  }

  const { data: company, error } = await supabase
    .from("companies")
    .select("id")
    .eq("user_id", decoded.userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching company profile:", error);
    throw new Error(`Failed to retrieve company profile: ${error.message}`);
  }

  if (!company) {
    throw new Error("Company profile not found. Are you logged in as a company?");
  }

  return company.id;
}

export async function getCompanyInternships() {
  try {
    const supabase = getSupabaseAdmin();
    const companyId = await getCurrentCompanyId(supabase);

    // Fetch internships along with application counts using select and reference count join
    const { data: internships, error } = await supabase
      .from("internships")
      .select(`
        *,
        applications (
          id
        )
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching company internships:", error);
      return { success: false, error: error.message };
    }

    const mappedInternships = (internships || []).map((item: any) => ({
      id: item.id,
      company_id: item.company_id,
      title: item.title,
      description: item.description,
      location: item.location,
      internship_type: item.internship_type,
      status: item.status as "open" | "draft" | "closed",
      created_at: item.created_at,
      applicant_count: item.applications ? item.applications.length : 0,
    }));

    return { success: true, internships: mappedInternships };
  } catch (err: unknown) {
    console.error("Exception in getCompanyInternships:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch internships",
    };
  }
}

export async function createInternship(input: InternshipInput) {
  try {
    const supabase = getSupabaseAdmin();
    const companyId = await getCurrentCompanyId(supabase);

    const { data, error } = await supabase
      .from("internships")
      .insert([
        {
          company_id: companyId,
          title: input.title.trim(),
          description: input.description.trim(),
          location: input.location.trim(),
          internship_type: input.internship_type,
          status: input.status,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating internship:", error);
      return { success: false, error: error.message };
    }

    return { success: true, internship: data, message: "สร้างประกาศรับสมัครงานสำเร็จเรียบร้อย! 🎉" };
  } catch (err: unknown) {
    console.error("Exception in createInternship:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create internship",
    };
  }
}

export async function updateInternship(id: string, input: Partial<InternshipInput>) {
  try {
    const supabase = getSupabaseAdmin();
    const companyId = await getCurrentCompanyId(supabase);

    // Verify ownership before updating
    const { data: existing, error: findError } = await supabase
      .from("internships")
      .select("id")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (findError || !existing) {
      return { success: false, error: "Internship posting not found or unauthorized access" };
    }

    const { data, error } = await supabase
      .from("internships")
      .update({
        title: input.title?.trim(),
        description: input.description?.trim(),
        location: input.location?.trim(),
        internship_type: input.internship_type,
        status: input.status,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating internship:", error);
      return { success: false, error: error.message };
    }

    return { success: true, internship: data, message: "อัปเดตรายละเอียดประกาศสำเร็จเรียบร้อย! 🎉" };
  } catch (err: unknown) {
    console.error("Exception in updateInternship:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update internship",
    };
  }
}

export async function getInternshipApplicants(internshipId: string) {
  try {
    const supabase = getSupabaseAdmin();
    const companyId = await getCurrentCompanyId(supabase);

    // Verify ownership
    const { data: existing, error: findError } = await supabase
      .from("internships")
      .select("id")
      .eq("id", internshipId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (findError || !existing) {
      return { success: false, error: "Internship posting not found or unauthorized access" };
    }

    // Fetch applications with joined students and user emails
    const { data, error } = await supabase
      .from("applications")
      .select(`
        id,
        match_score,
        status,
        applied_at,
        student_id,
        students (
          fullname,
          university,
          faculty,
          major,
          study_year,
          profile_image,
          resume_path,
          users (
            email
          )
        )
      `)
      .eq("internship_id", internshipId)
      .order("match_score", { ascending: false });

    if (error) {
      console.error("Error fetching applicants:", error);
      return { success: false, error: error.message };
    }

    const applicants = (data || []).map((item: any) => {
      const student = item.students;
      const user = student?.users;
      const email = Array.isArray(user) ? user[0]?.email : user?.email;
      
      return {
        application_id: item.id,
        student_id: item.student_id,
        fullname: student?.fullname || "Unknown Student",
        university: student?.university || "",
        faculty: student?.faculty || "",
        major: student?.major || "",
        study_year: student?.study_year || 1,
        profile_image: student?.profile_image || "",
        resume_path: student?.resume_path || "",
        resume_url: "",
        email: email || "",
        match_score: item.match_score ? Number(item.match_score) : 0,
        status: item.status,
        applied_at: item.applied_at,
      };
    });

    // Generate signed URLs for resumes if they exist
    for (const applicant of applicants) {
      if (applicant.resume_path) {
        try {
          const { data: signData, error: signError } = await supabase.storage
            .from("resumes")
            .createSignedUrl(applicant.resume_path, 60 * 60);
          if (!signError && signData) {
            applicant.resume_url = signData.signedUrl;
          }
        } catch (err) {
          console.error("Error signing resume URL:", err);
        }
      }
    }

    return { success: true, applicants };
  } catch (err: unknown) {
    console.error("Exception in getInternshipApplicants:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch applicants list",
    };
  }
}
