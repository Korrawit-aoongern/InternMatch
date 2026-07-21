import React from "react";
import StatsCard from "@/components/ui/StatsCard";
import { Send, Users, Sparkles, Megaphone, ChevronRight, Brain } from "lucide-react";

interface CompanyDashboardProps {
  displayName: string;
}

export default function CompanyDashboard({ displayName }: CompanyDashboardProps) {
  return (
    <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome, {displayName}!</h2>
          <p className="text-sm text-slate-500 mt-1">Here's your recruitment status at a glance.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Candidate Finder
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Match Rate" value="High" progressPercent={92} />
        <StatsCard label="Total Applicants" value="24 Applicants" icon={Users} variant="blue" />
        <StatsCard label="Active Job Posts" value="8 Openings" icon={Send} variant="green" />
        <StatsCard label="Alerts" value="5 Action Needed" icon={Megaphone} variant="red" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Candidates */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-slate-800">Recent Applications</h3>
              <button className="text-sm font-semibold text-indigo-600 hover:underline">View All</button>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Candidate 1 */}
              <div className="py-4 flex items-center justify-between first:pt-0 last:pb-0 hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                    AR
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Alex Rivera</p>
                    <p className="text-xs text-slate-500">React.js Developer • Stanford University</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-150">92% Match</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              {/* Candidate 2 */}
              <div className="py-4 flex items-center justify-between first:pt-0 last:pb-0 hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                    JD
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Jane Doe</p>
                    <p className="text-xs text-slate-500">UI/UX Design Intern • Chulalongkorn</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-150">88% Match</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* AI Matching Tips */}
        <div className="lg:col-span-4">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl p-6 lg:sticky lg:top-24 space-y-4">
            <div className="flex items-center gap-2 text-indigo-600">
              <Brain className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-800">AI Recruiter Tips</h3>
            </div>
            <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-xl p-4 border border-indigo-100 relative overflow-hidden">
              <h4 className="text-xs font-bold text-slate-800">Top demand skills</h4>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Adding <strong className="text-slate-700">TypeScript</strong> or <strong className="text-slate-700">Next.js</strong> to your internship requirements will match you with 40% more qualified student resumes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
