"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSupabaseAdmin } from "../supabase/server";

export interface HeaderNotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  status?: string;
  isRead?: boolean;
  link: string;
}

export interface HeaderDataResult {
  success: boolean;
  role: "student" | "company" | null;
  avatar: string | null;
  unreadCount: number;
  notifications: HeaderNotificationItem[];
}

interface DecodedToken {
  userId: string;
  email: string;
  username: string;
  fullname?: string;
  role?: "student" | "company";
}

/**
 * Super lightweight Server Action to fetch header profile avatar and notifications
 * in a single, parallelized database query without fetching heavy skills/portfolios/resumes.
 */
export async function getHeaderData(): Promise<HeaderDataResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;

    if (!token) {
      return { success: false, role: null, avatar: null, unreadCount: 0, notifications: [] };
    }

    let decoded: DecodedToken;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
      ) as DecodedToken;
    } catch {
      return { success: false, role: null, avatar: null, unreadCount: 0, notifications: [] };
    }

    const supabase = getSupabaseAdmin();
    const role = decoded.role || "student";

    if (role === "student") {
      // 1. Fetch student ID & profile image
      const { data: student } = await supabase
        .from("students")
        .select("id, profile_image")
        .eq("user_id", decoded.userId)
        .maybeSingle();

      if (!student) {
        return { success: true, role: "student", avatar: null, unreadCount: 0, notifications: [] };
      }

      const avatar = student.profile_image || null;

      // 2. Fetch recent applications with minimal columns
      const { data: apps } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          applied_at,
          internships (
            title,
            companies (
              company_name
            )
          )
        `)
        .eq("student_id", student.id)
        .order("applied_at", { ascending: false })
        .limit(10);

      const notifications: HeaderNotificationItem[] = (apps || []).map((app: any) => {
        let statusText = "ส่งใบสมัครแล้ว (Pending)";
        if (app.status === "reviewing") statusText = "กำลังอยู่ระหว่างพิจารณา (Reviewing)";
        if (app.status === "accepted") statusText = "ได้รับการตอบรับฝึกงาน! 🎉 (Accepted)";
        if (app.status === "rejected") statusText = "ไม่ผ่านการคัดเลือก (Rejected)";

        const title = app.internships?.title || "ประกาศรับสมัคร";
        const companyName = app.internships?.companies?.company_name || "บริษัท";

        return {
          id: app.id,
          title,
          description: `${companyName} - สถานะ: ${statusText}`,
          time: app.applied_at
            ? new Date(app.applied_at).toLocaleDateString("th-TH", { month: "short", day: "numeric" })
            : "เร็วๆ นี้",
          status: app.status,
          link: `/dashboard/applications?id=${app.id}`,
        };
      });

      const unreadCount = notifications.filter(
        (n) => n.status === "accepted" || n.status === "reviewing" || n.status === "pending"
      ).length;

      return { success: true, role: "student", avatar, unreadCount, notifications };
    } else {
      // Company role
      const { data: company } = await supabase
        .from("companies")
        .select("id, logo")
        .eq("user_id", decoded.userId)
        .maybeSingle();

      if (!company) {
        return { success: true, role: "company", avatar: null, unreadCount: 0, notifications: [] };
      }

      const avatar = company.logo || null;

      const { data: apps } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          applied_at,
          students (
            fullname
          ),
          internships!inner (
            title,
            company_id
          )
        `)
        .eq("internships.company_id", company.id)
        .order("applied_at", { ascending: false })
        .limit(10);

      const notifications: HeaderNotificationItem[] = (apps || []).map((app: any) => {
        let statusText = "รอการตรวจสอบ (Pending)";
        if (app.status === "reviewing") statusText = "กำลังพิจารณา (Reviewing)";
        if (app.status === "accepted") statusText = "ผ่านการคัดเลือก (Accepted)";
        if (app.status === "rejected") statusText = "ไม่ผ่านการคัดเลือก (Rejected)";

        const studentName = app.students?.fullname || "นักศึกษา";
        const internshipTitle = app.internships?.title || "ตำแหน่งฝึกงาน";

        return {
          id: app.id,
          title: studentName,
          description: `สมัครตำแหน่ง: ${internshipTitle} (สถานะ: ${statusText})`,
          time: app.applied_at
            ? new Date(app.applied_at).toLocaleDateString("th-TH", { month: "short", day: "numeric" })
            : "เร็วๆ นี้",
          status: app.status,
          link: `/dashboard/applications?appId=${app.id}`,
        };
      });

      const unreadCount = notifications.filter(
        (n) => n.status === "pending" || n.status === "reviewing"
      ).length;

      return { success: true, role: "company", avatar, unreadCount, notifications };
    }
  } catch (err) {
    console.error("Error in getHeaderData:", err);
    return { success: false, role: null, avatar: null, unreadCount: 0, notifications: [] };
  }
}
