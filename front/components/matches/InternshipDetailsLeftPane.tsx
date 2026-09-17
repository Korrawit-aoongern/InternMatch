import React from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";

interface LeftPaneProps {
  item: any;
  studentSkills: any[];
  onClose: () => void;
}

const LEVEL_WEIGHTS: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

export default function InternshipDetailsLeftPane({
  item,
  studentSkills,
  onClose,
}: LeftPaneProps) {
  const { title, company_name, location, internship_type, description, responsibilities, skills, match_score } = item;

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <div className="min-w-0 p-5 md:p-6 border-b md:border-b-0 md:border-r border-slate-200 space-y-4 bg-white  flex-col justify-between">
      <div className="flex justify-between items-start sticky top-0 bg-white/95 backdrop-blur-xs py-1 z-10">
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

      <div className="space-y-1">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายละเอียดงาน (Job Description)</h4>
        <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
          {description || "ไม่มีข้อมูลรายละเอียดงาน"}
        </p>
      </div>

      <div className="space-y-1">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">หน้าที่ความรับผิดชอบ (Responsibilities)</h4>
        <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
          {responsibilities || "ไม่มีข้อมูลหน้าที่ความรับผิดชอบ"}
        </p>
      </div>

      <div className="space-y-2 pt-1">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เปรียบเทียบทักษะที่ต้องการ</h4>
        <div className="flex flex-col gap-2">
          {skills && skills.map((req: any) => {
            const reqName = req.name || req.skills?.name || `Skill #${req.skill_id}`;
            const studentSkill = studentSkills.find((s: any) => {
              const sName = s.name || s.skills?.name || "";
              return Number(s.skill_id) === Number(req.skill_id) || (sName && sName.toLowerCase() === reqName.toLowerCase());
            });
            
            const reqLevelStr = (req.level || "Intermediate").toLowerCase();
            const studentLevelStr = studentSkill ? (studentSkill.level || "").toLowerCase() : "";
            const isUnderLeveled = studentSkill && (LEVEL_WEIGHTS[studentLevelStr] || 0) < (LEVEL_WEIGHTS[reqLevelStr] || 2);

            return (
              <div key={req.skill_id || reqName} className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-150 text-xs">
                <span className="font-semibold text-slate-700">{reqName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">เกณฑ์: {req.level}</span>
                  {studentSkill ? (
                    isUnderLeveled ? (
                      <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        ต้องการอัปเกรด ({studentSkill.level})
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
        <div className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          สมัครฝึกงานเรียบร้อยแล้ว
        </div>
      </div>
    </div>
  );
}
