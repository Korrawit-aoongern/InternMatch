"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  X,
  Search,
  Brain,
  Terminal,
  Layout,
  Server,
  Database,
  Cloud,
  Cpu,
  Smartphone,
  CheckSquare,
  Palette,
  Lock,
  Briefcase,
  User,
  Globe,
  Award,
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { getMasterSkills } from "@/lib/actions/skills";

interface Skill {
  id: string;
  skill_id: number;
  name: string;
  level: "Advanced" | "Intermediate" | "Beginner";
}

interface SkillsManagementProps {
  skills: Skill[];
  setSkills: React.Dispatch<React.SetStateAction<Skill[]>>;
}

// Meta configurations for categories
const categoryDetails: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  "Programming Language": { label: "Programming Language", icon: Terminal, color: "text-purple-600 border-purple-200", bg: "from-purple-500/8 to-transparent" },
  "Frontend": { label: "🌐 Frontend", icon: Layout, color: "text-blue-600 border-blue-200", bg: "from-blue-500/8 to-transparent" },
  "Backend": { label: "⚙️ Backend", icon: Server, color: "text-emerald-600 border-emerald-200", bg: "from-emerald-500/8 to-transparent" },
  "Database": { label: "🗄 Database", icon: Database, color: "text-cyan-600 border-cyan-200", bg: "from-cyan-500/8 to-transparent" },
  "Cloud / DevOps": { label: "☁️ Cloud / DevOps", icon: Cloud, color: "text-orange-600 border-orange-200", bg: "from-orange-500/8 to-transparent" },
  "AI / Data": { label: "🤖 AI / Data", icon: Cpu, color: "text-pink-600 border-pink-200", bg: "from-pink-500/8 to-transparent" },
  "Mobile": { label: "📱 Mobile", icon: Smartphone, color: "text-indigo-600 border-indigo-200", bg: "from-indigo-500/8 to-transparent" },
  "Testing": { label: "🧪 Testing", icon: CheckSquare, color: "text-amber-600 border-amber-200", bg: "from-amber-500/8 to-transparent" },
  "UI / UX": { label: "🎨 UI / UX", icon: Palette, color: "text-rose-600 border-rose-200", bg: "from-rose-500/8 to-transparent" },
  "Cyber Security": { label: "🔐 Cyber Security", icon: Lock, color: "text-red-600 border-red-200", bg: "from-red-500/8 to-transparent" },
  "Business": { label: "📊 Business", icon: Briefcase, color: "text-slate-600 border-slate-200", bg: "from-slate-500/8 to-transparent" },
  "Soft Skills": { label: "🎯 Soft Skills", icon: User, color: "text-violet-600 border-violet-200", bg: "from-violet-500/8 to-transparent" },
  "Language": { label: "🌍 Language", icon: Globe, color: "text-teal-600 border-teal-200", bg: "from-teal-500/8 to-transparent" }
};

const getCategoryMeta = (catName: string) => {
  return categoryDetails[catName] || {
    label: catName || "Others",
    icon: Award,
    color: "text-slate-600 border-slate-200",
    bg: "from-slate-500/5 to-transparent"
  };
};

