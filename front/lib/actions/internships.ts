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

export interface InternshipSkill {
  id: string;
  skill_id: number;
  name: string;
  category: string;
  level: string;
}

export interface InternshipSkillInput {
  skill_id: number;
  level: string;
}

export interface InternshipInput {
  title: string;
  department: string;
  description: string;
  responsibilities: string;
  location: string;
  internship_type: string;
  status: "open" | "closed";
  skills?: InternshipSkillInput[];
}

import { calculateMatchScoreHelper } from "../utils/match";
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

    const { data: internships, error } = await supabase
      .from("internships")
      .select(`
        *,
        applications (
          id
        ),
        internship_skills (
          id,
          skill_id,
          level,
          skills (
            id,
            name,
            category
          )
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
      department: item.department || "",
      description: item.description,
      responsibilities: item.responsibilities || "",
      location: item.location,
      internship_type: item.internship_type,
      status: item.status as "open" | "closed",
      created_at: item.created_at,
      applicant_count: item.applications ? item.applications.length : 0,
      skills: (item.internship_skills || []).map((is: any) => ({
        id: is.id.toString(),
        skill_id: Number(is.skill_id),
        name: is.skills?.name || "Unknown",
        category: is.skills?.category || "Unknown",
        level: is.level || "Intermediate"
      }))
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
          department: input.department.trim(),
          description: input.description.trim(),
          responsibilities: input.responsibilities.trim(),
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

    // Insert associated skills if provided
    if (input.skills && input.skills.length > 0) {
      const skillInserts = input.skills.map(s => ({
        internship_id: data.id,
        skill_id: s.skill_id,
        level: s.level
      }));
      const { error: skillError } = await supabase
        .from("internship_skills")
        .insert(skillInserts);

      if (skillError) {
        console.error("Error inserting internship skills:", skillError);
      }
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

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title.trim();
    if (input.department !== undefined) updateData.department = input.department.trim();
    if (input.description !== undefined) updateData.description = input.description.trim();
    if (input.responsibilities !== undefined) updateData.responsibilities = input.responsibilities.trim();
    if (input.location !== undefined) updateData.location = input.location.trim();
    if (input.internship_type !== undefined) updateData.internship_type = input.internship_type;
    if (input.status !== undefined) updateData.status = input.status;

    const { data, error } = await supabase
      .from("internships")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating internship:", error);
      return { success: false, error: error.message };
    }

    // Update associated skills if provided
    if (input.skills !== undefined) {
      // 1. Delete existing skills
      const { error: deleteError } = await supabase
        .from("internship_skills")
        .delete()
        .eq("internship_id", id);

      if (deleteError) {
        console.error("Error deleting old internship skills:", deleteError);
      }

      // 2. Insert new skills
      if (input.skills.length > 0) {
        const skillInserts = input.skills.map(s => ({
          internship_id: id,
          skill_id: s.skill_id,
          level: s.level
        }));
        const { error: skillError } = await supabase
          .from("internship_skills")
          .insert(skillInserts);

        if (skillError) {
          console.error("Error inserting updated internship skills:", skillError);
        }
      }
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

export async function deleteInternship(id: string) {
  try {
    const supabase = getSupabaseAdmin();
    const companyId = await getCurrentCompanyId(supabase);

    // Verify ownership before deleting
    const { data: existing, error: findError } = await supabase
      .from("internships")
      .select("id")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (findError || !existing) {
      return { success: false, error: "Internship posting not found or unauthorized access" };
    }

    const { error } = await supabase
      .from("internships")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting internship:", error);
      return { success: false, error: error.message };
    }

    return { success: true, message: "ลบประกาศรับสมัครงานสำเร็จเรียบร้อย! 🎉" };
  } catch (err: unknown) {
    console.error("Exception in deleteInternship:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete internship",
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

    // Fetch internship required skills
    const { data: internshipSkills, error: skillsError } = await supabase
      .from("internship_skills")
      .select("skill_id, level")
      .eq("internship_id", internshipId);

    if (skillsError) {
      console.error("Error fetching internship skills in getInternshipApplicants:", skillsError);
      return { success: false, error: "Failed to load internship requirements" };
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
          phone,
          university,
          faculty,
          major,
          study_year,
          profile_image,
          resume_path,
          student_skills (
            skill_id,
            level,
            skills (
              name,
              category
            )
          ),
          portfolios (
            id,
            title,
            url
          ),
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
      
      const recalculatedScore = calculateMatchScoreHelper(
        student?.student_skills || [],
        internshipSkills || []
      );

      const mappedSkills = (student?.student_skills || []).map((ss: any) => ({
        skill_id: Number(ss.skill_id),
        name: ss.skills?.name || "Unknown",
        category: ss.skills?.category || "Unknown",
        level: ss.level || "Intermediate"
      }));

      const mappedPortfolios = (student?.portfolios || []).map((p: any) => ({
        id: p.id ? p.id.toString() : "",
        title: p.title || "Portfolio",
        url: p.url || ""
      })).filter((p: any) => p.url !== "");
      
      return {
        application_id: item.id,
        student_id: item.student_id,
        fullname: student?.fullname || "Unknown Student",
        phone: student?.phone || "",
        university: student?.university || "",
        faculty: student?.faculty || "",
        major: student?.major || "",
        study_year: student?.study_year || 1,
        profile_image: student?.profile_image || "",
        resume_path: student?.resume_path || "",
        resume_url: "",
        email: email || "",
        match_score: recalculatedScore,
        status: item.status,
        applied_at: item.applied_at,
        skills: mappedSkills,
        portfolios: mappedPortfolios,
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

export async function getCompanyApplications() {
  try {
    const supabase = getSupabaseAdmin();
    const companyId = await getCurrentCompanyId(supabase);

    const { data, error } = await supabase
      .from("applications")
      .select(`
        id,
        match_score,
        status,
        applied_at,
        student_id,
        internship_id,
        internships!inner (
          title,
          company_id,
          internship_skills ( skill_id, level )
        ),
        students (
          fullname,
          phone,
          university,
          faculty,
          major,
          study_year,
          profile_image,
          resume_path,
          student_skills (
            skill_id,
            level,
            skills (
              name,
              category
            )
          ),
          portfolios (
            id,
            title,
            url
          ),
          users ( email )
        )
      `)
      .eq("internships.company_id", companyId)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("Error fetching company applications:", error);
      return { success: false, error: error.message };
    }

    const applicants = (data || []).map((item: any) => {
      const student = item.students;
      const user = student?.users;
      const email = Array.isArray(user) ? user[0]?.email : user?.email;
      const recalculatedScore = calculateMatchScoreHelper(
        student?.student_skills || [],
        item.internships?.internship_skills || []
      );
      const mappedSkills = (student?.student_skills || []).map((ss: any) => ({
        skill_id: Number(ss.skill_id),
        name: ss.skills?.name || "Unknown",
        category: ss.skills?.category || "Unknown",
        level: ss.level || "Intermediate"
      }));
      const mappedPortfolios = (student?.portfolios || []).map((p: any) => ({
        id: p.id ? p.id.toString() : "",
        title: p.title || "Portfolio",
        url: p.url || ""
      })).filter((p: any) => p.url !== "");

      return {
        application_id: item.id,
        student_id: item.student_id,
        internship_id: item.internship_id,
        internship_title: item.internships?.title || "Unknown Position",
        fullname: student?.fullname || "Unknown Student",
        phone: student?.phone || "",
        university: student?.university || "",
        faculty: student?.faculty || "",
        major: student?.major || "",
        study_year: student?.study_year || 1,
        profile_image: student?.profile_image || "",
        resume_path: student?.resume_path || "",
        resume_url: "",
        email: email || "",
        match_score: recalculatedScore,
        status: item.status,
        applied_at: item.applied_at,
        skills: mappedSkills,
        portfolios: mappedPortfolios,
      };
    });

    // Generate signed resume URLs
    for (const applicant of applicants) {
      if (applicant.resume_path) {
        try {
          const { data: signData, error: signError } = await supabase.storage
            .from("resumes")
            .createSignedUrl(applicant.resume_path, 60 * 60);
          if (!signError && signData) applicant.resume_url = signData.signedUrl;
        } catch (err) {
          console.error("Error signing resume URL:", err);
        }
      }
    }

    return { success: true, applicants };
  } catch (err: unknown) {
    console.error("Exception in getCompanyApplications:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch company applicants",
    };
  }
}

export async function updateApplicationStatus(applicationId: string, newStatus: string) {
  try {
    const supabase = getSupabaseAdmin();
    const companyId = await getCurrentCompanyId(supabase);

    const allowedStatuses = ["pending", "reviewing", "accepted", "rejected"];
    if (!allowedStatuses.includes(newStatus)) {
      return { success: false, error: "Invalid application status" };
    }

    const { data: appRow, error: findError } = await supabase
      .from("applications")
      .select("id, internship_id")
      .eq("id", applicationId)
      .maybeSingle();

    if (findError || !appRow) {
      return { success: false, error: "Application not found" };
    }

    const { data: ownedInternship, error: ownError } = await supabase
      .from("internships")
      .select("id")
      .eq("id", appRow.internship_id)
      .eq("company_id", companyId)
      .maybeSingle();

    if (ownError || !ownedInternship) {
      return { success: false, error: "Unauthorized access to this application" };
    }

    const { data, error } = await supabase
      .from("applications")
      .update({ status: newStatus })
      .eq("id", applicationId)
      .select()
      .single();

    if (error) {
      console.error("Error updating application status:", error);
      return { success: false, error: error.message };
    }

    return { success: true, application: data, message: "อัปเดตสถานะใบสมัครสำเร็จเรียบร้อย! 🎉" };
  } catch (err: unknown) {
    console.error("Exception in updateApplicationStatus:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update application status",
    };
  }
}

export async function getStudentInternships() {
  try {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    
    let studentId: string | null = null;
    let studentSkillsData: any[] = [];
    
    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
        ) as any;
        
        if (decoded.role === "student") {
          const { data: student } = await supabase
            .from("students")
            .select("id")
            .eq("user_id", decoded.userId)
            .maybeSingle();
            
          if (student) {
            studentId = student.id;
            
            // Fetch student skills with level
            const { data: skillsData } = await supabase
              .from("student_skills")
              .select("skill_id, level")
              .eq("student_id", studentId);
              
            if (skillsData) {
              studentSkillsData = skillsData;
            }
          }
        }
      } catch (e) {
        console.error("Token verification failed in getStudentInternships:", e);
      }
    }

    const { data: internships, error } = await supabase
      .from("internships")
      .select(`
        *,
        companies (
          company_name,
          logo,
          province
        ),
        applications (
          id,
          student_id,
          status
        ),
        internship_skills (
          id,
          skill_id,
          level,
          skills (
            id,
            name,
            category
          )
        )
      `)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching student internships:", error);
      return { success: false, error: error.message };
    }

    const mappedInternships = (internships || []).map((item: any) => {
      const hasApplied = studentId 
        ? (item.applications || []).some((app: any) => app.student_id === studentId) 
        : false;
      
      const applicationStatus = studentId 
        ? (item.applications || []).find((app: any) => app.student_id === studentId)?.status || null 
        : null;

      const matchScore = calculateMatchScoreHelper(studentSkillsData, item.internship_skills);

      return {
        id: item.id,
        company_name: item.companies?.company_name || "Unknown Company",
        company_logo: item.companies?.logo || "",
        company_province: item.companies?.province || "",
        title: item.title,
        department: item.department || "",
        description: item.description,
        responsibilities: item.responsibilities || "",
        location: item.location,
        internship_type: item.internship_type,
        status: item.status,
        created_at: item.created_at,
        has_applied: hasApplied,
        application_status: applicationStatus,
        match_score: matchScore,
        skills: (item.internship_skills || []).map((is: any) => ({
          id: is.id.toString(),
          skill_id: Number(is.skill_id),
          name: is.skills?.name || "Unknown",
          category: is.skills?.category || "Unknown",
          level: is.level || "Intermediate"
        }))
      };
    });

    // Sort by Match Score Descending
    mappedInternships.sort((a, b) => b.match_score - a.match_score);

    return { success: true, internships: mappedInternships };
  } catch (err: unknown) {
    console.error("Exception in getStudentInternships:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch internships for student",
    };
  }
}

export async function applyToInternship(internshipId: string) {
  try {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    if (!token) {
      return { success: false, error: "Unauthorized: No token found" };
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as any;

    if (decoded.role !== "student") {
      return { success: false, error: "Unauthorized: Only students can apply to internships" };
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", decoded.userId)
      .maybeSingle();

    if (studentError || !student) {
      return { success: false, error: "Student profile not found" };
    }

    const { data: existingApp, error: checkError } = await supabase
      .from("applications")
      .select("id")
      .eq("student_id", student.id)
      .eq("internship_id", internshipId)
      .maybeSingle();

    if (checkError) {
      console.error("Error verifying application status:", checkError);
      return { success: false, error: "Error verifying application status" };
    }

    if (existingApp) {
      return { success: false, error: "You have already applied to this internship" };
    }

    // Fetch student skills
    const { data: studentSkills, error: studentSkillsError } = await supabase
      .from("student_skills")
      .select("skill_id, level")
      .eq("student_id", student.id);

    if (studentSkillsError) {
      console.error("Error fetching student skills in applyToInternship:", studentSkillsError);
      return { success: false, error: "Failed to load candidate skills profile" };
    }

    // Fetch internship required skills
    const { data: internshipSkills, error: internshipSkillsError } = await supabase
      .from("internship_skills")
      .select("skill_id, level")
      .eq("internship_id", internshipId);

    if (internshipSkillsError) {
      console.error("Error fetching internship skills in applyToInternship:", internshipSkillsError);
      return { success: false, error: "Failed to load internship requirements" };
    }

    const computedMatchScore = calculateMatchScoreHelper(studentSkills || [], internshipSkills || []);

    const { data, error } = await supabase
      .from("applications")
      .insert([
        {
          student_id: student.id,
          internship_id: internshipId,
          match_score: computedMatchScore,
          status: "pending",
          applied_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating application:", error);
      return { success: false, error: error.message };
    }

    return { success: true, application: data, message: "สมัครงานสำเร็จเรียบร้อย! 🎉" };
  } catch (err: unknown) {
    console.error("Exception in applyToInternship:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to apply to internship",
    };
  }
}

export async function cancelApplication(internshipId: string) {
  try {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    if (!token) {
      return { success: false, error: "Unauthorized: No token found" };
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as any;

    if (decoded.role !== "student") {
      return { success: false, error: "Unauthorized: Only students can cancel applications" };
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", decoded.userId)
      .maybeSingle();

    if (studentError || !student) {
      return { success: false, error: "Student profile not found" };
    }

    const { error } = await supabase
      .from("applications")
      .delete()
      .eq("student_id", student.id)
      .eq("internship_id", internshipId);

    if (error) {
      console.error("Error deleting application:", error);
      return { success: false, error: error.message };
    }

    return { success: true, message: "ยกเลิกการสมัครฝึกงานสำเร็จเรียบร้อย! 📥" };
  } catch (err: unknown) {
    console.error("Exception in cancelApplication:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel application",
    };
  }
}

export async function getStudentApplications() {
  try {
    const supabase = getSupabaseAdmin();
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    if (!token) {
      return { success: false, error: "Unauthorized: No token found" };
    }
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as any;

    if (decoded.role !== "student") {
      return { success: false, error: "Unauthorized: Only students can view their applications" };
    }

    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", decoded.userId)
      .maybeSingle();

    if (studentError || !student) {
      if (studentError) console.error("Error fetching student profile:", studentError);
      return { success: false, error: "Student profile not found" };
    }

    // Fetch student skills for dynamic recalculation
    const { data: studentSkills, error: studentSkillsError } = await supabase
      .from("student_skills")
      .select("skill_id, level")
      .eq("student_id", student.id);

    if (studentSkillsError) {
      console.error("Error fetching student skills in getStudentApplications:", studentSkillsError);
      return { success: false, error: "Failed to load candidate skills profile" };
    }

    const { data, error } = await supabase
      .from("applications")
      .select(`
        id,
        match_score,
        status,
        applied_at,
        internship_id,
        internships (
          title,
          company_id,
          description,
          responsibilities,
          location,
          internship_type,
          companies (
            company_name,
            logo,
            province
          ),
          internship_skills (
            skill_id,
            level
          )
        )
      `)
      .eq("student_id", student.id)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("Error fetching student applications:", error);
      return { success: false, error: error.message };
    }

    const mapped = (data || []).map((app: any) => {
      const recalculatedScore = calculateMatchScoreHelper(
        studentSkills || [],
        app.internships?.internship_skills || []
      );

      return {
        id: app.id,
        match_score: recalculatedScore,
        status: app.status || "pending",
        applied_at: app.applied_at || "",
        internship_id: app.internship_id,
        title: app.internships?.title || "Unknown Position",
        company_name: app.internships?.companies?.company_name || "Unknown Company",
        company_logo: app.internships?.companies?.logo || "",
        company_province: app.internships?.companies?.province || "",
        description: app.internships?.description || "",
        responsibilities: app.internships?.responsibilities || "",
        location: app.internships?.location || "",
        internship_type: app.internships?.internship_type || ""
      };
    });

    return { success: true, applications: mapped };
  } catch (err: unknown) {
    console.error("Exception in getStudentApplications:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch student applications",
    };
  }
}
