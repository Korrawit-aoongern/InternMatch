import React from "react";
import StatsCard from "@/components/ui/StatsCard";
import { Send, Lightbulb, Megaphone, CircleDot, Cpu, GitFork, Plus, Brain } from "lucide-react";

interface StudentDashboardProps {
  displayName: string;
}

export default function StudentDashboard({ displayName }: StudentDashboardProps) {
  return (
    <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome back, {displayName}!</h2>
          <p className="text-sm text-slate-500 mt-1">{"Here's your career progress at a glance."}</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
          AI Resume Review
        </button>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Match Score" value="High" progressPercent={85} />
        <StatsCard label="Applied" value="12 Positions" icon={Send} variant="blue" />
        <StatsCard label="Recommended" value="48 Matches" icon={Lightbulb} variant="green" />
        <StatsCard label="Alerts" value="3 New" icon={Megaphone} variant="red" />
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Recent Activity Timeline */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-800">Recent Activity</h3>
              <button className="text-sm font-semibold text-blue-600 hover:underline">View All</button>
            </div>
            <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
              <div className="relative pl-6">
                <div className="absolute left-[-21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white"></div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-slate-800">Application Viewed</p>
                    <span className="text-[10px] text-slate-400">2h ago</span>
                  </div>
                  <p className="text-xs text-slate-500">Google reviewed your application for UX Design Intern position.</p>
                  <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">IN PROGRESS</div>
                </div>
              </div>

              <div className="relative pl-6">
                <div className="absolute left-[-21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white"></div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-bold text-slate-800">New Match Identified</p>
                    <span className="text-[10px] text-slate-400">1d ago</span>
                  </div>
                  <p className="text-xs text-slate-500">Stripe is looking for a Product Intern matching your React skills.</p>
                  <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">NEW MATCH</div>
                </div>
              </div>
            </div>
          </section>

          {/* Recommended Companies */}
          <section className="space-y-4">
            <h3 className="text-base font-bold text-slate-800">Top Matches by Company</h3>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
              <div className="min-w-[160px] bg-white rounded-2xl border border-slate-200 p-4 shadow-sm snap-start text-center flex flex-col items-center justify-center gap-3 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                  <CircleDot className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">TechFlow</p>
                  <p className="text-[11px] font-bold text-blue-600 mt-0.5">92% Match</p>
                </div>
              </div>

              <div className="min-w-[160px] bg-white rounded-2xl border border-slate-200 p-4 shadow-sm snap-start text-center flex flex-col items-center justify-center gap-3 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                  <Cpu className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">DesignSynergy</p>
                  <p className="text-[11px] font-bold text-blue-600 mt-0.5">88% Match</p>
                </div>
              </div>

              <div className="min-w-[160px] bg-white rounded-2xl border border-slate-200 p-4 shadow-sm snap-start text-center flex flex-col items-center justify-center gap-3 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                  <GitFork className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">DataCore</p>
                  <p className="text-[11px] font-bold text-blue-600 mt-0.5">85% Match</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Box (AI Insights) */}
        <div className="lg:col-span-4">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl p-6 lg:sticky lg:top-24 space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Brain className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-800">AI Insights</h3>
            </div>
            <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-xl p-4 border border-blue-100 relative overflow-hidden">
              <h4 className="text-xs font-bold text-slate-800">Boost your visibility</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Adding <strong className="text-slate-700">Figma</strong> and <strong className="text-slate-700">Prototyping</strong> to your skills could increase your match rate by 15% based on current market trends.
              </p>
              <button className="mt-4 w-full bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs">
                <Plus className="w-4 h-4" />
                Update Skills
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
