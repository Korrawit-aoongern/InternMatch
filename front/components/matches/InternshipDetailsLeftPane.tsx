import React, { useState } from "react";
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
  const [expandedText, setExpandedText] = useState<null | "title" | "description" | "responsibilities">(null);

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  const isLong = (text: string, limit = 280) => (text || "").length > limit;
  const truncate = (text: string, limit = 280) => (text.length > limit ? text.slice(0, limit).trimEnd() + "…" : text);

  return (
    <>
      <div className="min-w-0 p-5 md:p-6 border-b md:border-b-0 md:border-r border-slate-200 space-y-4 bg-white flex flex-col overflow-y-auto overscroll-contain max-h-[90vh]">
      <div className="flex justify-between items-start sticky top-0 bg-white/95 backdrop-blur-xs py-1 z-10 gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-slate-800 break-words line-clamp-2">{title}</h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5 truncate">{company_name}</p>
          {isLong(title, 60) && (
            <button onClick={() => setExpandedText("title")} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 mt-1 cursor-pointer">ดูชื่อเต็ม...</button>
          )}
        </div>
        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg shrink-0 cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase break-all max-w-full">
          {internship_type}
        </span>
        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full max-w-full truncate">
          {location || "-"}
        </span>
        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${getMatchColor(match_score)}`}>
          {match_score}% Match
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">รายละเอียดงาน (Job Description)</h4>
          {isLong(description || "") && <button onClick={() => setExpandedText("description")} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer shrink-0">ดูเต็ม...</button>}
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed break-words break-all">
            {description ? (isLong(description) ? truncate(description) : description) : "ไม่มีข้อมูลรายละเอียดงาน"}
          </p>
          {isLong(description || "") && (
            <button onClick={() => setExpandedText("description")} className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-2 py-1 rounded-lg cursor-pointer">... อ่านเพิ่มเติม</button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">หน้าที่ความรับผิดชอบ (Responsibilities)</h4>
          {isLong(responsibilities || "") && <button onClick={() => setExpandedText("responsibilities")} className="text-[11px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer shrink-0">ดูเต็ม...</button>}
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed break-words break-all">
            {responsibilities ? (isLong(responsibilities) ? truncate(responsibilities) : responsibilities) : "ไม่มีข้อมูลหน้าที่ความรับผิดชอบ"}
          </p>
          {isLong(responsibilities || "") && (
            <button onClick={() => setExpandedText("responsibilities")} className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-blue-200 px-2 py-1 rounded-lg cursor-pointer">... อ่านเพิ่มเติม</button>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">เปรียบเทียบทักษะที่ต้องการ</h4>
          <span className="text-[11px] font-semibold text-slate-400">{skills?.length || 0} ทักษะ</span>
        </div>
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto overscroll-contain pr-1">
          {skills?.map((req: any) => {
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
      
      <div className="pt-2 shrink-0">
        <div className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          สมัครฝึกงานเรียบร้อยแล้ว
        </div>
      </div>
    </div>
      {/* Nested text expand modals - z-[70] outside scroll container to prevent clipping/flicker */}
      {expandedText && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setExpandedText(null); }}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[640px] max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-800">{expandedText === "description" ? "รายละเอียดงาน (เต็ม)" : expandedText === "responsibilities" ? "หน้าที่ความรับผิดชอบ (เต็ม)" : "ชื่อตำแหน่ง (เต็ม)"}</h3>
              <button onClick={() => setExpandedText(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer shrink-0"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed break-words break-all">
                {expandedText === "description" ? description : expandedText === "responsibilities" ? responsibilities : title}
              </p>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0"><button onClick={() => setExpandedText(null)} className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg cursor-pointer">ปิด</button></div>
          </div>
        </div>
      )}

    </>
  );
}
