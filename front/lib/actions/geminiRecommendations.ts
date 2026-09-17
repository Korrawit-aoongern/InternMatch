"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { generateMockAiUpskilling } from "@/lib/utils/mockAnalysis";
import { ensureVideoSearchUrl } from "@/lib/utils/videoUrl";

export interface SkillRecommendation {
  id: string;
  title: string;
  url: string;
  platform: "YouTube" | "Coursera" | "Udemy" | "ThaiMOOC" | "FutureSkill" | "edX" | "Other" | string;
  author: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  resource_type: "video" | "course";
  targetSkill: string;
  reason: string;
}

export interface AiUpskillingResult {
  success: boolean;
  hasGaps: boolean;
  analysisText: string;
  recommendations: SkillRecommendation[];
  provider: "gemini" | "fallback";
  isCached?: boolean;
  error?: string;
}

export interface AiRecommendationOptions {
  internshipId?: string;
  studentId?: string;
  applicationId?: string;
  forceRefresh?: boolean;
}

const LEVEL_WEIGHTS: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

const GEMINI_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
];

export interface SkillItem {
  skill_id?: number;
  id?: number;
  name?: string;
  level?: string;
  skills?: {
    name?: string;
  };
}

// Safely extract student ID from cookie or passed argument without throwing
async function getEffectiveStudentId(supabase: any, explicitStudentId?: string): Promise<string | null> {
  if (explicitStudentId) return explicitStudentId;
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value || cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY"
    ) as { userId?: string };

    if (!decoded?.userId) return null;

    const { data: student, error } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", decoded.userId)
      .maybeSingle();

    if (error || !student) return null;
    return student.id;
  } catch {
    return null;
  }
}

