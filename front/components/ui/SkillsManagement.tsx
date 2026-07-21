"use client";

import React, { useState } from "react";
import { Plus, X, Brain } from "lucide-react";

interface Skill {
  id: string;
  name: string;
  level: "advanced" | "intermediate" | "beginner";
}

interface SkillsManagementProps {
  skills: Skill[];
  onAddSkill: (name: string) => void;
  onRemoveSkill: (id: string) => void;
}

export default function SkillsManagement({ skills, onAddSkill, onRemoveSkill }: SkillsManagementProps) {
  const [newSkillName, setNewSkillName] = useState("");

  const handleAdd = () => {
    if (!newSkillName.trim()) return;
    onAddSkill(newSkillName.trim());
    setNewSkillName("");
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-600" />
          Skills &amp; Expertise
        </h3>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Add new skill..."
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
          <button
            onClick={handleAdd}
            className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs py-1.5 px-3 rounded-xl transition-colors flex items-center gap-1 border border-blue-200"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        Highlight your technical and soft skills to improve AI matching accuracy.
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        {skills.map((skill) => {
          let badgeBg = "bg-slate-100 text-slate-700 border-slate-200";
          let dotBg = "bg-slate-400";

          if (skill.level === "advanced") {
            badgeBg = "bg-emerald-50 text-emerald-800 border-emerald-200";
            dotBg = "bg-emerald-600";
          } else if (skill.level === "intermediate") {
            badgeBg = "bg-blue-50 text-blue-800 border-blue-200";
            dotBg = "bg-blue-600";
          }

          return (
            <div
              key={skill.id}
              className={`${badgeBg} inline-flex items-center gap-1.5 py-1 px-3 rounded-full border text-xs font-semibold group cursor-default`}
            >
              <span>{skill.name}</span>
              <span className={`${dotBg} w-1.5 h-1.5 rounded-full`}></span>
              <button
                type="button"
                onClick={() => onRemoveSkill(skill.id)}
                className="ml-1 opacity-40 group-hover:opacity-100 transition-opacity hover:text-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span className="text-[10px] font-bold text-slate-400">Advanced</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          <span className="text-[10px] font-bold text-slate-400">Intermediate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
          <span className="text-[10px] font-bold text-slate-400">Beginner</span>
        </div>
      </div>
    </div>
  );
}
