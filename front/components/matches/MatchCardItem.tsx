import React from "react";
import { MapPin } from "lucide-react";

interface MatchCardItemProps {
  item: {
    id: number | string;
    title: string;
    company_name: string;
    location: string;
    internship_type: string;
    match_score: number;
    skills?: Array<{
      skill_id?: number;
      name?: string;
    }>;
  };
  onSelect: () => void;
}

export default function MatchCardItem({ item, onSelect }: MatchCardItemProps) {
  const { title, company_name, location, internship_type, match_score, skills } = item;

  const getMatchColor = (score: number) => {
    if (score >= 80) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (score >= 50) return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-600 border-slate-200";
  };

  return (
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
              {skills.slice(0, 3).map((s: any, idx: number) => (
                <span
                  key={s.skill_id || idx}
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
        วิเคราะห์คลิปสอน & คอร์สเสริม ➔
      </div>
    </div>
  );
}
