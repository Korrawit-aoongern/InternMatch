"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSupabaseAdmin } from "../supabase/server";
import { calculateMatchScoreHelper } from "../utils/match";

export interface StudentDashboardData {
  success: boolean;
  stats: {
    avgMatchScore: number;
    appliedCount: number;
    recommendedCount: number;
    alertsCount: number;
  };
  recentApplications: any[];
  studentSkills: any[];
  profile: any;
  error?: string;
}

export interface CompanyDashboardData {
  success: boolean;
  stats: {
    avgMatchRate: number;
    totalApplicants: number;
    activeJobPosts: number;
    pendingActionAlerts: number;
  };
  recentApplicants: any[];
  error?: string;
}

interface DecodedToken {
  userId: string;
  email: string;
  username: string;
  fullname?: string;
  role?: string;
}

/**
 * Single aggregated server action to fetch all data needed for StudentDashboard
 * in 1 single parallel roundtrip without redundant DB calls.
 */
export async function getStudentDashboardData(): Promise<StudentDashboardData> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

    if (!token) {
      return { success: false, stats: { avgMatchScore: 0, appliedCount: 0, recommendedCount: 0, alertsCount: 0 }, recentApplications: [], studentSkills: [], profile: null, error: "Unauthorized" };
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as DecodedToken;

    if (decoded.role !== "student") {
      return { success: false, stats: { avgMatchScore: 0, appliedCount: 0, recommendedCount: 0, alertsCount: 0 }, recentApplications: [], studentSkills: [], profile: null, error: "Forbidden" };
    }

    const supabase = getSupabaseAdmin();

    // 1. Fetch student basic info
    const { data: student, error: studentErr } = await supabase
      .from("students")
      .select("*, users (email)")
      .eq("user_id", decoded.userId)
      .maybeSingle();

    if (studentErr || !student) {
      return { success: false, stats: { avgMatchScore: 0, appliedCount: 0, recommendedCount: 0, alertsCount: 0 }, recentApplications: [], studentSkills: [], profile: null, error: "Student not found" };
    }

    const studentId = student.id;

    // 2. Fetch skills, applications, and open internships requirements in parallel
    const [skillsRes, appsRes, openInternshipsRes] = await Promise.all([
      supabase
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
        .eq("student_id", studentId),
      supabase
        .from("applications")
        .select(`
          id,
          match_score,
          status,
          applied_at,
          internship_id,
          internships (
            title,
            location,
            companies (
              company_name
            ),
            internship_skills (
              skill_id,
              level
            )
          )
        `)
        .eq("student_id", studentId)
        .order("applied_at", { ascending: false }),
      supabase
        .from("internships")
        .select(`
          id,
          internship_skills (
            skill_id,
            level
          )
        `)
        .eq("status", "open"),
    ]);

    const studentSkills = (skillsRes.data || []).map((item: any) => ({
      id: item.id,
      skill_id: item.skill_id,
      name: item.skills?.name || "",
      category: item.skills?.category || "",
      level: item.level || "Intermediate",
    }));

    const rawSkillsForMatch = (skillsRes.data || []).map((s: any) => ({
      skill_id: s.skill_id,
      level: s.level,
    }));

    const applications = appsRes.data || [];
    const appliedCount = applications.length;

    let totalScore = 0;
    const mappedApplications = applications.map((app: any) => {
      const recalculatedScore = calculateMatchScoreHelper(
        rawSkillsForMatch,
        app.internships?.internship_skills || []
      );
      totalScore += recalculatedScore;

      return {
        id: app.id,
        match_score: recalculatedScore,
        status: app.status || "pending",
        applied_at: app.applied_at,
        title: app.internships?.title || "Unknown Position",
        company_name: app.internships?.companies?.company_name || "Unknown Company",
        location: app.internships?.location || "",
      };
    });

    let avgMatchScore = appliedCount > 0 ? Math.round(totalScore / appliedCount) : 0;
    const alertsCount = applications.filter(
      (item: any) => item.status === "accepted" || item.status === "reviewing"
    ).length;

    // Calculate recommended count from open internships
    const openInternships = openInternshipsRes.data || [];
    let recommendedCount = 0;
    const topScores: number[] = [];

    for (const intern of openInternships) {
      const score = calculateMatchScoreHelper(rawSkillsForMatch, intern.internship_skills || []);
      if (score >= 50) recommendedCount++;
      topScores.push(score);
    }

    if (appliedCount === 0 && topScores.length > 0) {
      topScores.sort((a, b) => b - a);
      const topSlice = topScores.slice(0, 5);
      avgMatchScore = Math.round(topSlice.reduce((a, b) => a + b, 0) / topSlice.length);
    }

    return {
      success: true,
      stats: {
        avgMatchScore,
        appliedCount,
        recommendedCount,
        alertsCount,
      },
      recentApplications: mappedApplications.slice(0, 5),
      studentSkills,
      profile: student,
    };
  } catch (err: any) {
    console.error("Error in getStudentDashboardData:", err);
    return {
      success: false,
      stats: { avgMatchScore: 0, appliedCount: 0, recommendedCount: 0, alertsCount: 0 },
      recentApplications: [],
      studentSkills: [],
      profile: null,
      error: err?.message || "Failed to load dashboard data",
    };
  }
}

