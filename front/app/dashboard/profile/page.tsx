"use client";
import React, { useState, useEffect } from "react";
import {
  Save,
  Camera,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  FileText,
  Globe,
  Code,
  Link2,
  User,
} from "lucide-react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import SkillsManagement from "@/components/ui/SkillsManagement";
import { getStudentProfile, updateStudentProfile, getCompanyProfile, updateCompanyProfile, uploadProfileImage, changeUserPassword } from "@/lib/actions/auth";
import { getStudentSkills, updateStudentSkills } from "@/lib/actions/skills";

interface Skill {
  id: string;
  skill_id: number;
  name: string;
  level: "Advanced" | "Intermediate" | "Beginner";
}

interface StudentProfile {
  // Student-specific
  fullname: string;
  phone: string;
  university: string;
  faculty: string;
  major: string;
  study_year: number;
  profile_image: string;
  resume_url: string;

  // Company-specific
  company_name: string;
  description: string;
  website: string;
  address: string;
  province: string;
  logo: string;

  // Shared / mock links
  linkedin: string;
  github: string;
  portfolio: string;
}

export default function ProfilePage() {
  const [role, setRole] = useState<"student" | "company">("student");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsSaving(true);
    try {
      const res = await uploadProfileImage(formData);
      if (res.success && res.url) {
        setProfile((prev) => ({
          ...prev,
          [role === "company" ? "logo" : "profile_image"]: res.url,
        }));
      } else {
        alert("Upload failed: " + res.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during file upload.");
    } finally {
      setIsSaving(false);
    }
  };

  
  const [profile, setProfile] = useState<StudentProfile>({
    fullname: "",
    phone: "",
    university: "",
    faculty: "",
    major: "",
    study_year: 1,
    profile_image: "",
    resume_url: "",

    company_name: "",
    description: "",
    website: "",
    address: "",
    province: "",
    logo: "",

    linkedin: "linkedin.com/company/arivera",
    github: "github.com/arivera-org",
    portfolio: "",
  });

  const [skills, setSkills] = useState<Skill[]>([]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: name === "study_year" ? Number(value) : value }));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const studentRes = await getStudentProfile();
      if (studentRes.success && studentRes.profile) {
        setRole("student");
        const p = studentRes.profile;
        setProfile((prev) => ({
          ...prev,
          fullname: p.fullname || "",
          phone: p.phone || "",
          university: p.university || "",
          faculty: p.faculty || "",
          major: p.major || "",
          study_year: p.study_year || 1,
          profile_image: p.profile_image || "",
          resume_url: p.resume_url || "",
        }));

        // โหลดทักษะของนักศึกษาจริงๆ จากฐานข้อมูล
        const skillsRes = await getStudentSkills();
        if (skillsRes.success && skillsRes.skills) {
          setSkills(skillsRes.skills as Skill[]);
        }
        return;
      }

      const companyRes = await getCompanyProfile();
      if (companyRes.success && companyRes.profile) {
        setRole("company");
        const c = companyRes.profile;
        setProfile((prev) => ({
          ...prev,
          company_name: c.company_name || "",
          description: c.description || "",
          website: c.website || "",
          address: c.address || "",
          province: c.province || "",
          logo: c.logo || "",
        }));
      }
    };
    fetchProfile();
  }, []);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  // Callbacks for skill management are now handled internally by SkillsManagement component

  // ฟังก์ชันเปลี่ยนรหัสผ่าน
  const handleUpdatePassword = async (e: React.FormEvent) => {
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

    // Call the server action to verify current password and update new password
    const result = await changeUserPassword(passwords.currentPassword, passwords.newPassword);

    if (result.success) {
      setPasswordMsg({ text: result.message || "อัปเดตรหัสผ่านสำเร็จเรียบร้อย!", type: "success" });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } else {
      setPasswordMsg({ text: result.error || "เกิดข้อผิดพลาด", type: "error" });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    let res;
    if (role === "student") {
      res = await updateStudentProfile({
        fullname: profile.fullname,
        phone: profile.phone || null,
        university: profile.university || null,
        faculty: profile.faculty || null,
        major: profile.major || null,
        study_year: Number(profile.study_year) || null,
        profile_image: profile.profile_image || null,
        resume_url: profile.resume_url || null,
      });

      if (res.success) {
        // บันทึกทักษะของนักศึกษาลงฐานข้อมูล
        const skillsToSave = skills.map((s) => ({
          skill_id: s.skill_id,
          level: s.level,
        }));
        const skillsRes = await updateStudentSkills(skillsToSave);
        if (!skillsRes.success) {
          res = { success: false, error: `โปรไฟล์บันทึกสำเร็จ แต่ทักษะบันทึกไม่สำเร็จ: ${skillsRes.error}` };
        }
      }
    } else {
      res = await updateCompanyProfile({
        company_name: profile.company_name,
        description: profile.description || null,
        website: profile.website || null,
        address: profile.address || null,
        province: profile.province || null,
        logo: profile.logo || null,
      });
    }
    setIsSaving(false);
    if (res.success) {
      alert(res.message);
    } else {
      alert("เกิดข้อผิดพลาด: " + res.error);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex antialiased w-full">
      {/* SideNavBar */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-[260px] relative">
        <DashboardHeader title="Profile Settings" avatarUrl={role === "company" ? profile.logo : profile.profile_image} />

        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
                {role === "company" ? "Company Profile" : "Student Profile"}
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

                <div 
                  onClick={handleAvatarClick}
                  className="relative mt-4 group cursor-pointer"
                >
                  <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-sm relative bg-slate-100 flex items-center justify-center text-slate-400">
                    {role === "company" ? (
                      profile.logo ? (
                        <img
                          className="w-full h-full object-cover"
                          alt="Company Profile Logo"
                          src={profile.logo}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-bold text-3xl">
                          {profile.company_name ? profile.company_name.charAt(0).toUpperCase() : "C"}
                        </div>
                      )
                    ) : (
                      profile.profile_image ? (
                        <img
                          className="w-full h-full object-cover"
                          alt="Student Profile Avatar"
                          src={profile.profile_image}
                        />
                      ) : (
                        <User className="w-12 h-12 text-slate-400" />
                      )
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />


                <h3 className="text-xl font-bold text-slate-800 mt-4">
                  {role === "company" ? profile.company_name : profile.fullname}
                </h3>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {role === "company" ? profile.province : profile.major}
                </p>

                <div className="w-full mt-6 space-y-4 text-left">
                  {role === "student" ? (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Full Name
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <input
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                            type="text"
                            name="fullname"
                            value={profile.fullname}
                            onChange={handleInputChange}
                          />
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Major
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <input
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                            type="text"
                            name="major"
                            value={profile.major}
                            onChange={handleInputChange}
                          />
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>

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
                          Faculty
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <input
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                            type="text"
                            name="faculty"
                            value={profile.faculty}
                            onChange={handleInputChange}
                          />
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Study Year
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <select
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800 cursor-pointer"
                            name="study_year"
                            value={profile.study_year}
                            onChange={handleInputChange}
                          >
                            <option value={1}>Year 1</option>
                            <option value={2}>Year 2</option>
                            <option value={3}>Year 3</option>
                            <option value={4}>Year 4</option>
                            <option value={5}>Year 5+</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Phone Number
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <input
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                            type="text"
                            name="phone"
                            value={profile.phone}
                            onChange={handleInputChange}
                          />
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>


                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Company Name
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <input
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                            type="text"
                            name="company_name"
                            value={profile.company_name}
                            onChange={handleInputChange}
                          />
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Website URL
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <input
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                            type="text"
                            name="website"
                            value={profile.website}
                            onChange={handleInputChange}
                          />
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Province
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <input
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                            type="text"
                            name="province"
                            value={profile.province}
                            onChange={handleInputChange}
                          />
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Address
                        </label>
                        <div className="flex items-start justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <textarea
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800 min-h-[60px] resize-none"
                            name="address"
                            value={profile.address}
                            onChange={handleInputChange}
                          />
                          <Edit2 className="w-4 h-4 text-slate-400 mt-1" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Description
                        </label>
                        <div className="flex items-start justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <textarea
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800 min-h-[80px] resize-none"
                            name="description"
                            value={profile.description}
                            onChange={handleInputChange}
                          />
                          <Edit2 className="w-4 h-4 text-slate-400 mt-1" />
                        </div>
                      </div>


                    </>
                  )}
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
                    className={`p-3 rounded-xl text-xs font-semibold mb-4 ${passwordMsg.type === "error"
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
              {role === "student" && (
                <SkillsManagement skills={skills} setSkills={setSkills} />
              )}

              {/* Resume & Portfolio Section */}
              {role === "student" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Resume Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 h-full flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Resume
                      </h3>

                      {profile.resume_url ? (
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-red-100 text-red-600 p-2 rounded-lg flex-shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-slate-800 truncate">
                                {profile.resume_url.split("/").pop()}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {profile.resume_url}
                              </p>
                            </div>
                          </div>
                          <a
                            href={profile.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-500 hover:text-blue-700 text-xs font-semibold px-2 py-1"
                          >
                            View
                          </a>
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 flex items-center gap-3 mb-4">
                          <div className="bg-slate-200 text-slate-400 p-2 rounded-lg flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400">
                              No resume uploaded
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Resume URL
                      </label>
                      <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <input
                          className="bg-transparent border-none outline-none w-full text-xs font-semibold text-slate-800"
                          type="text"
                          name="resume_url"
                          placeholder="https://example.com/resume.pdf"
                          value={profile.resume_url}
                          onChange={handleInputChange}
                        />
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </div>
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
              ) : (
                /* Company: showing only External Links Card (adjusting labels for corporate links if necessary) */
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 w-full">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Link2 className="w-5 h-5 text-blue-600" />
                    Corporate Links
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Company LinkedIn
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
                        Company GitHub / GitLab
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
                        Corporate Website
                      </label>
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                        <div className="bg-slate-100 p-2.5 border-r border-slate-200 text-slate-500">
                          <Globe className="w-4 h-4" />
                        </div>
                        <input
                          className="bg-transparent border-none outline-none w-full text-xs font-semibold text-slate-800 px-3 py-2"
                          type="text"
                          name="portfolio"
                          placeholder="https://companywebsite.com"
                          value={profile.portfolio}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
