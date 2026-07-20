"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  LayoutDashboard,
  Briefcase,
  Brain,
  MessageSquare,
  Settings,
  Search,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  Save,
  Camera,
  Edit2,
  Plus,
  X,
  FileText,
  FileUp,
  MoreVertical,
  Globe,
  Code,
  Link2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

interface Skill {
  id: string;
  name: string;
  level: "advanced" | "intermediate" | "beginner";
}

interface StudentProfile {
  fullName: string;
  major: string;
  university: string;
  graduationYear: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<StudentProfile>({
    fullName: "Alex Rivera",
    major: "B.S. Computer Science",
    university: "Stanford University",
    graduationYear: "Class of 2025",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/arivera",
    github: "github.com/arivera-dev",
    portfolio: "",
  });

  const [skills, setSkills] = useState<Skill[]>([
    { id: "1", name: "React.js", level: "advanced" },
    { id: "2", name: "TypeScript", level: "advanced" },
    { id: "3", name: "Node.js", level: "intermediate" },
    { id: "4", name: "UI/UX Design", level: "intermediate" },
    { id: "5", name: "Python", level: "beginner" },
    { id: "6", name: "AWS", level: "beginner" },
  ]);

  const [newSkillName, setNewSkillName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // State สำหรับฟอร์มเปลี่ยนรหัสผ่าน
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemoveSkill = (id: string) => {
    setSkills(skills.filter((skill) => skill.id !== id));
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: newSkillName.trim(),
      level: "intermediate",
    };
    setSkills([...skills, newSkill]);
    setNewSkillName("");
  };

  // ฟังก์ชันเปลี่ยนรหัสผ่าน
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (!passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPasswordMsg({ text: "กรุณากรอกข้อมูลให้ครบทุกช่อง", type: "error" });
      return;
    }

    if (passwords.newPassword.length < 6) {
      setPasswordMsg({ text: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร", type: "error" });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordMsg({ text: "รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน", type: "error" });
      return;
    }

    // จำลองการอัปเดตรหัสผ่าน
    setPasswordMsg({ text: "อัปเดตรหัสผ่านสำเร็จเรียบร้อย!", type: "success" });
    setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert("บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว!");
    }, 1000);
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex antialiased w-full">
      {/* SideNavBar */}
      <nav className="hidden md:flex flex-col h-full border-r border-slate-200 fixed left-0 top-0 w-[260px] bg-white shadow-sm z-50">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Sparkles className="w-6 h-6 fill-blue-600 text-blue-600" />
            InternMatch
          </h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">
            AI Career Portal
          </p>
        </div>

        <div className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-4 text-slate-500 py-3 px-4 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-colors text-sm font-semibold"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            href="/applications"
            className="flex items-center gap-4 text-slate-500 py-3 px-4 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-colors text-sm font-semibold"
          >
            <Briefcase className="w-5 h-5" />
            Applications
          </Link>
          <Link
            href="/matches"
            className="flex items-center gap-4 text-slate-500 py-3 px-4 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-colors text-sm font-semibold"
          >
            <Brain className="w-5 h-5" />
            Matches
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-4 border-l-4 border-blue-600 bg-blue-50/50 text-blue-700 py-3 px-4 font-bold rounded-r-xl transition-colors text-sm"
          >
            <Settings className="w-5 h-5 fill-blue-600/20" />
            Settings
          </Link>
        </div>

        <div className="p-4">
          <Link
            href="/internships"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Search className="w-4 h-4" />
            Find Internships
          </Link>
        </div>