export default function SkillsManagement({ skills, setSkills }: SkillsManagementProps) {
  const [masterSkills, setMasterSkills] = useState<{ id: number; name: string; category: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Track open/closed state for each category (default is all closed initially)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Helper to check if a category is expanded (default to FALSE since we want them closed until clicked)
  const isExpanded = (categoryName: string) => {
    return expandedCategories[categoryName] === true; // Closed by default
  };

  // Toggle category expansion
  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryName]: !isExpanded(categoryName),
    }));
  };

  // Expand all categories
  const handleExpandAll = () => {
    const updated: Record<string, boolean> = {};
    const uniqueCats = Array.from(new Set(masterSkills.map(s => s.category || "Others")));
    uniqueCats.forEach(cat => {
      updated[cat] = true;
    });
    setExpandedCategories(updated);
  };

  // Collapse all categories (return to normal grid)
  const handleCollapseAll = () => {
    setExpandedCategories({});
  };

  // Fetch all skills on mount
  useEffect(() => {
    async function loadSkills() {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await getMasterSkills();
      if (res.success && res.skills) {
        setMasterSkills(res.skills);
      } else {
        setErrorMsg(res.error || "ไม่สามารถโหลดข้อมูลทักษะได้");
      }
      setIsLoading(false);
    }
    loadSkills();
  }, []);

  // Handle toggling skill (add as Intermediate or remove)
  const handleToggleSkill = (masterSkill: { id: number; name: string; category: string }) => {
    const existing = skills.find((s) => s.skill_id === masterSkill.id);
    if (existing) {
      setSkills(skills.filter((s) => s.skill_id !== masterSkill.id));
    } else {
      setSkills([
        ...skills,
        {
          id: `new-${Date.now()}`,
          skill_id: masterSkill.id,
          name: masterSkill.name,
          level: "Intermediate",
        },
      ]);
    }
  };

  // Change specific skill level
  const handleLevelChange = (skillId: number, newLevel: string) => {
    if (newLevel === "remove") {
      setSkills(skills.filter((s) => s.skill_id !== skillId));
    } else {
      setSkills(
        skills.map((s) =>
          s.skill_id === skillId
            ? { ...s, level: newLevel as "Advanced" | "Intermediate" | "Beginner" }
            : s
        )
      );
    }
  };

  // Quick action: clear all skills in a specific category
  const handleClearCategory = (categoryName: string, categorySkills: typeof masterSkills) => {
    const catSkillIds = categorySkills.map(s => s.id);
    setSkills(skills.filter(s => !catSkillIds.includes(s.skill_id)));
  };

  // Group master skills by category dynamically based on search query
  const filteredGroupedSkills = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const groups: Record<string, typeof masterSkills> = {};

    masterSkills.forEach((skill) => {
      if (query && !skill.name.toLowerCase().includes(query)) {
        return;
      }
      const cat = skill.category || "Others";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(skill);
    });

    return groups;
  }, [masterSkills, searchQuery]);

  // Derive split categories (opened vs closed)
  const splitCategories = useMemo(() => {
    const expanded: [string, typeof masterSkills][] = [];
    const collapsed: [string, typeof masterSkills][] = [];

    Object.entries(filteredGroupedSkills).forEach(([catName, catSkills]) => {
      if (isExpanded(catName)) {
        expanded.push([catName, catSkills]);
      } else {
        collapsed.push([catName, catSkills]);
      }
    });

    return {
      expanded,
      collapsed,
      anyExpanded: expanded.length > 0
    };
  }, [filteredGroupedSkills, expandedCategories]);

  // Compute stats for AI matching gauge
  const skillProgress = useMemo(() => {
    const count = skills.length;
    if (count === 0) return 0;
    // Weighted strength score: Advanced = 3, Intermediate = 2, Beginner = 1
    const totalWeight = skills.reduce((acc, curr) => {
      if (curr.level === "Advanced") return acc + 3;
      if (curr.level === "Intermediate") return acc + 2;
      return acc + 1;
    }, 0);
    const maxWeight = count * 3;
    return Math.round((totalWeight / maxWeight) * 100);
  }, [skills]);

  // Render a Category Card (can be styled differently if expanded)
  const renderCategoryCard = (catName: string, catSkills: typeof masterSkills, expanded: boolean) => {
    const meta = getCategoryMeta(catName);
    const CatIcon = meta.icon;

    // Check how many skills in this category are active
    const catSkillIds = catSkills.map(s => s.id);
    const selectedInCat = skills.filter(s => catSkillIds.includes(s.skill_id));

    return (
      <div
        key={catName}
        className={`bg-white rounded-xl border p-4 transition-all flex flex-col gap-2 shadow-3xs relative overflow-hidden h-fit ${
          expanded
            ? "border-blue-200/80 shadow-md shadow-blue-500/5 bg-gradient-to-b from-blue-50/5 to-white"
            : "border-slate-200/70 hover:border-slate-300"
        }`}
      >
        {/* Category Header */}
        <div
          onClick={() => toggleCategory(catName)}
          className="flex items-center justify-between cursor-pointer select-none group"
        >
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border transition-colors ${
              expanded
                ? "bg-blue-100/50 border-blue-200 text-blue-600"
                : `${meta.color.split(" ")[0]} ${meta.color.split(" ")[1]}`
            }`}>
              <CatIcon className="w-4 h-4" />
            </div>
            <span className={`text-xs font-bold transition-colors ${
              expanded ? "text-blue-700" : "text-slate-800 group-hover:text-blue-600"
            }`}>
              {meta.label}
            </span>
          </div>

          {/* Actions / Info */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {selectedInCat.length > 0 && (
              <span className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 leading-none transition-colors ${
                expanded
                  ? "text-blue-700 bg-blue-100 border border-blue-200"
                  : "text-blue-600 bg-blue-50 border border-blue-100"
              }`}>
                {selectedInCat.length}
              </span>
            )}
            {selectedInCat.length > 0 && expanded && (
              <button
                type="button"
                onClick={() => handleClearCategory(catName, catSkills)}
                className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors mr-1 cursor-pointer"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleCategory(catName)}
              className="text-slate-400 group-hover:text-slate-600 transition-colors p-1"
            >
              {expanded ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Skills list inside category (only shown if expanded) */}
        {expanded && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100/60 mt-1">
            {catSkills.map((masterSkill) => {
              const selected = skills.find(s => s.skill_id === masterSkill.id);
              const isSelected = !!selected;

              if (isSelected) {
                const isAdvanced = selected.level === "Advanced";
                const isIntermediate = selected.level === "Intermediate";

                return (
                  <div
                    key={masterSkill.id}
                    className={`inline-flex items-center rounded-xl border text-[11px] shadow-3xs transition-all ${
                      isAdvanced
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : isIntermediate
                        ? "bg-blue-50 text-blue-800 border-blue-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span className="pl-2.5 pr-1.5 py-1 font-semibold leading-none">{masterSkill.name}</span>
                    <span className={`w-px h-3 ${isAdvanced ? "bg-emerald-200" : isIntermediate ? "bg-blue-200" : "bg-slate-300"}`}></span>
                    <select
                      value={selected.level}
                      onChange={(e) => handleLevelChange(masterSkill.id, e.target.value)}
                      className={`pl-1 pr-1.5 py-1 bg-transparent border-0 outline-none text-[9px] font-bold uppercase tracking-wider cursor-pointer focus:ring-0 leading-none ${
                        isAdvanced ? "text-emerald-700" : isIntermediate ? "text-blue-700" : "text-slate-500"
                      }`}
                    >
                      <option value="Beginner" className="text-slate-800 bg-white">Beginner</option>
                      <option value="Intermediate" className="text-slate-800 bg-white">Intermediate</option>
                      <option value="Advanced" className="text-slate-800 bg-white">Advanced</option>
                      <option value="remove" className="text-red-600 bg-white font-semibold">❌ Remove</option>
                    </select>
                  </div>
                );
              }

              return (
                <button
                  type="button"
                  key={masterSkill.id}
                  onClick={() => handleToggleSkill(masterSkill)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300 text-[11px] font-medium text-slate-600 hover:text-slate-800 transition-all cursor-pointer shadow-3xs"
                >
                  <Plus className="w-3 h-3 text-slate-400" />
                  {masterSkill.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col gap-6">
      
      {/* Header section with Stats indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Brain className="w-5.5 h-5.5 text-blue-600 animate-pulse" />
            ทักษะและความสามารถ (Skills &amp; Expertise)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            ระบุทักษะทางเทคนิค ซอฟต์สกิล และภาษา เพื่อปรับปรุงความแม่นยำในการจับคู่งานด้วย AI
          </p>
        </div>

        {/* AI Skill Index indicator */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3 self-start md:self-auto min-w-[200px]">
          <div className="relative w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-xl font-bold text-sm">
            {skills.length}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              <span>Skill Index</span>
              <span className="text-blue-600 font-extrabold">{skillProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500" 
                style={{ width: `${skillProgress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Skills Summary Section */}
      {skills.length > 0 && (
        <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 animate-fadeIn">
          <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            ทักษะที่คุณเลือกไว้ ({skills.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => {
              const isAdvanced = skill.level === "Advanced";
              const isIntermediate = skill.level === "Intermediate";
              
              return (
                <div
                  key={skill.skill_id}
                  className={`inline-flex items-center rounded-xl border text-xs shadow-3xs transition-all ${
                    isAdvanced
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/5"
                      : isIntermediate
                      ? "bg-blue-50 text-blue-800 border-blue-200 shadow-blue-500/5"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <span className="pl-3 pr-2 py-1 font-semibold leading-none">{skill.name}</span>
                  <span className={`w-px h-3.5 ${isAdvanced ? "bg-emerald-200" : isIntermediate ? "bg-blue-200" : "bg-slate-300"}`}></span>
                  <select
                    value={skill.level}
                    onChange={(e) => handleLevelChange(skill.skill_id, e.target.value)}
                    className={`pl-1.5 pr-2 py-1 bg-transparent border-0 outline-none text-[10px] font-bold uppercase tracking-wider cursor-pointer focus:ring-0 leading-none ${
                      isAdvanced ? "text-emerald-700" : isIntermediate ? "text-blue-700" : "text-slate-500"
                    }`}
                  >
                    <option value="Beginner" className="text-slate-800 bg-white">Beginner</option>
                    <option value="Intermediate" className="text-slate-800 bg-white">Intermediate</option>
                    <option value="Advanced" className="text-slate-800 bg-white">Advanced</option>
                    <option value="remove" className="text-red-600 bg-white font-semibold">❌ Remove</option>
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filters with Collapse controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="ค้นหาหรือกรองทักษะ เช่น React, Python, Git..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Toggle all controls */}
        <div className="flex gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-3 py-2 text-[11px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            เปิดทุกช่อง (Expand All)
          </button>
          {splitCategories.anyExpanded && (
            <button
              type="button"
              onClick={handleCollapseAll}
              className="px-3 py-2 text-[11px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              ปิดหมดเป็นเหมือนเดิม
            </button>
          )}
        </div>
      </div>

      {/* Master Skill Grid with Categories */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <p className="text-xs font-semibold">กำลังโหลดข้อมูลทักษะ...</p>
        </div>
      ) : errorMsg ? (
        <div className="text-center py-6 text-red-500 border border-red-100 bg-red-50 rounded-xl p-4 text-xs font-medium">
          {errorMsg}
        </div>
      ) : Object.keys(filteredGroupedSkills).length === 0 ? (
        <div className="text-center py-10 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
          ไม่พบทักษะที่ตรงกับการค้นหา
        </div>
      ) : !splitCategories.anyExpanded ? (
        /* เมื่อไม่มีหมวดหมู่ใดถูกเปิด: แสดงเป็น Grid 3 คอลัมน์แบบปิดทั้งหมด */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {splitCategories.collapsed.map(([catName, catSkills]) => 
            renderCategoryCard(catName, catSkills, false)
          )}
        </div>
      ) : (
        /* เมื่อเปิดแล้วอย่างน้อย 1 ช่อง: แบ่งครึ่งซ้าย (ปิด) - ขวา (เปิด) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ฝั่งซ้าย: หมวดหมู่ที่ปิดอยู่ (Collapsed) */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1 px-1">
              หมวดหมู่ที่ยังไม่ได้เปิด ({splitCategories.collapsed.length})
            </div>
            {splitCategories.collapsed.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                เปิดทุกหมวดหมู่แล้ว
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                {splitCategories.collapsed.map(([catName, catSkills]) => 
                  renderCategoryCard(catName, catSkills, false)
                )}
              </div>
            )}
          </div>

          {/* ฝั่งขวา: หมวดหมู่ที่เปิดจัดการอยู่ (Expanded) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider mb-1 px-1 flex justify-between items-center">
              <span>หมวดหมู่ที่กำลังเปิดจัดการทักษะ ({splitCategories.expanded.length})</span>
              <button 
                type="button" 
                onClick={handleCollapseAll}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 normal-case cursor-pointer"
              >
                ปิดทั้งหมดเพื่อกลับหน้าเดิม
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {splitCategories.expanded.map(([catName, catSkills]) => 
                renderCategoryCard(catName, catSkills, true)
              )}
            </div>
          </div>

        </div>
      )}

      {/* Color Guides */}
      <div className="flex flex-wrap gap-4 pt-3 border-t border-slate-100 text-[10px] font-bold text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-emerald-100 border border-emerald-300 flex-shrink-0"></span>
          <span>Advanced (เชี่ยวชาญ)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-blue-100 border border-blue-300 flex-shrink-0"></span>
          <span>Intermediate (พอใช้-ปานกลาง)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-md bg-slate-100 border border-slate-300 flex-shrink-0"></span>
          <span>Beginner (ขั้นต้น)</span>
        </div>
      </div>

    </div>
  );
}
