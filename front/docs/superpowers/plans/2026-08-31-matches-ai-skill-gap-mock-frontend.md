# Matches Page & Mock AI Skill-Gap Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a dedicated Matches page (`/matches`) showing a list of matching internships sorted by match score. Clicking a card opens a modal displaying job details on the left, and a simulated 1.2s loading state followed by personalized Thai AI advice and recommended learning courses (with publishers/creators and platforms) on the right.

**Architecture:** Split the implementation into (1) a standalone, unit-tested mock analysis helper that compares skills and retrieves matching resources, (2) the `/matches` page layout structure, and (3) the `<MatchesInternshipDetailsModal>` pop-up component rendering the side-by-side layout and simulated loading state.

**Tech Stack:** Next.js (App Router), Tailwind CSS, Lucide React icons, Jest (testing).

---

### Task 1: Create Mock Analysis Utility and Unit Tests (TDD)

**Files:**
- Create: `lib/utils/mockAnalysis.ts`
- Create: `lib/utils/__tests__/mockAnalysis.test.ts`

- [ ] **Step 1: Write the failing tests**
  Create the test directory if it doesn't exist and write test suites asserting gap analysis and course matching logic:
  ```typescript
  // File: lib/utils/__tests__/mockAnalysis.test.ts
  import { generateMockAiUpskilling } from "../mockAnalysis";

  describe("generateMockAiUpskilling", () => {
    const studentSkills = [
      { skill_id: 1, level: "Beginner" }, // e.g. React
      { skill_id: 3, level: "Advanced" }  // e.g. CSS
    ];
    
    const internshipSkills = [
      { skill_id: 1, level: "Advanced", skills: { id: 1, name: "React" } },
      { skill_id: 2, level: "Intermediate", skills: { id: 2, name: "Node.js" } },
      { skill_id: 3, level: "Beginner", skills: { id: 3, name: "CSS" } }
    ];

    it("should correctly identify missing and under-leveled skills and match courses", () => {
      const result = generateMockAiUpskilling(studentSkills, internshipSkills, "Software Engineer");
      
      expect(result.hasGaps).toBe(true);
      expect(result.analysisText).toContain("React");
      expect(result.analysisText).toContain("Node.js");
      expect(result.recommendedCourses.length).toBeGreaterThan(0);
      
      // Check resource schema structure
      const course = result.recommendedCourses[0];
      expect(course).toHaveProperty("platform");
      expect(course).toHaveProperty("author");
      expect(course).toHaveProperty("url");
    });

    it("should return friendly success message and empty course list if no gaps exist", () => {
      const perfectStudentSkills = [
        { skill_id: 1, level: "Advanced" },
        { skill_id: 2, level: "Advanced" },
        { skill_id: 3, level: "Advanced" }
      ];
      const result = generateMockAiUpskilling(perfectStudentSkills, internshipSkills, "Software Engineer");
      
      expect(result.hasGaps).toBe(false);
      expect(result.analysisText).toContain("100%");
      expect(result.recommendedCourses.length).toBe(0);
    });
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**
  Run: `npm test lib/utils/__tests__/mockAnalysis.test.ts`
  Expected: FAIL (Cannot find module '../mockAnalysis' or similar)

- [ ] **Step 3: Write minimal implementation in `lib/utils/mockAnalysis.ts`**
  ```typescript
  // File: lib/utils/mockAnalysis.ts
  export interface MockResource {
    id: string;
    title: string;
    url: string;
    platform: "YouTube" | "Coursera" | "Udemy" | "Other";
    author: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    resource_type: "video" | "course";
  }

  export const MOCK_RESOURCES: Record<number, MockResource[]> = {
    1: [ // React
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
    2: [ // Node.js
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
    3: [ // TypeScript or others
      {
        id: "t1",
        title: "TypeScript Deep Dive & Best Practices",
        url: "https://www.udemy.com/course/mock_ts_1",
        platform: "Udemy",
        author: "Maximilian Schwarzmüller",
        level: "Intermediate",
        resource_type: "course"
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
    const gapSkillIds: number[] = [];

    reqSkills.forEach((req: any) => {
      const skillId = Number(req.skill_id);
      const skillName = req.skills?.name || req.name || `Skill #${skillId}`;
      const reqLevelStr = (req.level || "Intermediate").toLowerCase();
      const reqLevel = LEVEL_WEIGHTS[reqLevelStr] || 2;

      const studentSkill = sSkills.find((s: any) => Number(s.skill_id) === skillId);

      if (!studentSkill) {
        missingSkills.push(skillName);
        gapSkillIds.push(skillId);
      } else {
        const studentLevelStr = (studentSkill.level || "Intermediate").toLowerCase();
        const studentLevel = LEVEL_WEIGHTS[studentLevelStr] || 2;
        if (studentLevel < reqLevel) {
          underLeveledSkills.push(`${skillName} (${studentSkill.level} -> ต้องการ ${req.level})`);
          gapSkillIds.push(skillId);
        }
      }
    });

    if (gapSkillIds.length === 0) {
      return {
        hasGaps: false,
        analysisText: `🎉 ยินดีด้วยครับ! ทักษะปัจจุบันของคุณตรงกับความต้องการของตำแหน่ง ${internshipTitle} ครบถ้วน 100% แล้ว คุณมีความพร้อมเต็มที่สำหรับการยื่นสมัครงานนี้!`,
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
    gapSkillIds.forEach(id => {
      const resources = MOCK_RESOURCES[id] || [];
      recommendedCourses.push(...resources);
    });

    return {
      hasGaps: true,
      analysisText,
      recommendedCourses
    };
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**
  Run: `npm test lib/utils/__tests__/mockAnalysis.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  Run:
  ```bash
  git add lib/utils/mockAnalysis.ts lib/utils/__tests__/mockAnalysis.test.ts
  git commit -m "feat: add mock skill gap analysis utility and unit tests"
  ```

---

### Task 2: Implement `/matches` Route and Cards List UI

**Files:**
- Create: `app/matches/page.tsx`

- [ ] **Step 1: Scaffold page and fetch matching internships**
  Create the matches page, import sidebar/header layout, and query the internships:
  ```tsx
  // File: app/matches/page.tsx
  "use client";

  import React, { useState, useEffect, useMemo } from "react";
  import DashboardSidebar from "@/components/layout/DashboardSidebar";
  import DashboardHeader from "@/components/layout/DashboardHeader";
  import { getStudentInternships } from "@/lib/actions/internships";
  import { getStudentSkills } from "@/lib/actions/skills";
  import { Brain, MapPin, Briefcase } from "lucide-react";

  export default function MatchesPage() {
    const [internships, setInternships] = useState<any[]>([]);
    const [studentSkills, setStudentSkills] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedInternship, setSelectedInternship] = useState<any | null>(null);

    useEffect(() => {
      async function loadData() {
        setIsLoading(true);
        try {
          const [intRes, skillRes] = await Promise.all([
            getStudentInternships(),
            getStudentSkills()
          ]);
          if (intRes.success && intRes.internships) {
            setInternships(intRes.internships);
          }
          if (skillRes.success && skillRes.skills) {
            setStudentSkills(skillRes.skills);
          }
        } catch (err) {
          console.error("Failed to load matches data:", err);
        } finally {
          setIsLoading(false);
        }
      }
      loadData();
    }, []);

    const sortedMatches = useMemo(() => {
      // Return internships with match score >= 1, sorted descending
      return internships
        .filter(item => item.match_score > 0)
        .sort((a, b) => b.match_score - a.match_score);
    }, [internships]);

    return (
      <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col md:flex-row antialiased w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen w-full">
          <DashboardHeader title="Matches" />
          <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
                <Brain className="w-8 h-8 text-blue-600 fill-blue-50" />
                AI Matches & Upskilling
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                จับคู่ตำแหน่งฝึกงานตามโปรไฟล์ทักษะของคุณ พร้อมวิเคราะห์ช่องว่างทักษะและแนะนำวิดีโอ/คอร์สเรียนโดย AI
              </p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-12">
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
              </div>
            ) : sortedMatches.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-base font-semibold text-slate-700">ยังไม่พบตำแหน่งงานที่แมตช์</p>
                <p className="text-xs text-slate-400">ลองเพิ่มทักษะความชำนาญในเมนูการตั้งค่าโปรไฟล์ของคุณ</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedMatches.map((item) => (
                  <MatchCardItem
                    key={item.id}
                    item={item}
                    onSelect={() => setSelectedInternship(item)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Implement MatchCardItem sub-component**
  Add the subcomponent in `app/matches/page.tsx` displaying the cards with score badges and skills comparison:
  ```tsx
  // Add this inside app/matches/page.tsx
  function MatchCardItem({ item, onSelect }: { item: any; onSelect: () => void }) {
    const { title, company_name, location, internship_type, match_score, skills } = item;

    const getMatchColor = (score: number) => {
      if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
      if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
      return "bg-slate-50 text-slate-600 border-slate-200";
    };

    return (
      <div 
        onClick={onSelect}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-600 hover:-translate-y-0.5"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
              {internship_type}
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getMatchColor(match_score)}`}>
              {match_score}% Match
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800 line-clamp-1">{title}</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">{company_name}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
              <MapPin className="w-3.5 h-3.5" />
              {location}
            </p>
          </div>

          {skills && skills.length > 0 && (
            <div className="space-y-1 pt-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ทักษะสำคัญ:</span>
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 3).map((s: any) => (
                  <span key={s.skill_id} className="text-[9px] font-semibold px-1.5 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 rounded">
                    {s.name}
                  </span>
                ))}
                {skills.length > 3 && (
                  <span className="text-[9px] font-bold text-slate-400 px-1 py-0.5">+{skills.length - 3}</span>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="text-xs text-blue-600 font-bold text-right pt-2 border-t border-slate-50">
          วิเคราะห์แผนการเรียนรู้ ➔
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 3: Commit**
  Run:
  ```bash
  git add app/matches/page.tsx
  git commit -m "feat: scaffold matches page and match card item layout"
  ```

---

### Task 3: Implement Side-by-Side matches detail Popup Modal

**Files:**
- Modify: `app/matches/page.tsx`

- [ ] **Step 1: Add Modal structure and layout**
  Add state and `<MatchesInternshipDetailsModal>` import/definition inside `app/matches/page.tsx`:
  ```tsx
  // Add state to MatchesPage in app/matches/page.tsx:
  // After const [selectedInternship, setSelectedInternship] = useState<any | null>(null);
  // Add:
  // {selectedInternship && (
  //   <MatchesInternshipDetailsModal
  //     item={selectedInternship}
  //     studentSkills={studentSkills}
  //     onClose={() => setSelectedInternship(null)}
  //   />
  // )}
  ```

  Write the complete modal component below `MatchesPage`:
  ```tsx
  // File: app/matches/page.tsx
  import { X, ArrowRight, Play, BookOpen, AlertTriangle } from "lucide-react";
  import { generateMockAiUpskilling, MockResource } from "@/lib/utils/mockAnalysis";

  function MatchesInternshipDetailsModal({
    item,
    studentSkills,
    onClose
  }: {
    item: any;
    studentSkills: any[];
    onClose: () => void;
  }) {
    const { title, company_name, location, internship_type, description, responsibilities, skills, match_score } = item;
    
    const [aiLoading, setAiLoading] = useState(true);
    const [aiText, setAiText] = useState("");
    const [courses, setCourses] = useState<MockResource[]>([]);

    useEffect(() => {
      // Simulate 1.2s loading state
      setAiLoading(true);
      const timer = setTimeout(() => {
        const result = generateMockAiUpskilling(studentSkills, skills, title);
        setAiText(result.analysisText);
        setCourses(result.recommendedCourses);
        setAiLoading(false);
      }, 1200);
      return () => clearTimeout(timer);
    }, [item, studentSkills, skills, title]);

    const getMatchColor = (score: number) => {
      if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
      if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
      return "bg-slate-50 text-slate-600 border-slate-200";
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col md:flex-row overflow-hidden max-h-[90vh] md:max-h-[80vh] animation-bounce-in">
          
          {/* Left Column: Job Details */}
          <div className="flex-1.2 p-6 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto max-h-[45vh] md:max-h-full space-y-4 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{company_name}</p>
              </div>
              <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                {internship_type}
              </span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {location}
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${getMatchColor(match_score)}`}>
                {match_score}% Match
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายละเอียดงาน</h4>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {description || "ไม่มีข้อมูลรายละเอียดงาน"}
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">หน้าที่ความรับผิดชอบ</h4>
              <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {responsibilities || "ไม่มีข้อมูลความรับผิดชอบ"}
              </p>
            </div>

            <div className="space-y-1.5 pt-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เปรียบเทียบทักษะที่ต้องการ</h4>
              <div className="flex flex-col gap-2">
                {skills && skills.map((req: any) => {
                  const hasSkill = studentSkills.find((s: any) => Number(s.skill_id) === Number(req.skill_id));
                  const isUnderLeveled = hasSkill && LEVEL_WEIGHTS[hasSkill.level.toLowerCase()] < LEVEL_WEIGHTS[req.level.toLowerCase()];
                  return (
                    <div key={req.skill_id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700">{req.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">เกณฑ์: {req.level}</span>
                        {hasSkill ? (
                          isUnderLeveled ? (
                            <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                              <AlertTriangle className="w-3 h-3" />
                              ต้องการอัปเลเวล ({hasSkill.level})
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              ✓ มีทักษะนี้แล้ว ({hasSkill.level})
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100">
                            ✕ ยังไม่มีในโปรไฟล์
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm">
                สมัครงานตำแหน่งนี้
              </button>
            </div>
          </div>

          {/* Right Column: AI Upskilling Analysis */}
          <div className="flex-1 p-6 bg-slate-50/70 overflow-y-auto max-h-[45vh] md:max-h-full flex flex-col justify-between">
            <div className="hidden md:flex justify-end shrink-0">
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-start space-y-4">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                🤖 การประเมินผลทักษะส่วนบุคคล
              </div>

              {aiLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
                  <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                  <p className="text-[11px] font-semibold text-slate-500 animate-pulse">
                    กำลังวิเคราะห์ทักษะและเปรียบเทียบความต่าง...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI Advice Bubble */}
                  <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-2xl text-xs text-blue-900 whitespace-pre-wrap leading-relaxed">
                    {aiText}
                  </div>

                  {/* Course Suggestions */}
                  {courses.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        คอร์สเรียน & วิดีโอแนะนำเพื่อปรับระดับ:
                      </h4>
                      <div className="space-y-2">
                        {courses.map((course) => (
                          <div key={course.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="text-base flex-shrink-0">
                                {course.platform === "YouTube" ? "🎥" : "🎓"}
                              </span>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate">{course.title}</p>
                                <p className="text-[9.5px] text-slate-400 font-medium">
                                  {course.platform} ({course.author}) • ระดับ {course.level}
                                </p>
                              </div>
                            </div>
                            <a
                              href={course.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 text-slate-700 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1"
                            >
                              เรียนเลย <ArrowRight className="w-3 h-3" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4 mt-6 flex justify-end">
              <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 4: Verify UI loading state and modal popup manually**
  Start Next.js dev server: `npm run dev` and verify locally.

- [ ] **Step 5: Commit changes**
  Run:
  ```bash
  git add app/matches/page.tsx
  git commit -m "feat: implement side-by-side matches detail popup modal with loading spinner"
  ```
