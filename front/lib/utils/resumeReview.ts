export interface CategoryScore {
  name: string;
  weight: number; // percentage e.g. 45
  score: number;  // score out of 100 for this category
  strengths: string[];
  weaknesses: string[];
}

export interface ActionVerbSuggestion {
  original: string;
  improved: string;
  reason: string;
}

export interface ResumeReviewResult {
  hasResume: boolean;
  totalScore: number;
  readinessLevel: string; // e.g. "พร้อมสมัครงานทันที", "ต้องปรับปรุงบางจุด", "ต้องแก้ไขใหม่"
  readinessColor: string;
  headline: string;
  categories: CategoryScore[];
  strengths: string[];
  criticalImprovements: string[]; // Top 3
  actionVerbSuggestions: ActionVerbSuggestion[];
}

export function calculateResumeReview(studentProfile: any, skills: any[]): ResumeReviewResult {
  const hasResumeFile = Boolean(studentProfile?.resume_path || studentProfile?.resume_url);
  const skillCount = skills.length;
  const hasUniversity = Boolean(studentProfile?.university);
  const hasMajor = Boolean(studentProfile?.major);
  const hasGithub = Boolean(studentProfile?.github_url);
  const hasLinkedin = Boolean(studentProfile?.linkedin_url);
  const hasPhone = Boolean(studentProfile?.phone);

  // 1. Technical Projects & Code Portfolios (45%)
  let projScore = 60;
  const projStrengths: string[] = [];
  const projWeaknesses: string[] = [];

  if (hasGithub) {
    projScore += 25;
    projStrengths.push("มีลิงก์ GitHub / Code Repository ที่เข้าถึงได้จริง");
  } else {
    projWeaknesses.push("ขาดลิงก์ GitHub หรือ Live Demo Project ที่เข้าถึงได้");
  }
  if (skillCount >= 3) {
    projScore += 15;
    projStrengths.push("ระบุ Tech Stack ในโปรเจกต์ชัดเจน");
  } else {
    projWeaknesses.push("ควรเขียนผลงานในรูปแบบ Action + Context + Result (มีตัวเลขเชิงปริมาณวัดผล)");
  }
  projScore = Math.min(100, projScore);

  // 2. Technical Skills & Categorization (25%)
  let skillScore = 50;
  const skillStrengths: string[] = [];
  const skillWeaknesses: string[] = [];

  if (skillCount >= 5) {
    skillScore += 40;
    skillStrengths.push(`มีการเพิ่มทักษะความเชี่ยวชาญถึง ${skillCount} รายการ`);
  } else if (skillCount >= 2) {
    skillScore += 25;
    skillStrengths.push(`ระบุทักษะความเชี่ยวชาญเบื้องต้น (${skillCount} รายการ)`);
    skillWeaknesses.push("ควรจัดหมวดหมู่ทักษะให้ชัดเจน (Languages, Frameworks, Databases, Tools)");
  } else {
    skillWeaknesses.push("ขาดการจัดหมวดหมู่ทักษะอย่างเป็นระบบสำหรับสายงาน SE");
  }
  skillStrengths.push("หลีกเลี่ยงการใช้ Progress Bar หรือ Percentage (%) ที่ไม่มีมาตรฐานวัดผล");
  skillScore = Math.min(100, skillScore);

  // 3. Education & Relevant Coursework (15%)
  let eduScore = 40;
  const eduStrengths: string[] = [];
  const eduWeaknesses: string[] = [];

  if (hasUniversity && hasMajor) {
    eduScore += 40;
    eduStrengths.push(`ระบุข้อมูลการศึกษา (${studentProfile.university} - ${studentProfile.major}) ชัดเจน`);
  } else {
    eduWeaknesses.push("ยังไม่ระบุมหาวิทยาลัย, สาขา หรือปีที่คาดว่าจะจบ (Expected Graduation)");
  }
  if (hasMajor) {
    eduScore += 20;
    eduStrengths.push("มีสายวิชาตรงกับความต้องการของสายงาน");
  } else {
    eduWeaknesses.push("ควรระบุวิชาสำคัญ (Relevant Coursework) เช่น DSA, OOP, Software Architecture");
  }
  eduScore = Math.min(100, eduScore);

  // 4. Contact Info & Developer Links (10%)
  let contactScore = 40;
  const contactStrengths: string[] = [];
  const contactWeaknesses: string[] = [];

  if (hasPhone) {
    contactScore += 20;
    contactStrengths.push("มีข้อมูลช่องทางการติดต่อเบื้องต้น (Email, Phone)");
  } else {
    contactWeaknesses.push("ระบุข้อมูลการติดต่อ (Phone/Email) ไม่ครบถ้วน");
  }
  if (hasGithub || hasLinkedin) {
    contactScore += 40;
    contactStrengths.push("มี Developer Links (GitHub/LinkedIn) พร้อมใช้งาน");
  } else {
    contactWeaknesses.push("ขาดลิงก์ Developer Profiles (LinkedIn / GitHub / Portfolio)");
  }
  contactScore = Math.min(100, contactScore);

  // 5. Extracurricular, Soft Skills & Hackathons (5%)
  let extraScore = 60;
  const extraStrengths: string[] = [
    "มีความสนใจในการพัฒนาตนเองและกิจกรรมเสริม",
  ];
  const extraWeaknesses: string[] = [
    "ควรเพิ่มกิจกรรมแข่งขัน (Hackathon), Open Source Contribution หรือ Soft Skills การทำงานร่วมกัน",
  ];

  // Calculated Weighted Score
  const totalWeightedScore = Math.round(
    (projScore * 0.45) +
    (skillScore * 0.25) +
    (eduScore * 0.15) +
    (contactScore * 0.10) +
    (extraScore * 0.05)
  );

  // Apply baseline file presence penalty if no resume file at all
  const finalScore = hasResumeFile ? totalWeightedScore : Math.min(totalWeightedScore, 45);

  let readinessLevel = "ต้องแก้ไขใหม่";
  let readinessColor = "bg-rose-100 text-rose-700 border-rose-200";
  let headline = "ต้องปรับปรุงและแก้ไข Resume ด่วน!";

  if (finalScore >= 80) {
    readinessLevel = "พร้อมสมัครงานทันที";
    readinessColor = "bg-emerald-100 text-emerald-700 border-emerald-200";
    headline = "Resume มีความพร้อมดีเยี่ยมสำหรับสายงาน SE!";
  } else if (finalScore >= 60) {
    readinessLevel = "ต้องปรับปรุงบางจุด";
    readinessColor = "bg-amber-100 text-amber-700 border-amber-200";
    headline = "Resume น่าสนใจ แต่ยังมีบางหมวดที่เพิ่มมูลค่าได้อีก!";
  }

  const categories: CategoryScore[] = [
    {
      name: "1. Technical Projects & Code Portfolios",
      weight: 45,
      score: projScore,
      strengths: projStrengths,
      weaknesses: projWeaknesses,
    },
    {
      name: "2. Technical Skills & Categorization",
      weight: 25,
      score: skillScore,
      strengths: skillStrengths,
      weaknesses: skillWeaknesses,
    },
    {
      name: "3. Education & Relevant Coursework",
      weight: 15,
      score: eduScore,
      strengths: eduStrengths,
      weaknesses: eduWeaknesses,
    },
    {
      name: "4. Contact Info & Developer Links",
      weight: 10,
      score: contactScore,
      strengths: contactStrengths,
      weaknesses: contactWeaknesses,
    },
    {
      name: "5. Extracurricular, Soft Skills & Hackathons",
      weight: 5,
      score: extraScore,
      strengths: extraStrengths,
      weaknesses: extraWeaknesses,
    },
  ];

  // Strengths
  const allStrengths = categories.flatMap(c => c.strengths);
  if (!hasResumeFile) {
    allStrengths.push("โปรไฟล์ระบบถูกตั้งค่าพื้นฐานแล้ว");
  }

  // Top 3 Critical Improvements
  const criticalImprovements: string[] = [];
  if (!hasResumeFile) {
    criticalImprovements.push("อัปโหลดไฟล์ Resume (PDF) เข้าสู่ระบบ");
  }
  if (!hasGithub) {
    criticalImprovements.push("เพิ่มลิงก์ GitHub Repository หรือ Live Demo สำหรับผลงานหลัก");
  }
  criticalImprovements.push("ปรับเปลี่ยนรายละเอียดโปรเจกต์ให้เป็นรูปแบบ Action + Context + Result (ระบุตัวเลขวัดผล)");
  if (!hasUniversity || !hasMajor) {
    criticalImprovements.push("ระบุมหาวิทยาลัย สาขา และ Expected Graduation Date ให้ครบถ้วน");
  }

  // Professional Rewording / Action Verbs
  const actionVerbSuggestions: ActionVerbSuggestion[] = [
    {
      original: "Worked on website frontend using React",
      improved: "Engineered responsive web applications using React and Tailwind CSS, reducing page render latency by 35%",
      reason: "ใช้ Action Verb 'Engineered' พร้อมใส่ผลลัพธ์เชิงตัวเลขวัดผลได้",
    },
    {
      original: "Made backend API with Node.js and MongoDB",
      improved: "Architected RESTful APIs with Node.js & MongoDB, handling asynchronous payload processing for 10k+ requests",
      reason: "เน้นสถาปัตยกรรม (Architected) และ Scale ความสามารถของระบบ",
    },
    {
      original: "Fixed bugs and added new features in group project",
      improved: "Collaborated in an Agile team of 4 to refactor legacy codebase and optimize database queries",
      reason: "สะท้อนทักษะ Teamwork (Agile) และกระบวนการ Refactor เชิงเทคนิค",
    },
  ];

  return {
    hasResume: hasResumeFile,
    totalScore: finalScore,
    readinessLevel,
    readinessColor,
    headline,
    categories,
    strengths: allStrengths.slice(0, 4),
    criticalImprovements: criticalImprovements.slice(0, 3),
    actionVerbSuggestions,
  };
}
