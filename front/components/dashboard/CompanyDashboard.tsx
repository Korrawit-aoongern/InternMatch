"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import StatsCard from "@/components/ui/StatsCard";
import { Send, Users, Megaphone, ChevronRight, PlusCircle } from "lucide-react";
import { getCompanyInternships, getCompanyApplications } from "@/lib/actions/internships";

interface CompanyDashboardProps {
  displayName: string;
}

interface StatsData {
  avgMatchRate: number;
  totalApplicants: number;
  activeJobPosts: number;
  pendingActionAlerts: number;
}

export default function CompanyDashboard({ displayName }: CompanyDashboardProps) {
  const [stats, setStats] = useState<StatsData>({
    avgMatchRate: 0,
    totalApplicants: 0,
    activeJobPosts: 0,
    pendingActionAlerts: 0,
  });
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [recentApplicants, setRecentApplicants] = useState<any[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const [internshipsRes, appsRes] = await Promise.all([
          getCompanyInternships(),
          getCompanyApplications(),
        ]);

        if (!isMounted) return;

        let activeJobPosts = 0;
        if (internshipsRes.success && internshipsRes.internships) {
          activeJobPosts = internshipsRes.internships.filter(
            (item: any) => item.status === "open"
          ).length;
        }

        let totalApplicants = 0;
        let avgMatchRate = 0;
        let pendingActionAlerts = 0;
        let appsList: any[] = [];

        if (appsRes.success && appsRes.applicants) {
          appsList = appsRes.applicants;
          totalApplicants = appsList.length;

          if (totalApplicants > 0) {
            const sumMatch = appsList.reduce(
              (acc: number, item: any) => acc + (item.match_score || 0),
              0
            );
            avgMatchRate = Math.round(sumMatch / totalApplicants);
          }

          pendingActionAlerts = appsList.filter(
            (item: any) => item.status === "pending" || item.status === "reviewing"
          ).length;
        }

        setStats({
          avgMatchRate,
          totalApplicants,
          activeJobPosts,
          pendingActionAlerts,
        });

        setRecentApplicants(appsList.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch company dashboard stats:", error);
      } finally {
        if (isMounted) {
          setLoadingStats(false);
          setLoadingApplicants(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getMatchLabel = (rate: number) => {
    if (rate >= 80) return "High";
    if (rate >= 50) return "Medium";
    return rate > 0 ? "Low" : "No Data";
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((w) => w[0]?.toUpperCase()).join("") || "?";
  };

  return (
    <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md mb-2 inline-block">Company Dashboard</span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome, {displayName}!</h2>
          <p className="text-sm text-slate-500 mt-1">{"Here's your recruitment status at a glance."}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Match Rate"
          value={loadingStats ? "..." : `${getMatchLabel(stats.avgMatchRate)}${stats.avgMatchRate > 0 ? ` (${stats.avgMatchRate}%)` : ""}`}
          progressPercent={loadingStats ? undefined : stats.avgMatchRate}
        />
        <Link href="/dashboard/applications" className="block transition-transform hover:-translate-y-0.5">
          <StatsCard
            label="Total Applicants"
            value={loadingStats ? "..." : `${stats.totalApplicants} Applicants`}
            icon={Users}
            variant="blue"
          />
        </Link>
        <Link href="/dashboard/Internships" className="block transition-transform hover:-translate-y-0.5">
          <StatsCard
            label="Active Job Posts"
            value={loadingStats ? "..." : `${stats.activeJobPosts} Openings`}
            icon={Send}
            variant="green"
          />
        </Link>
        <Link href="/dashboard/applications" className="block transition-transform hover:-translate-y-0.5">
          <StatsCard
            label="Alerts"
            value={loadingStats ? "..." : `${stats.pendingActionAlerts} Action Needed`}
            icon={Megaphone}
            variant="red"
          />
        </Link>
      </div>

      {/* Recent Applications Section */}
      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-slate-800">Recent Applications</h3>
            <Link href="/dashboard/applications" className="text-sm font-semibold text-indigo-600 hover:underline">
              View All
            </Link>
          </div>

          {loadingApplicants ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading applications...</div>
          ) : recentApplicants.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">ยังไม่มีผู้สมัครงานในขณะนี้</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentApplicants.map((applicant) => (
                <div
                  key={applicant.application_id}
                  className="py-4 flex items-center justify-between first:pt-0 last:pb-0 hover:bg-slate-50/50 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0 overflow-hidden text-xs">
                      {applicant.profile_image ? (
                        <img
                          src={applicant.profile_image}
                          alt={applicant.fullname}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(applicant.fullname)
                      )}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-bold text-slate-800 truncate">{applicant.fullname}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {applicant.internship_title} • {applicant.university || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-150">
                      {applicant.match_score || 0}% Match
                    </span>
                    <Link href={`/dashboard/applications?position=${applicant.internship_id}`}>
                      <ChevronRight className="w-4 h-4 text-slate-400 hover:text-indigo-600 transition-colors" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