export async function getAiSkillRecommendations(
  internshipTitle: string,
  internshipDescription: string | null | undefined,
  internshipSkills: SkillItem[] | null | undefined,
  studentSkills: SkillItem[] | null | undefined,
  options?: AiRecommendationOptions
): Promise<AiUpskillingResult> {
  const sSkills = studentSkills || [];
  const reqSkills = internshipSkills || [];

  const missingSkills: string[] = [];
  const underLeveledSkills: string[] = [];
  const gapSkillNames: string[] = [];

  reqSkills.forEach((req) => {
    const skillName = req.name || req.skills?.name || `Skill #${req.skill_id || req.id}`;
    const skillNameLower = skillName.toLowerCase();
    const reqLevelStr = (req.level || "Intermediate").toLowerCase();
    const reqLevel = LEVEL_WEIGHTS[reqLevelStr] || 2;

    const studentSkill = sSkills.find((s) => {
      const sName = s.name || s.skills?.name || "";
      const sId = s.skill_id || s.id;
      const rId = req.skill_id || req.id;
      return (rId && sId && Number(sId) === Number(rId)) || (sName && sName.toLowerCase() === skillNameLower);
    });

    if (!studentSkill) {
      missingSkills.push(`${skillName} (ต้องการระดับ ${req.level || "Intermediate"})`);
      gapSkillNames.push(skillName);
    } else {
      const studentLevelStr = (studentSkill.level || "Intermediate").toLowerCase();
      const studentLevel = LEVEL_WEIGHTS[studentLevelStr] || 2;
      if (studentLevel < reqLevel) {
        underLeveledSkills.push(`${skillName} (ปัจจุบัน ${studentSkill.level} -> ต้องการ ${req.level})`);
        gapSkillNames.push(skillName);
      }
    }
  });

  // If no skill gaps exist
  if (missingSkills.length === 0 && underLeveledSkills.length === 0) {
    return {
      success: true,
      hasGaps: false,
      analysisText: `🎉 ยินดีด้วยครับ! ทักษะปัจจุบันของคุณตรงกับความต้องการของตำแหน่ง **${internshipTitle}** ครบถ้วน 100% แล้ว คุณมีความพร้อมเต็มที่สำหรับการยื่นสมัครงานนี้!`,
      recommendations: [],
      provider: "gemini",
    };
  }

  const supabase = getSupabaseAdmin();
  const internshipId = options?.internshipId;
  const effectiveStudentId = await getEffectiveStudentId(supabase, options?.studentId);

  const skillsHash = sSkills
    .map((s) => `${s.skill_id || s.id}_${s.level}`)
    .sort()
    .join(",");

  // 1. Check Database Cache in ai_recommendations (unless forceRefresh is requested)
  if (effectiveStudentId && internshipId && !options?.forceRefresh) {
    try {
      const { data: cached, error: cacheErr } = await supabase
        .from("ai_recommendations")
        .select("*")
        .eq("student_id", effectiveStudentId)
        .eq("internship_id", internshipId)
        .maybeSingle();

      if (!cacheErr && cached && cached.learning_path) {
        // Check if student's current skills match the cached skills_hash
        if (!cached.skills_hash || cached.skills_hash === skillsHash) {
          let parsedRecs: SkillRecommendation[] = [];
          try {
            parsedRecs = JSON.parse(cached.recommended_courses || "[]");
          } catch {
            parsedRecs = [];
          }

          return {
            success: true,
            hasGaps: true,
            analysisText: cached.learning_path,
            recommendations: parsedRecs,
            provider: "gemini",
            isCached: true,
          };
        }
      }
    } catch (cacheLookupErr) {
      console.warn("Error reading AI cache:", cacheLookupErr);
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // If no API key, fallback immediately to local mock data
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not configured. Falling back to local mock data.");
    const fallback = generateMockAiUpskilling(sSkills, reqSkills, internshipTitle);
    return {
      success: true,
      hasGaps: fallback.hasGaps,
      analysisText: fallback.analysisText,
      recommendations: fallback.recommendedCourses.map((c) => {
        const isVideo = c.resource_type === "video" || c.platform?.toLowerCase().includes("youtube");
        return {
          id: c.id,
          title: c.title,
          url: isVideo ? ensureVideoSearchUrl(c.url, c.title, "ทักษะที่เกี่ยวข้อง") : c.url,
          platform: c.platform,
          author: c.author,
          level: c.level,
          resource_type: c.resource_type,
          targetSkill: "ทักษะที่เกี่ยวข้อง",
          reason: "หลักสูตรแนะนำสำหรับปูพื้นฐานและพัฒนาทักษะสู่ระดับที่ตลาดต้องการ",
        };
      }),
      provider: "fallback",
    };
  }

  const totalGaps = gapSkillNames.length;
  const prompt = `คุณคือ Career Coach ของ InternMatch
ตำแหน่งงาน: "${internshipTitle}"
รายละเอียดงาน: ${internshipDescription || "ไม่มีข้อมูลเพิ่มเติม"}

ข้อมูลการวิเคราะห์ช่องว่างทักษะ:
- ทักษะที่ยังขาด (Missing Skills): ${missingSkills.length > 0 ? missingSkills.join(", ") : "ไม่มี"}
- ทักษะที่ต้องอัปเลเวล (Under-leveled Skills): ${underLeveledSkills.length > 0 ? underLeveledSkills.join(", ") : "ไม่มี"}

เป้าหมายของคุณ:
1. เขียนบทวิเคราะห์และคำแนะนำภาพรวม (analysisText) สั้นกระชับ 1-2 ย่อหน้าในภาษาไทย เป็นกันเองและตรงประเด็น
2. แนะนำสื่อการเรียนรู้ (คลิป YouTube ฟรี หรือคอร์สออนไลน์) **ให้ครอบคลุมครบทุกทักษะที่ต้องพัฒนาข้างต้น ทักษะละ 1 รายการ** (มีทั้งหมด ${totalGaps} ทักษะ: ${gapSkillNames.join(", ")} ให้แนะนำรวม ${totalGaps} รายการ ห้ามตกหล่นทักษะใด เพื่อให้นักศึกษาได้พัฒนาครบทุกจุด)
**ข้อกำหนดพิเศษสำหรับคลิปวิดีโอ (YouTube)**:
เพื่อป้องกันปัญหาลิงก์เสีย ให้สร้าง url เป็นลิงก์หน้าค้นหาบน YouTube (Search Query URL) เสมอในรูปแบบ:
https://www.youtube.com/results?search_query=คำค้นหา
ห้ามใส่ลิงก์เจาะจง watch?v= เด็ดขาด

ตอบเป็น JSON เท่านั้น โครงสร้าง:
{
  "analysisText": "คำแนะนำสั้นกระชับ 1-2 ย่อหน้า",
  "recommendations": [
    {
      "id": "rec-1",
      "title": "ชื่อหัวข้อคลิปหรือคอร์ส",
      "url": "https://www.youtube.com/results?search_query=...",
      "platform": "YouTube | Coursera | Udemy | ThaiMOOC | Other",
      "author": "ผู้สอนหรือสถาบัน",
      "level": "Beginner | Intermediate | Advanced",
      "resource_type": "video | course",
      "targetSkill": "ชื่อทักษะเป้าหมายที่ตรงกับทักษะที่ต้องพัฒนา",
      "reason": "เหตุผลสั้นๆ 1 ประโยค"
    }
  ]
}`;

  const targetTokens = Math.min(2048, Math.max(800, totalGaps * 220 + 350));

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(8000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.3,
              maxOutputTokens: targetTokens,
            },
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        console.warn(`Gemini model ${model} error:`, data.error.message);
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        continue;
      }

      const parsed = JSON.parse(text);
      if (parsed && typeof parsed.analysisText === "string" && Array.isArray(parsed.recommendations)) {
        const sanitizedRecs = parsed.recommendations.map((rec: any, idx: number) => {
          const isVideo = rec.resource_type === "video" || rec.platform?.toLowerCase()?.includes("youtube");
          return {
            ...rec,
            id: rec.id || `rec-${idx + 1}`,
            url: isVideo ? ensureVideoSearchUrl(rec.url, rec.title, rec.targetSkill) : rec.url,
          };
        });

        // Save / Upsert to Database Cache
        if (effectiveStudentId && internshipId) {
          try {
            const recCoursesJson = JSON.stringify(sanitizedRecs);
            await supabase.from("ai_recommendations").upsert(
              {
                student_id: effectiveStudentId,
                internship_id: internshipId,
                application_id: options?.applicationId || null,
                missing_skills: missingSkills.join(", "),
                learning_path: parsed.analysisText,
                recommended_courses: recCoursesJson,
                skills_hash: skillsHash,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "student_id,internship_id" }
            );
          } catch (saveCacheErr) {
            console.warn("Failed to save AI cache to DB:", saveCacheErr);
          }
        }

        return {
          success: true,
          hasGaps: true,
          analysisText: parsed.analysisText,
          recommendations: sanitizedRecs,
          provider: "gemini",
          isCached: false,
        };
      }
    } catch (err: any) {
      console.warn(`Failed to call Gemini model ${model}:`, err.message);
    }
  }

  // If all models failed, fallback safely
  console.warn("All Gemini models failed. Using fallback mock recommendations.");
  const fallback = generateMockAiUpskilling(sSkills, reqSkills, internshipTitle);
  return {
    success: true,
    hasGaps: fallback.hasGaps,
    analysisText: fallback.analysisText,
    recommendations: fallback.recommendedCourses.map((c) => {
      const isVideo = c.resource_type === "video" || c.platform?.toLowerCase().includes("youtube");
      return {
        id: c.id,
        title: c.title,
        url: isVideo ? ensureVideoSearchUrl(c.url, c.title, "ทักษะที่เกี่ยวข้อง") : c.url,
        platform: c.platform,
        author: c.author,
        level: c.level,
        resource_type: c.resource_type,
        targetSkill: "ทักษะที่เกี่ยวข้อง",
        reason: "หลักสูตรแนะนำสำหรับปูพื้นฐานและพัฒนาทักษะสู่ระดับที่ตลาดต้องการ",
      };
    }),
    provider: "fallback",
    error: "AI service temporarily busy; displaying curated recommendations.",
  };
}