        <div className="px-3 pb-6 border-t border-slate-100 pt-4 mt-auto space-y-1">
          <Link
            href="/help"
            className="flex items-center gap-4 text-slate-500 py-2.5 px-4 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-colors text-sm font-semibold"
          >
            <HelpCircle className="w-5 h-5" />
            Help Center
          </Link>
          <Link
            href="/logout"
            className="flex items-center gap-4 text-red-500 py-2.5 px-4 hover:bg-red-50 rounded-xl transition-colors text-sm font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Link>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-[260px] relative">
        <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-blue-600 hover:bg-slate-100 rounded-full p-2 transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-blue-600">
              Profile Settings
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-slate-500 hover:bg-slate-100 rounded-full p-2 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden ml-2">
              <img
                alt="User Profile"
                className="w-full h-full object-cover"
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
              />
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                Student Profile
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage your personal information, security, and portfolio.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2 w-full md:w-auto disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Personal Info Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-100 to-indigo-100"></div>

                <div className="relative mt-4 group cursor-pointer">
                  <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-sm relative">
                    <img
                      className="w-full h-full object-cover"
                      alt="Student Profile Avatar"
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mt-4">
                  {profile.fullName}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {profile.major}
                </p>

                <div className="w-full mt-6 space-y-4 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      University
                    </label>
                    <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                      <input
                        className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                        type="text"
                        name="university"
                        value={profile.university}
                        onChange={handleInputChange}
                      />
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Graduation Year
                    </label>
                    <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                      <input
                        className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                        type="text"
                        name="graduationYear"
                        value={profile.graduationYear}
                        onChange={handleInputChange}
                      />
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Location
                    </label>
                    <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                      <input
                        className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                        type="text"
                        name="location"
                        value={profile.location}
                        onChange={handleInputChange}
                      />
                      <Edit2 className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* 🌟 Security & Change Password Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-blue-600" />
                  Change Password
                </h3>

                {passwordMsg && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold mb-4 ${
                      passwordMsg.type === "error"
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    }`}
                  >
                    {passwordMsg.text}
                  </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, current: !prev.current }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2.5 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({ ...prev, confirm: !prev.confirm }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Update Password
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Skills Management Card */}
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
                      onClick={handleAddSkill}
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
                        className={`inline-flex items-center gap-1.5 py-1 px-3 rounded-full border text-xs font-semibold group cursor-default ${badgeBg}`}
                      >
                        <span>{skill.name}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotBg}`}></span>
                        <button
                          onClick={() => handleRemoveSkill(skill.id)}
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

              {/* Resume & Portfolio Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Resume Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 h-full flex flex-col">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Resume
                  </h3>

                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-red-100 text-red-600 p-2 rounded-lg flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          Alex_Rivera_Resume_2026.pdf
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Updated 2 days ago • 1.2 MB
                        </p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 p-1">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col items-center justify-center p-6 cursor-pointer group">
                    <div className="bg-white p-3 rounded-full shadow-xs mb-2 group-hover:scale-110 transition-transform">
                      <FileUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      Click to replace resume
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      PDF, DOCX up to 5MB
                    </p>
                  </div>
                </div>

                {/* External Links Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 h-full">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Link2 className="w-5 h-5 text-blue-600" />
                    External Links
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        LinkedIn Profile
                      </label>
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <div className="bg-slate-100 p-2.5 border-r border-slate-200 text-slate-500">
                          <Globe className="w-4 h-4" />
                        </div>
                        <input
                          className="bg-transparent border-none outline-none w-full text-xs font-semibold text-slate-800 px-3 py-2"
                          type="text"
                          name="linkedin"
                          value={profile.linkedin}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        GitHub Repository
                      </label>
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <div className="bg-slate-100 p-2.5 border-r border-slate-200 text-slate-500">
                          <Code className="w-4 h-4" />
                        </div>
                        <input
                          className="bg-transparent border-none outline-none w-full text-xs font-semibold text-slate-800 px-3 py-2"
                          type="text"
                          name="github"
                          value={profile.github}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Personal Portfolio
                      </label>
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <div className="bg-slate-100 p-2.5 border-r border-slate-200 text-slate-500">
                          <Globe className="w-4 h-4" />
                        </div>
                        <input
                          className="bg-transparent border-none outline-none w-full text-xs font-semibold text-slate-800 px-3 py-2"
                          type="text"
                          name="portfolio"
                          placeholder="https://yourwebsite.com"
                          value={profile.portfolio}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}