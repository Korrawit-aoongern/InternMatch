"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  X, 
  Sparkles, 
  RefreshCw,
  Play,
  BookOpen,
  Loader2
} from "lucide-react";
import { 
  getAiSkillRecommendations, 
  SkillRecommendation,
  AiUpskillingResult
} from "@/lib/actions/geminiRecommendations";
import { generateMockAiUpskilling } from "@/lib/utils/mockAnalysis";
import RecommendationResourceCard from "./RecommendationResourceCard";
import InternshipDetailsLeftPane from "./InternshipDetailsLeftPane";

interface ModalProps {
  item: any;
  studentSkills: any[];
  onClose: () => void;
}

// Global in-memory cache to make reopening instant (0ms)
const globalAiCache = new Map<string, AiUpskillingResult>();

export default function MatchesInternshipDetailsModal({
  item,
  studentSkills,
  onClose,
}: ModalProps) {
  const { title, description, skills } = item;

  const [aiText, setAiText] = useState("");
  const [recommendations, setRecommendations] = useState<SkillRecommendation[]>([]);
  const [provider, setProvider] = useState<"gemini" | "fallback">("gemini");
  const [isGeminiRefining, setIsGeminiRefining] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "video" | "course">("all");

  const isMountedRef = useRef(true);

  const cacheKey = useMemo(() => {
    const skillsHash = (studentSkills || [])
      .map((s) => `${s.skill_id || s.id}_${s.level}`)
      .sort()
      .join(",");
    return `ai_upskill_${item.id}_${skillsHash}`;
  }, [item.id, studentSkills]);

  const loadAiRecommendations = async (forceRefresh = false) => {
    // 1. Check in-memory or sessionStorage cache
    if (!forceRefresh) {
      if (globalAiCache.has(cacheKey)) {
        const cached = globalAiCache.get(cacheKey)!;
        setAiText(cached.analysisText);
        setRecommendations(cached.recommendations);
        setProvider(cached.provider);
        setIsGeminiRefining(false);
        return;
      }
      try {
        const saved = sessionStorage.getItem(cacheKey);
        if (saved) {
          const parsed = JSON.parse(saved) as AiUpskillingResult;
          globalAiCache.set(cacheKey, parsed);
          setAiText(parsed.analysisText);
          setRecommendations(parsed.recommendations);
          setProvider(parsed.provider);
          setIsGeminiRefining(false);
          return;
        }
      } catch {
        // Ignore storage errors
      }
    }

    // 2. Instant UI: Render instant baseline recommendations immediately (0 ms)
    const instant = generateMockAiUpskilling(studentSkills, skills, title);
    setAiText(instant.analysisText);
    setRecommendations(
      instant.recommendedCourses.map((c) => ({
        id: c.id,
        title: c.title,
        url: c.url,
        platform: c.platform,
        author: c.author,
        level: c.level,
        resource_type: c.resource_type,
        targetSkill: "ทักษะที่เกี่ยวข้อง",
        reason: "หลักสูตรเบื้องต้นแนะนำสำหรับพัฒนาทักษะสู่ระดับที่ตลาดต้องการ",
      }))
    );
    setProvider("fallback");

    // If 100% matched, no background Gemini call needed
    if (!instant.hasGaps) {
      setIsGeminiRefining(false);
      return;
    }

    // 3. Background Gemini refinement
    setIsGeminiRefining(true);
    try {
      const res = await getAiSkillRecommendations(
        title,
        description,
        skills,
        studentSkills
      );
      if (isMountedRef.current && res.success) {
        setAiText(res.analysisText);
        setRecommendations(res.recommendations || []);
        setProvider(res.provider);
        globalAiCache.set(cacheKey, res);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(res));
        } catch {
          // Ignore storage quota errors
        }
      }
    } catch (err) {
      console.error("Gemini refinement failed:", err);
    } finally {
      if (isMountedRef.current) {
        setIsGeminiRefining(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    loadAiRecommendations();
    return () => {
      isMountedRef.current = false;
    };
  }, [cacheKey]);

  const filteredRecommendations = useMemo(() => {
    if (activeFilter === "all") return recommendations;
    return recommendations.filter((r) => r.resource_type === activeFilter);
  }, [recommendations, activeFilter]);

  const videoCount = useMemo(() => recommendations.filter((r) => r.resource_type === "video").length, [recommendations]);
  const courseCount = useMemo(() => recommendations.filter((r) => r.resource_type === "course").length, [recommendations]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 overflow-y-auto max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Side: General Internship Details & Skill Gaps */}
        <InternshipDetailsLeftPane
          item={item}
          studentSkills={studentSkills}
          onClose={onClose}
        />

        {/* Right Side: Gemini AI Analysis & Recommendations */}
        <div className="w-full min-w-0 p-5 md:p-6 bg-slate-50 flex flex-col justify-between space-y-4">
          <div className="hidden md:flex justify-between items-center mb-1 shrink-0 sticky top-0 bg-slate-50/95 backdrop-blur-xs py-1.5 z-10">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-100/70 border border-blue-200/80 px-2.5 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                <span>{provider === "gemini" ? "Google Gemini AI Upskill" : "Curated AI Recommendations"}</span>
              </span>
              {isGeminiRefining && (
                <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-semibold animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> กำลังเสริมความแม่นยำ...
                </span>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-start space-y-4">
            <div className="space-y-4">
              {/* AI Advice Bubble */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/40 border border-blue-100 p-4 rounded-2xl text-xs text-blue-950 whitespace-pre-wrap leading-relaxed shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-blue-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-blue-500 text-blue-500" />
                    คำแนะนำและ Roadmaps จาก AI
                  </span>
                  <button 
                    onClick={() => loadAiRecommendations(true)}
                    title="ขอคำแนะนำใหม่อีกครั้ง"
                    className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${isGeminiRefining ? "animate-spin" : ""}`} /> วิเคราะห์ใหม่
                  </button>
                </div>
                {aiText}
              </div>

              {/* Filter Tabs & Recommendations */}
              {recommendations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      แหล่งเรียนรู้ที่แนะนำ ({recommendations.length})
                    </h4>
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                      <button
                        onClick={() => setActiveFilter("all")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          activeFilter === "all" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        ทั้งหมด ({recommendations.length})
                      </button>
                      <button
                        onClick={() => setActiveFilter("video")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                          activeFilter === "video" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        <Play className="w-2.5 h-2.5" /> คลิปสอน ({videoCount})
                      </button>
                      <button
                        onClick={() => setActiveFilter("course")}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1 ${
                          activeFilter === "course" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        <BookOpen className="w-2.5 h-2.5" /> คอร์สเสริม ({courseCount})
                      </button>
                    </div>
                  </div>

                  {/* Resources List */}
                  <div className="space-y-3">
                    {filteredRecommendations.map((resource) => (
                      <RecommendationResourceCard
                        key={resource.id}
                        resource={resource}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
