"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { getStudentInternships } from "@/lib/actions/internships";
import { getStudentSkills } from "@/lib/actions/skills";
import { generateMockAiUpskilling, MockResource } from "@/lib/utils/mockAnalysis";
import { 
  Brain, 
  MapPin, 
  Briefcase, 
  X, 
  ArrowRight, 
  AlertTriangle,
  Play, 
  BookOpen, 
  CheckCircle,
  ExternalLink
} from "lucide-react";

const LEVEL_WEIGHTS: Record<string, number> = {
  "beginner": 1,
  "intermediate": 2,
  "advanced": 3
};

export default function MatchesPage() {
  const [internships, setInternships] = useState<any[]>([]);
  const [studentSkills, setStudentSkills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInternship, setSelectedInternship] = useState<any | null>(null);

  const fetchMatchesData = async () => {
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
  };

  useEffect(() => {
    fetchMatchesData();
  }, []);

  const sortedMatches = useMemo(() => {
    // Show only jobs that have some match (> 0) sorted descending
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
          
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2.5">
                <Brain className="w-8 h-8 text-blue-600 fill-blue-50" />
                AI Matches & Upskilling
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                จับคู่ตำแหน่งฝึกงานตามโปรไฟล์ทักษะของคุณ พร้อมวิเคราะห์ช่องว่างทักษะและแนะนำคอร์สเรียนจำลองเพื่อปิดจุดอ่อน
              </p>
            </div>
          </div>

          {/* Cards Grid */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {sortedMatches.map((item) => (
                <MatchCardItem
                  key={item.id}
                  item={item}
                  onSelect={() => setSelectedInternship(item)}
                />
              ))}
            </div>
          )}

          {/* Modal Pop-card Popup */}
          {selectedInternship && (
            <MatchesInternshipDetailsModal
              item={selectedInternship}
              studentSkills={studentSkills}
              onClose={() => setSelectedInternship(null)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

/* Card Component for Matches List */
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
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            {location}
          </p>
        </div>

        {skills && skills.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ทักษะต้องการ:</span>
            <div className="flex flex-wrap gap-1">
              {skills.slice(0, 3).map((s: any) => (
                <span 
                  key={s.skill_id} 
                  className="text-[10px] font-semibold px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-md"
                >
                  {s.name}
                </span>
              ))}
              {skills.length > 3 && (
                <span className="text-[10px] font-bold text-slate-400 px-1 py-0.5">+{skills.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="text-xs text-blue-600 font-bold text-right pt-2.5 border-t border-slate-50">
        วิเคราะห์แผนการเรียนรู้ ➔
      </div>
    </div>
  );
}

/* Modal Popup Component */
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
    setAiLoading(true);
    // Simulate 1.2 seconds of AI computation time
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
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col md:flex-row overflow-hidden max-h-[90vh] md:max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Side: General Internship Details */}
        <div className="flex-1.2 p-6 border-b md:border-b-0 md:border-r border-slate-200 overflow-y-auto max-h-[40vh] md:max-h-full space-y-5 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{title}</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">{company_name}</p>
            </div>
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
              {internship_type}
            </span>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {location}
            </span>
            <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${getMatchColor(match_score)}`}>
              {match_score}% Match
            </span>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายละเอียดงาน (Job Description)</h4>
            <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {description || "ไม่มีข้อมูลรายละเอียดงาน"}
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">หน้าที่ความรับผิดชอบ (Responsibilities)</h4>
            <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {responsibilities || "ไม่มีข้อมูลหน้าที่ความรับผิดชอบ"}
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เปรียบเทียบทักษะที่ต้องการ</h4>
            <div className="flex flex-col gap-2">
              {skills && skills.map((req: any) => {
                // Find matching skill in profile
                const studentSkill = studentSkills.find((s: any) => 
                  Number(s.skill_id) === Number(req.skill_id) || 
                  (s.name && s.name.toLowerCase() === req.name.toLowerCase())
                );
                
                const reqLevelStr = req.level.toLowerCase();
                const studentLevelStr = studentSkill ? studentSkill.level.toLowerCase() : "";
                const isUnderLeveled = studentSkill && LEVEL_WEIGHTS[studentLevelStr] < LEVEL_WEIGHTS[reqLevelStr];

                return (
                  <div key={req.skill_id} className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-150 text-xs">
                    <span className="font-semibold text-slate-700">{req.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">เกณฑ์งาน: {req.level}</span>
                      {studentSkill ? (
                        isUnderLeveled ? (
                          <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            ต้องการอัปเลเวล ({studentSkill.level})
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-250 font-semibold">
                            ✓ ผ่านเกณฑ์ ({studentSkill.level})
                          </span>
                        )
                      ) : (
                        <span className="text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-semibold">
                          ✕ ขาดทักษะนี้
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="pt-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-sm">
              สมัครฝึกงานตำแหน่งนี้
            </button>
          </div>
        </div>

        {/* Right Side: AI Skill Gap Analysis */}
        <div className="flex-1 p-6 bg-slate-50 overflow-y-auto max-h-[45vh] md:max-h-full flex flex-col justify-between">
          <div className="hidden md:flex justify-end shrink-0">
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-start space-y-4 md:mt-2">
            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              🤖 บทวิเคราะห์สกิลของคุณโดย AI
            </div>

            {aiLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 space-y-3">
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                <p className="text-[11px] font-semibold text-slate-500 animate-pulse">
                  กำลังให้ AI วิเคราะห์ช่องว่างทักษะ...
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* AI Advice Bubble */}
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs text-blue-900 whitespace-pre-wrap leading-relaxed font-medium">
                  {aiText}
                </div>

                {/* Recommended courses list */}
                {courses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      วิดีโอ & คอร์สเรียนเพื่อพัฒนาช่องว่างทักษะ:
                    </h4>
                    <div className="space-y-2.5">
                      {courses.map((course) => (
                        <div key={course.id} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className="text-lg flex-shrink-0">
                              {course.platform === "YouTube" ? "🎥" : "🎓"}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{course.title}</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                {course.platform} • ผู้สอน/ช่อง: <span className="text-slate-600 font-semibold">{course.author}</span> • ระดับ {course.level}
                              </p>
                            </div>
                          </div>
                          <a
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-200 text-slate-700 text-[10px] font-bold py-1.5 px-3 rounded-lg transition-all flex items-center gap-1"
                          >
                            เรียนเลย <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-4 mt-6 flex justify-end shrink-0">
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-xs font-bold px-4 py-2 rounded-lg transition-colors">
              ปิดหน้าต่าง
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
