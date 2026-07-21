import React from "react";

interface StatsCardProps {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  progressPercent?: number;
  variant?: "blue" | "green" | "red" | "default";
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  progressPercent,
  variant = "default",
}: StatsCardProps) {
  const iconColors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    default: "bg-slate-50 text-slate-600",
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      {progressPercent !== undefined ? (
        <div className="relative w-14 h-14 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeWidth={3.5}
            ></path>
            <path
              className="text-blue-600"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="currentColor"
              strokeDasharray={`${progressPercent}, 100`}
              strokeLinecap="round"
              strokeWidth={3.5}
            ></path>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">
            {progressPercent}%
          </div>
        </div>
      ) : (
        Icon && (
          <div className={`${iconColors[variant]} w-12 h-12 rounded-full flex items-center justify-center`}>
            <Icon className="w-5 h-5" />
          </div>
        )
      )}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
