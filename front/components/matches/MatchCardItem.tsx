import React, { useState } from "react";
import { MapPin, X } from "lucide-react";

interface MatchCardItemProps {
  item: {
    id: number | string;
    title: string;
    company_name: string;
    company_id?: string;
    location: string;
    internship_type: string;
    match_score: number;
    skills?: Array<{
      skill_id?: number;
      name?: string;
    }>;
  };
  onSelect: () => void;
  onViewCompany?: (companyId: string, name: string) => void;
}

export default function MatchCardItem({ item, onSelect, onViewCompany }: MatchCardItemProps) {
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const { title, company_name, location, internship_type, match_score, skills } = item;

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
    <>
      <div
        onClick={onSelect}
        className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-600 hover:-translate-y-0.5"
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

          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-800 line-clamp-1 break-words break-all">{title}</h3>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if ((item as any).company_id && onViewCompany) onViewCompany((item as any).company_id, company_name);
              }}
              disabled={!(item as any).company_id || !onViewCompany}
              className={`text-xs font-semibold mt-0.5 truncate text-left max-w-full ${(item as any).company_id && onViewCompany ? "text-slate-500 hover:text-blue-600 hover:underline cursor-pointer" : "text-slate-500 cursor-default"}`}
              title={(item as any).company_id ? "ดูโปรไฟล์บริษัท" : undefined}
            >
              {company_name} {(item as any).company_id ? "↗" : ""}
            </button>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium truncate">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{location}</span>
            </p>
          </div>

          {skills && skills.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ทักษะต้องการ:</span>
              <div className="flex flex-wrap gap-1 items-center">
                {skills.slice(0, 3).map((s: any, idx: number) => (
                  <span
                    key={s.skill_id ?? `s-${idx}`}
                    className="text-[10px] font-semibold px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-md max-w-full"
                  >
                    <span className="truncate">{s.name}</span>
                  </span>
                ))}
                {skills.length > 3 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsSkillsModalOpen(true); }}
                    className="text-[10px] font-bold text-white bg-slate-800 hover:bg-slate-900 px-2 py-0.5 rounded-md cursor-pointer shrink-0"
                  >
                    ... +{skills.length - 3} more
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-blue-600 font-bold text-right pt-2.5 border-t border-slate-50">
          วิเคราะห์คลิปสอน & คอร์สเสริม ➔
        </div>
      </div>
      {isSkillsModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50" onClick={(e) => { e.stopPropagation(); setIsSkillsModalOpen(false); }}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[480px] max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-bold text-slate-800 truncate pr-2">{title} • ทักษะทั้งหมด ({skills?.length || 0})</h3>
              <button onClick={() => setIsSkillsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
              <div className="flex flex-wrap gap-1.5">
                {skills?.map((s: any, idx: number) => (
                  <span key={s.skill_id ?? `all-${idx}`} className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs break-words">{s.name}</span>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0"><button onClick={() => setIsSkillsModalOpen(false)} className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg cursor-pointer">ปิด</button></div>
          </div>
        </div>
      )}
    </>
  );
}
