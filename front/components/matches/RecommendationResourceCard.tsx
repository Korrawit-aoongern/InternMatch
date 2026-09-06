import React from "react";
import { ExternalLink, Play, BookOpen } from "lucide-react";
import { SkillRecommendation } from "@/lib/actions/geminiRecommendations";

interface Props {
  resource: SkillRecommendation;
}

export default function RecommendationResourceCard({ resource }: Props) {
  const isVideo = resource.resource_type === "video";
  const platform = resource.platform?.toLowerCase() || "";

  const getPlatformStyle = () => {
    if (platform.includes("youtube")) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (platform.includes("udemy")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    if (platform.includes("coursera")) {
      return "bg-sky-50 text-sky-700 border-sky-200";
    }
    if (platform.includes("thaimooc") || platform.includes("futureskill")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  const getLevelBadge = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes("beginner")) return "bg-emerald-50 text-emerald-600 border-emerald-200";
    if (l.includes("intermediate")) return "bg-amber-50 text-amber-600 border-amber-200";
    return "bg-rose-50 text-rose-600 border-rose-200";
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs hover:border-blue-300 hover:shadow-sm transition-all space-y-2.5">
      {/* Card Header: Platform, Type, and Target Skill */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getPlatformStyle()}`}>
            {resource.platform}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
            {isVideo ? <Play className="w-2.5 h-2.5 text-red-500 fill-red-500" /> : <BookOpen className="w-2.5 h-2.5 text-blue-500" />}
            {isVideo ? "คลิปสอน" : "คอร์สเรียน"}
          </span>
          {resource.targetSkill && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              {resource.targetSkill}
            </span>
          )}
        </div>

        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getLevelBadge(resource.level)}`}>
          ระดับ {resource.level}
        </span>
      </div>

      {/* Title & Instructor */}
      <div>
        <h5 className="text-xs font-bold text-slate-800 line-clamp-2 hover:text-blue-600 leading-snug">
          {resource.title}
        </h5>
        <p className="text-[11px] text-slate-500 mt-0.5">
          ผู้สอน/ช่อง: <span className="font-semibold text-slate-700">{resource.author}</span>
        </p>
      </div>

      {/* Why Recommended / Reason */}
      {resource.reason && (
        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
          💡 <span className="font-medium">{resource.reason}</span>
        </p>
      )}

      {/* Action Footer */}
      <div className="flex justify-end pt-1">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-transparent text-[11px] font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          {isVideo ? "ดูคลิปสอน" : "เข้าสู่คอร์สเรียน"}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
