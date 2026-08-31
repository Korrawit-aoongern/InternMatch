export interface MockResource {
  id: string;
  title: string;
  url: string;
  platform: "YouTube" | "Coursera" | "Udemy" | "Other";
  author: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  resource_type: "video" | "course";
}

export const MOCK_RESOURCES: Record<string, MockResource[]> = {
  "react": [
    {
      id: "r1",
      title: "React State Management (Redux/Zustand) in 1 Hour",
      url: "https://www.youtube.com/watch?v=mock_react_1",
      platform: "YouTube",
      author: "KongRuksiam Official",
      level: "Intermediate",
      resource_type: "video"
    },
    {
      id: "r2",
      title: "Ultimate React & Next.js Professional Course",
      url: "https://www.coursera.org/learn/mock_react_2",
      platform: "Coursera",
      author: "Stanford University",
      level: "Advanced",
      resource_type: "course"
    }
  ],
  "node.js": [
    {
      id: "n1",
      title: "Node.js & Express.js API Crash Course for Beginners",
      url: "https://www.youtube.com/watch?v=mock_node_1",
      platform: "YouTube",
      author: "Code Camp Thailand",
      level: "Beginner",
      resource_type: "video"
    }
  ],
  "typescript": [
    {
      id: "t1",
      title: "TypeScript Deep Dive & Best Practices",
      url: "https://www.udemy.com/course/mock_ts_1",
      platform: "Udemy",
      author: "Maximilian Schwarzmüller",
      level: "Intermediate",
      resource_type: "course"
    }
  ],
  "css": [
    {
      id: "c1",
      title: "Tailwind CSS Next-Gen Styling Guide",
      url: "https://www.youtube.com/watch?v=mock_css_1",
      platform: "YouTube",
      author: "DesignCourse",
      level: "Intermediate",
      resource_type: "video"
    }
  ]
};

const LEVEL_WEIGHTS: Record<string, number> = {
  "beginner": 1,
  "intermediate": 2,
  "advanced": 3
};

export function generateMockAiUpskilling(
  studentSkills: any[] | null | undefined,
  internshipSkills: any[] | null | undefined,
  internshipTitle: string
) {
  const sSkills = studentSkills || [];
  const reqSkills = internshipSkills || [];
  
  const missingSkills: string[] = [];
  const underLeveledSkills: string[] = [];
  const gapSkillNames: string[] = [];

  reqSkills.forEach((req: any) => {
    // Standardize resolving the skill name
    const skillName = req.name || req.skills?.name || `Skill #${req.skill_id}`;
    const skillNameLower = skillName.toLowerCase();
    const reqLevelStr = (req.level || "Intermediate").toLowerCase();
    const reqLevel = LEVEL_WEIGHTS[reqLevelStr] || 2;

    // Find student skill (matching either skill_id or name case-insensitively)
    const studentSkill = sSkills.find((s: any) => 
      Number(s.skill_id) === Number(req.skill_id) || 
      (s.name && s.name.toLowerCase() === skillNameLower)
    );

    if (!studentSkill) {
      missingSkills.push(skillName);
      gapSkillNames.push(skillNameLower);
    } else {
      const studentLevelStr = (studentSkill.level || "Intermediate").toLowerCase();
      const studentLevel = LEVEL_WEIGHTS[studentLevelStr] || 2;
      if (studentLevel < reqLevel) {
        underLeveledSkills.push(`${skillName} (${studentSkill.level} -> ต้องการ ${req.level})`);
        gapSkillNames.push(skillNameLower);
      }
    }
  });

  if (gapSkillNames.length === 0) {
    return {
      hasGaps: false,
      analysisText: `🎉 ยินดีด้วยครับ! ทักษะปัจจุบันของคุณตรงกับความต้องการของตำแหน่ง **${internshipTitle}** ครบถ้วน 100% แล้ว คุณมีความพร้อมเต็มที่สำหรับการยื่นสมัครงานนี้!`,
      recommendedCourses: []
    };
  }

  // Build friendly advice text in Thai
  let analysisText = `สวัสดีครับ! AI แนะแนวการเรียนรู้ได้วิเคราะห์ช่องว่างทักษะของคุณสำหรับตำแหน่ง **${internshipTitle}** เรียบร้อยแล้ว:\n\n`;
  
  if (missingSkills.length > 0) {
    analysisText += `📌 **ทักษะที่คุณยังไม่มีในโปรไฟล์**: ${missingSkills.join(", ")}\n`;
  }
  if (underLeveledSkills.length > 0) {
    analysisText += `📈 **ทักษะที่ต้องอัปเลเวลเพิ่มเติม**: ${underLeveledSkills.join(", ")}\n`;
  }

  const firstPriority = missingSkills[0] || underLeveledSkills[0]?.split(" ")[0] || "ทักษะหลัก";
  analysisText += `\n💡 **คำแนะนำหลัก**: แนะนำให้โฟกัสที่การพัฒนาทักษะ **${firstPriority}** เป็นอันดับแรกเนื่องจากเป็นหัวใจหลักของตำแหน่งนี้ โดยเราได้เตรียมคอร์สเรียนแนะแนวเพื่อช่วยปิดจุดอ่อนนี้ไว้ให้คุณแล้วทางขวามือครับ สู้ๆ ครับ! ✌️`;

  // Filter recommended resources
  const recommendedCourses: MockResource[] = [];
  gapSkillNames.forEach(name => {
    const resources = MOCK_RESOURCES[name] || [];
    recommendedCourses.push(...resources);
  });

  return {
    hasGaps: true,
    analysisText,
    recommendedCourses
  };
}
