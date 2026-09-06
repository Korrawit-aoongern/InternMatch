"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { getStudentInternships } from "@/lib/actions/internships";
import { getStudentSkills } from "@/lib/actions/skills";
import MatchCardItem from "@/components/matches/MatchCardItem";
import MatchesInternshipDetailsModal from "@/components/matches/MatchesInternshipDetailsModal";
import { Brain, Briefcase, Sparkles } from "lucide-react";

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
    // Show only jobs that have some match (> 0) and the student has applied to
    return internships
      .filter((item) => item.match_score > 0 && item.has_applied)
      .sort((a, b) => b.match_score - a.match_score);
  }, [internships]);

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col md:flex-row antialiased w-full">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen w-full">
        <DashboardHeader title="AI Upskill" />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          
          {/* Page Heading */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2.5">
                  <Brain className="w-8 h-8 text-blue-600 fill-blue-50" />
                  AI Upskill & แนะนำการเรียนรู้
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-blue-600 fill-blue-600" />
                  Powered by Gemini
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                วิเคราะห์ช่องว่างทักษะ พร้อมแนะนำคลิปสอน YouTube และคอร์สออนไลน์เสริมด้วย Google Gemini AI
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
              <p className="text-base font-semibold text-slate-700">ยังไม่มีการฝึกงานที่คุณสมัครในระบบ</p>
              <p className="text-xs text-slate-400">เมื่อคุณสมัครงาน ระบบจะแสดงคำวิเคราะห์แผนการเรียนรู้ที่นี่</p>
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