/**
 * Single aggregated server action to fetch all data needed for CompanyDashboard
 * in 1 single parallel roundtrip without heavy storage signing loops.
 */
export async function getCompanyDashboardData(): Promise<CompanyDashboardData> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

    if (!token) {
      return { success: false, stats: { avgMatchRate: 0, totalApplicants: 0, activeJobPosts: 0, pendingActionAlerts: 0 }, recentApplicants: [], error: "Unauthorized" };
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as DecodedToken;

    if (decoded.role !== "company") {
      return { success: false, stats: { avgMatchRate: 0, totalApplicants: 0, activeJobPosts: 0, pendingActionAlerts: 0 }, recentApplicants: [], error: "Forbidden" };
    }

    const supabase = getSupabaseAdmin();

    const { data: company, error: compErr } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", decoded.userId)
      .maybeSingle();

    if (compErr || !company) {
      return { success: false, stats: { avgMatchRate: 0, totalApplicants: 0, activeJobPosts: 0, pendingActionAlerts: 0 }, recentApplicants: [], error: "Company not found" };
    }

    const companyId = company.id;

    // Parallel fetch: company internships status & applications
    const [internshipsRes, appsRes] = await Promise.all([
      supabase
        .from("internships")
        .select("id, status")
        .eq("company_id", companyId),
      supabase
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
            university,
            faculty,
            major,
            profile_image,
            student_skills (
              skill_id,
              level
            )
          )
        `)
        .eq("internships.company_id", companyId)
        .order("applied_at", { ascending: false }),
    ]);

    const activeJobPosts = (internshipsRes.data || []).filter((i: any) => i.status === "open").length;
    const appsList = appsRes.data || [];
    const totalApplicants = appsList.length;

    let sumMatch = 0;
    const mappedApplicants = appsList.map((item: any) => {
      const student = item.students;
      const recalculatedScore = calculateMatchScoreHelper(
        student?.student_skills || [],
        item.internships?.internship_skills || []
      );
      sumMatch += recalculatedScore;

      return {
        application_id: item.id,
        student_id: item.student_id,
        internship_id: item.internship_id,
        internship_title: item.internships?.title || "Unknown Position",
        fullname: student?.fullname || "Unknown Student",
        university: student?.university || "",
        faculty: student?.faculty || "",
        major: student?.major || "",
        profile_image: student?.profile_image || "",
        match_score: recalculatedScore,
        status: item.status,
        applied_at: item.applied_at,
      };
    });

    const avgMatchRate = totalApplicants > 0 ? Math.round(sumMatch / totalApplicants) : 0;
    const pendingActionAlerts = appsList.filter(
      (item: any) => item.status === "pending" || item.status === "reviewing"
    ).length;

    return {
      success: true,
      stats: {
        avgMatchRate,
        totalApplicants,
        activeJobPosts,
        pendingActionAlerts,
      },
      recentApplicants: mappedApplicants.slice(0, 5),
    };
  } catch (err: any) {
    console.error("Error in getCompanyDashboardData:", err);
    return {
      success: false,
      stats: { avgMatchRate: 0, totalApplicants: 0, activeJobPosts: 0, pendingActionAlerts: 0 },
      recentApplicants: [],
      error: err?.message || "Failed to load dashboard data",
    };
  }
}
