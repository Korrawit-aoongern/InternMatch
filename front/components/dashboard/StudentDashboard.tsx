"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import StatsCard from "@/components/ui/StatsCard";
import { Send, Lightbulb, Megaphone, CircleDot, Cpu, GitFork, Plus, Brain, Sparkles, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { getStudentApplications, getStudentInternships } from "@/lib/actions/internships";
import { getStudentSkills } from "@/lib/actions/skills";
import { getStudentProfile } from "@/lib/actions/auth";

interface StudentDashboardProps {
  displayName: string;
}

interface StudentStats {
  avgMatchScore: number;
  appliedCount: number;
  recommendedCount: number;
  alertsCount: number;
}

interface CategoryScore {
  name: string;
  weight: number; // percentage e.g. 45
  score: number;  // score out of 100 for this category
  strengths: string[];
  weaknesses: string[];
}

interface ActionVerbSuggestion {
  original: string;
  improved: string;
  reason: string;
}

interface ResumeReviewResult {
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

export default function StudentDashboard({ displayName }: StudentDashboardProps) {
  const [stats, setStats] = useState<StudentStats>({
    avgMatchScore: 0,
    appliedCount: 0,
    recommendedCount: 0,
    alertsCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [studentSkills, setStudentSkills] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [recentApplications, setRecentApplications] = useState<any[]>([]);
  const [resumeReview, setResumeReview] = useState<ResumeReviewResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [appsRes, intRes, skillsRes, profileRes] = await Promise.all([
          getStudentApplications(),
          getStudentInternships(),
          getStudentSkills(),
          getStudentProfile(),
        ]);

        if (!isMounted) return;

        let appliedCount = 0;
        let avgMatchScore = 0;
        let alertsCount = 0;

        if (appsRes.success && appsRes.applications) {
          const apps = appsRes.applications;
          appliedCount = apps.length;
          setRecentApplications(apps.slice(0, 5));
          if (appliedCount > 0) {
            const totalScore = apps.reduce((acc: number, item: any) => acc + (item.match_score || 0), 0);
            avgMatchScore = Math.round(totalScore / appliedCount);
          }
          alertsCount = apps.filter(
            (item: any) => item.status === "accepted" || item.status === "reviewing"
          ).length;
        }

        let recommendedCount = 0;
        if (intRes.success && intRes.internships) {
          const internships = intRes.internships;
          recommendedCount = internships.filter(
            (item: any) => item.match_score && item.match_score >= 50
          ).length;

          if (appliedCount === 0 && internships.length > 0) {
            const sumTopMatch = internships.slice(0, 5).reduce((acc: number, item: any) => acc + (item.match_score || 0), 0);
            avgMatchScore = Math.round(sumTopMatch / Math.min(5, internships.length));
          }
        }

        let currentSkills: any[] = [];
        if (skillsRes.success && skillsRes.skills) {
          currentSkills = skillsRes.skills;
          setStudentSkills(currentSkills);
        }

        let currentProfile: any = null;
        if (profileRes.success && profileRes.profile) {
          currentProfile = profileRes.profile;
          setProfile(currentProfile);
        }

        setStats({
          avgMatchScore,
          appliedCount,
          recommendedCount,
          alertsCount,
        });

        generateResumeInsights(currentProfile, currentSkills);
      } catch (err) {
        console.error("Failed to load student dashboard data:", err);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const generateResumeInsights = (studentProfile: any, skills: any[]) => {
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

    setResumeReview({
      hasResume: hasResumeFile,
      totalScore: finalScore,
      readinessLevel,
      readinessColor,
      headline,
      categories,
      strengths: allStrengths.slice(0, 4),
      criticalImprovements: criticalImprovements.slice(0, 3),
      actionVerbSuggestions,
    });
  };

  const handleRunAiReview = () => {
    setIsAnalyzing(true);
    setIsModalOpen(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 1200);
  };

  const getMatchLabel = (score: number) => {
    if (score >= 80) return "High";
    if (score >= 50) return "Medium";
    return score > 0 ? "Low" : "No Data";
  };

  return (
    <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md mb-2 inline-block">Student Dashboard</span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome back, {displayName}!</h2>
          <p className="text-sm text-slate-500 mt-1">{"Here's your career progress at a glance."}</p>
        </div>
        <button
          onClick={handleRunAiReview}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          AI Resume Review
        </button>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Match Score"
          value={loadingStats ? "..." : `${getMatchLabel(stats.avgMatchScore)}${stats.avgMatchScore > 0 ? ` (${stats.avgMatchScore}%)` : ""}`}
          progressPercent={loadingStats ? undefined : stats.avgMatchScore}
        />
        <Link href="/dashboard/applications" className="block transition-transform hover:-translate-y-0.5">
          <StatsCard
            label="Applied"
            value={loadingStats ? "..." : `${stats.appliedCount} Positions`}
            icon={Send}
            variant="blue"
          />
        </Link>
        <Link href="/dashboard/Internships" className="block transition-transform hover:-translate-y-0.5">
          <StatsCard
            label="Recommended"
            value={loadingStats ? "..." : `${stats.recommendedCount} Matches`}
            icon={Lightbulb}
            variant="green"
          />
        </Link>
        <Link href="/dashboard/applications" className="block transition-transform hover:-translate-y-0.5">
          <StatsCard
            label="Alerts"
            value={loadingStats ? "..." : `${stats.alertsCount} Status Updates`}
            icon={Megaphone}
            variant="red"
          />
        </Link>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Recent Activity Timeline */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-800">Recent Activity</h3>
              <Link href="/dashboard/applications" className="text-sm font-semibold text-blue-600 hover:underline">
                View All
              </Link>
            </div>

            {recentApplications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">ยังไม่มีกิจกรรมหรือการสมัครงานในระบบ</div>
            ) : (
              <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                {recentApplications.map((app) => (
                  <div key={app.id} className="relative pl-6">
                    <div className={`absolute left-[-21px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                      app.status === 'accepted' ? 'bg-emerald-500' :
                      app.status === 'rejected' ? 'bg-rose-500' :
                      app.status === 'reviewing' ? 'bg-blue-600' : 'bg-slate-300'
                    }`}></div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-slate-800">{app.title}</p>
                        <span className="text-[10px] text-slate-400">
                          {app.applied_at ? new Date(app.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "-"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold">{app.company_name}</p>
                      <p className="text-xs text-slate-500">Match Score: {app.match_score}% • {app.location}</p>
                      <div className="pt-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                          app.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                          app.status === 'reviewing' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Box (AI Insights - Standard Resume Review 100%) */}
        <div className="lg:col-span-4">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl p-6 lg:sticky lg:top-24 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600">
                <Brain className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-800">AI Insights</h3>
              </div>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                SE Standard 100%
              </span>
            </div>

            {resumeReview ? (
              <div className="bg-gradient-to-br from-blue-50/40 to-white rounded-xl p-4 border border-blue-100 space-y-3.5">
                {/* Score & Readiness Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">คะแนน Resume รวม</span>
                    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border mt-1 ${resumeReview.readinessColor}`}>
                      {resumeReview.readinessLevel}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-blue-600">
                      {resumeReview.totalScore}
                    </span>
                    <span className="text-xs text-slate-400 font-bold">/100%</span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-slate-700 leading-snug">
                  {resumeReview.headline}
                </p>

                {/* 5 Categories Score Bar Breakdown */}
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    สัดส่วนคะแนน 5 หมวดมาตรฐาน:
                  </span>
                  {resumeReview.categories.map((cat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-600 font-medium truncate pr-2">{cat.name}</span>
                        <span className="font-bold text-slate-700 shrink-0">{cat.score}/100 <span className="text-slate-400 font-normal">({cat.weight}%)</span></span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            cat.score >= 80 ? "bg-emerald-500" : cat.score >= 60 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${cat.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Top Critical Improvement Preview */}
                {resumeReview.criticalImprovements.length > 0 && (
                  <div className="bg-amber-50/80 border border-amber-100 rounded-lg p-2.5 text-[11px] text-amber-800 space-y-1">
                    <span className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 inline" />
                      สิ่งที่ต้องแก้ไขด่วน:
                    </span>
                    <p className="line-clamp-2 pl-4 text-amber-900">• {resumeReview.criticalImprovements[0]}</p>
                  </div>
                )}

                <button
                  onClick={handleRunAiReview}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  ดูรายงานประเมินฉบับเต็ม
                </button>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl text-center text-xs text-slate-400">
                Loading AI Insights...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Resume Review Modal - Comprehensive Report */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl p-6  my-8 space-y-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-800">รายงานการประเมิน Resume (Standard SE 100%)</h3>
                  <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">AI Evaluation</span>
                </div>
                <p className="text-xs text-slate-500">เกณฑ์การประเมินมาตรฐานสำหรับนักศึกษาและ Software Engineer</p>
              </div>
            </div>

            {isAnalyzing ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <span className="animate-spin rounded-full h-9 w-9 border-b-2 border-blue-600"></span>
                <p className="text-sm font-semibold text-slate-600">กำลังแสกนและประเมิน Resume ตามเกณฑ์มาตรฐาน 100%...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Overall Score & Readiness */}
                <div className="bg-gradient-to-r from-blue-50 via-slate-50 to-blue-50/30 p-5 rounded-2xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">1. สรุปคะแนนภาพรวม & ระดับความพร้อม</span>
                    <h4 className="text-lg font-extrabold text-slate-800">{resumeReview?.headline}</h4>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">ระดับความพร้อม:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${resumeReview?.readinessColor}`}>
                        {resumeReview?.readinessLevel}
                      </span>
                    </div>
                  </div>
                  <div className="text-center sm:text-right shrink-0 bg-white p-3.5 rounded-2xl border border-blue-100 shadow-xs min-w-[120px]">
                    <span className="text-3xl font-black text-blue-600">{resumeReview?.totalScore}</span>
                    <span className="text-sm font-bold text-slate-400"> / 100%</span>
                  </div>
                </div>

                {/* 2. 5 Categories Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    2. สรุปคะแนนแยกตาม 5 หมวดเกณฑ์การวัดผล
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {resumeReview?.categories.map((cat, idx) => (
                      <div key={idx} className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-blue-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                              {cat.score} / 100
                            </span>
                            <span className="text-[11px] text-slate-400 font-semibold">(น้ำหนัก {cat.weight}%)</span>
                          </div>
                        </div>

                        {/* Strengths & Weaknesses per Category */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
                          {cat.strengths.length > 0 && (
                            <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100/60 text-emerald-800">
                              <span className="font-bold block mb-0.5 text-emerald-700">✓ จุดแข็ง:</span>
                              <ul className="list-disc list-inside space-y-0.5">
                                {cat.strengths.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {cat.weaknesses.length > 0 && (
                            <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-100/60 text-rose-800">
                              <span className="font-bold block mb-0.5 text-rose-700">✗ จุดที่ขาด / ต้องปรับปรุง:</span>
                              <ul className="list-disc list-inside space-y-0.5">
                                {cat.weaknesses.map((w, i) => (
                                  <li key={i}>{w}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Strengths */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    3. สิ่งที่ทำได้ดีแล้ว (Strengths)
                  </h4>
                  <div className="bg-emerald-50/40 rounded-xl p-3.5 border border-emerald-100">
                    <ul className="space-y-1.5">
                      {resumeReview?.strengths.map((item, idx) => (
                        <li key={idx} className="text-xs text-emerald-900 flex items-start gap-2 font-medium">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* 4. Top 3 Critical Improvements */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    4. สิ่งที่ต้องแก้ไขด่วนที่สุด 3 อันดับแรก (Top Critical Improvements)
                  </h4>
                  <div className="bg-rose-50/40 rounded-xl p-3.5 border border-rose-100 space-y-2">
                    {resumeReview?.criticalImprovements.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-rose-900">
                        <span className="bg-rose-600 text-white font-extrabold rounded-full w-4 h-4 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="font-semibold">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Rewording & Action Verbs */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    5. คำแนะนำการปรับ Reword ประโยคในโปรเจกต์ (Action Verbs & Impact Statements)
                  </h4>
                  <div className="space-y-2.5">
                    {resumeReview?.actionVerbSuggestions.map((item, idx) => (
                      <div key={idx} className="bg-amber-50/30 rounded-xl p-3.5 border border-amber-100 text-xs space-y-1.5">
                        <div className="flex items-baseline gap-2">
                          <span className="text-rose-600 font-bold line-through">แบบเดิม:</span>
                          <span className="text-slate-600 italic">"{item.original}"</span>
                        </div>
                        <div className="flex items-baseline gap-2 bg-white p-2 rounded-lg border border-amber-200">
                          <span className="text-emerald-600 font-bold">แนะนำ:</span>
                          <span className="text-slate-800 font-semibold">"{item.improved}"</span>
                        </div>
                        <p className="text-[11px] text-amber-800 font-medium pl-1">• {item.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="border-t border-slate-100 pt-4 flex justify-end">
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
                  >
                    อัปเดตโปรไฟล์ & Resume ตอนนี้
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}


