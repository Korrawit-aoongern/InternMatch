"use server";

import { generateMockAiUpskilling } from "@/lib/utils/mockAnalysis";

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
  error?: string;
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

export async function getAiSkillRecommendations(
  internshipTitle: string,
  internshipDescription: string | null | undefined,
  internshipSkills: SkillItem[] | null | undefined,
  studentSkills: SkillItem[] | null | undefined
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

  const apiKey = process.env.GEMINI_API_KEY;

  // If no API key, fallback immediately to local mock data
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not configured. Falling back to local mock data.");
    const fallback = generateMockAiUpskilling(sSkills, reqSkills, internshipTitle);
    return {
      success: true,
      hasGaps: fallback.hasGaps,
      analysisText: fallback.analysisText,
      recommendations: fallback.recommendedCourses.map((c) => ({
        id: c.id,
        title: c.title,
        url: c.url,
        platform: c.platform,
        author: c.author,
        level: c.level,
        resource_type: c.resource_type,
        targetSkill: "ทักษะที่เกี่ยวข้อง",
        reason: "หลักสูตรแนะนำสำหรับปูพื้นฐานและพัฒนาทักษะสู่ระดับที่ตลาดต้องการ",
      })),
      provider: "fallback",
    };
  }

  const prompt = `คุณคือ Career Coach และ AI ผู้เชี่ยวชาญด้านการพัฒนาทักษะ (Skill Development Coach) ของแพลตฟอร์ม InternMatch
นักศึกษากำลังพิจารณาฝึกงานในตำแหน่ง: "${internshipTitle}"
รายละเอียดงาน: ${internshipDescription || "ไม่มีข้อมูลรายละเอียดเพิ่มเติม"}

ข้อมูลการวิเคราะห์ช่องว่างทักษะ:
- ทักษะที่ยังขาดในโปรไฟล์ (Missing Skills): ${missingSkills.length > 0 ? missingSkills.join(", ") : "ไม่มี"}
- ทักษะที่ต้องอัปเลเวลเพิ่มเติม (Under-leveled Skills): ${underLeveledSkills.length > 0 ? underLeveledSkills.join(", ") : "ไม่มี"}

เป้าหมายของคุณ:
1. เขียนบทวิเคราะห์และคำแนะนำภาพรวม (analysisText) สั้นกระชับ 2-3 ย่อหน้าในภาษาไทย ให้กำลังใจ เป็นกันเอง พร้อมลำดับขั้นตอนที่ควรเริ่มเรียนรู้ก่อน-หลัง
2. คัดเลือกคลิปสอน YouTube (ฟรี) และคอร์สออนไลน์เสริม (Coursera, Udemy, ThaiMOOC ฯลฯ) รวมกัน 3-4 รายการที่ตรงเป้าหมายที่สุด

ข้อกำหนดการตอบ:
ตอบเป็น JSON เท่านั้น โครงสร้าง:
{
  "analysisText": "ข้อความวิเคราะห์และคำแนะนำภาพรวมในภาษาไทย",
  "recommendations": [
    {
      "id": "rec-1",
      "title": "ชื่อคลิปวิดีโอหรือชื่อคอร์ส",
      "url": "URL สำหรับเข้าไปเรียน เช่น https://www.youtube.com/results?search_query=... หรือ https://www.udemy.com/...",
      "platform": "YouTube | Coursera | Udemy | ThaiMOOC | FutureSkill | Other",
      "author": "ชื่อช่อง YouTube หรือสถาบัน/ผู้สอน",
      "level": "Beginner | Intermediate | Advanced",
      "resource_type": "video | course",
      "targetSkill": "ชื่อทักษะเป้าหมาย",
      "reason": "เหตุผลสั้นๆ 1 ประโยคว่าทำไมถึงแนะนำ"
    }
  ]
}`;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.4,
              thinkingConfig: {
                thinkingBudget: 0,
              },
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
        return {
          success: true,
          hasGaps: true,
          analysisText: parsed.analysisText,
          recommendations: parsed.recommendations,
          provider: "gemini",
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
    recommendations: fallback.recommendedCourses.map((c) => ({
      id: c.id,
      title: c.title,
      url: c.url,
      platform: c.platform,
      author: c.author,
      level: c.level,
      resource_type: c.resource_type,
      targetSkill: "ทักษะที่เกี่ยวข้อง",
      reason: "หลักสูตรแนะนำสำหรับปูพื้นฐานและพัฒนาทักษะสู่ระดับที่ตลาดต้องการ",
    })),
    provider: "fallback",
    error: "AI service temporarily busy; displaying curated recommendations.",
  };
}
