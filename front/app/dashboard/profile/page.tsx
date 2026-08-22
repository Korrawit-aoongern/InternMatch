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
  Trash2,
  Upload,
  Loader2,
  Plus,
} from "lucide-react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import SkillsManagement from "@/components/ui/SkillsManagement";
import { getStudentProfile, updateStudentProfile, getCompanyProfile, updateCompanyProfile, uploadProfileImage, changeUserPassword, uploadResume } from "@/lib/actions/auth";
import { getStudentSkills, updateStudentSkills } from "@/lib/actions/skills";
import { getStudentPortfolios, updateStudentPortfolios } from "@/lib/actions/portfolios";

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
  gpa: string | number;
  internship_period: string;
  profile_image: string;
  resume_path: string;
  resume_url: string;
  email: string;

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
  const resumeInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);

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

  const handleResumeUploadClick = () => {
    resumeInputRef.current?.click();
  };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingResume(true);
    try {
      const res = await uploadResume(formData);
    if (res.success && res.url) {
      setProfile((prev) => ({
        ...prev,
        resume_path: res.path || "",
        resume_url: res.url || "",
      }));
      } else {
        alert("Upload failed: " + res.error);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("An error occurred during file upload.");
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleDeleteResume = () => {
    if (confirm("Are you sure you want to delete your resume?")) {
      setProfile((prev) => ({
        ...prev,
        resume_path: "",
        resume_url: "",
      }));
    }
  };

  
  const [profile, setProfile] = useState<StudentProfile>({
    fullname: "",
    phone: "",
    university: "",
    faculty: "",
    major: "",
    study_year: 1,
    gpa: "",
    internship_period: "",
    profile_image: "",
    resume_path: "",
    resume_url: "",
    email: "",

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

  const [companyLinks, setCompanyLinks] = useState<string[]>([""]);

  const handleCompanyLinkChange = (index: number, val: string) => {
    setCompanyLinks((prev) => {
      const updated = [...prev];
      updated[index] = val;
      return updated;
    });
  };

  const handleAddCompanyLink = () => {
    if (companyLinks.length < 3) {
      setCompanyLinks((prev) => [...prev, ""]);
    }
  };

  const handleRemoveCompanyLink = (index: number) => {
    setCompanyLinks((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length > 0 ? updated : [""];
    });
  };

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

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const studentRes = await getStudentProfile();
        if (studentRes.success && studentRes.profile) {
          setRole("student");
          const p = studentRes.profile;

          // โหลด Portfolio/External Links ของนักศึกษาจริงๆ จากฐานข้อมูล
          const portfoliosRes = await getStudentPortfolios();
          let linkedinUrl = "";
          let githubUrl = "";
          let portfolioUrl = "";
          if (portfoliosRes.success && portfoliosRes.portfolios) {
            portfoliosRes.portfolios.forEach((port: any) => {
              if (port.title === "LinkedIn") linkedinUrl = port.url || "";
              else if (port.title === "GitHub") githubUrl = port.url || "";
              else if (port.title === "Portfolio") portfolioUrl = port.url || "";
            });
          }

          // โหลดข้อมูลอีเมล
          const userEmail = p.users ? (Array.isArray(p.users) ? p.users[0]?.email : (p.users as any).email) : "";

          setProfile((prev) => ({
            ...prev,
            fullname: p.fullname || "",
            phone: p.phone || "",
            university: p.university || "",
            faculty: p.faculty || "",
            major: p.major || "",
            study_year: p.study_year || 1,
            gpa: p.gpa || "",
            internship_period: p.internship_period || "",
            profile_image: p.profile_image || "",
            resume_path: p.resume_path || "",
            resume_url: p.resume_url || "",
            linkedin: linkedinUrl,
            github: githubUrl,
            portfolio: portfolioUrl,
            email: userEmail || "",
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
          const userEmail = c.users ? (Array.isArray(c.users) ? c.users[0]?.email : (c.users as any).email) : "";

          let parsedLinks: string[] = [];
          if (c.website) {
            try {
              if (c.website.startsWith("[")) {
                parsedLinks = JSON.parse(c.website);
              } else {
                parsedLinks = c.website.split(",").map((s: string) => s.trim()).filter(Boolean);
              }
            } catch {
              parsedLinks = [c.website];
            }
          }
          if (parsedLinks.length === 0) parsedLinks = [""];
          setCompanyLinks(parsedLinks.slice(0, 3));

          setProfile((prev) => ({
            ...prev,
            company_name: c.company_name || "",
            description: c.description || "",
            website: c.website || "",
            address: c.address || "",
            province: c.province || "",
            logo: c.logo || "",
            email: userEmail || "",
          }));
        }
      } finally {
        setIsLoadingProfile(false);
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
        gpa: profile.gpa || null,
        internship_period: profile.internship_period || null,
        profile_image: profile.profile_image || null,
        resume_path: profile.resume_path || null,
      });

      if (res.success) {
        // บันทึกทักษะของนักศึกษาลงฐานข้อมูล
        const skillsToSave = skills.map((s) => ({
          skill_id: s.skill_id,
          level: s.level,
        }));
        const skillsRes = await updateStudentSkills(skillsToSave);
        if (skillsRes.success) {
          // บันทึกลิงก์ภายนอกลงฐานข้อมูล portfolios
          const portfoliosToSave = [
            { title: "LinkedIn", url: profile.linkedin },
            { title: "GitHub", url: profile.github },
            { title: "Portfolio", url: profile.portfolio },
          ];
          const portfoliosRes = await updateStudentPortfolios(portfoliosToSave);
          if (!portfoliosRes.success) {
            res = { success: false, error: `โปรไฟล์และทักษะบันทึกสำเร็จ แต่ลิงก์ภายนอกบันทึกไม่สำเร็จ: ${portfoliosRes.error}` };
          }
        } else {
          res = { success: false, error: `โปรไฟล์บันทึกสำเร็จ แต่ทักษะบันทึกไม่สำเร็จ: ${skillsRes.error}` };
        }
      }
    } else {
      const joinedWebsite = companyLinks.map((l) => l.trim()).filter(Boolean).join(", ");
      res = await updateCompanyProfile({
        company_name: profile.company_name,
        description: profile.description || null,
        website: joinedWebsite || null,
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

  if (isLoadingProfile) {
    return (
      <div className="bg-slate-50 text-slate-900 min-h-screen flex antialiased w-full">
        <DashboardSidebar />
        <main className="flex-1 flex flex-col min-w-0 md:ml-[260px] relative">
          <DashboardHeader title="Profile Settings" />
          <div className="p-12 flex flex-col items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-500">Loading Profile...</p>
          </div>
        </main>
      </div>
    );
  }

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
                          Email Address
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-100 opacity-70 transition-all">
                          <input
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-500 cursor-not-allowed"
                            type="email"
                            name="email"
                            value={profile.email}
                            disabled
                          />
                          <Lock className="w-4 h-4 text-slate-400" />
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
                          GPA (เกรดเฉลี่ยสะสม)
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <input
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                            type="text"
                            name="gpa"
                            placeholder="3.50"
                            value={profile.gpa}
                            onChange={handleInputChange}
                          />
                          <Edit2 className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Internship Period (ช่วงเวลาที่สะดวกฝึกงาน)
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                          <input
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-800"
                            type="text"
                            name="internship_period"
                            placeholder="มิ.ย. - ส.ค. 2568"
                            value={profile.internship_period}
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
                          Email Address
                        </label>
                        <div className="flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2 bg-slate-100 opacity-70 transition-all">
                          <input
                            className="bg-transparent border-none outline-none w-full text-sm font-semibold text-slate-500 cursor-not-allowed"
                            type="email"
                            name="email"
                            value={profile.email}
                            disabled
                          />
                          <Lock className="w-4 h-4 text-slate-400" />
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
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/60 flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3 overflow-hidden mr-2">
                            <div className="bg-red-100 text-red-600 p-2.5 rounded-lg flex-shrink-0">
                              <FileText className="w-6 h-6" />
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
                          <div className="flex items-center gap-2">
                            <a
                              href={profile.resume_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </a>
                            <button
                              type="button"
                              onClick={handleDeleteResume}
                              className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 text-xs font-bold p-1.5 rounded-lg transition-colors"
                              title="Delete Resume"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          onClick={handleResumeUploadClick}
                          className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all mb-4 text-center group"
                        >
                          {isUploadingResume ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                              <p className="text-xs font-bold text-slate-500">Uploading...</p>
                            </div>
                          ) : (
                            <>
                              <div className="bg-slate-100 group-hover:bg-blue-100 text-slate-400 group-hover:text-blue-600 p-3 rounded-full transition-colors mb-2">
                                <Upload className="w-6 h-6" />
                              </div>
                              <p className="text-xs font-bold text-slate-700">Click to upload resume</p>
                              <p className="text-[10px] text-slate-400 mt-1">PDF, Word, or images</p>
                            </>
                          )}
                        </div>
                      )}
                      
                      <input
                        type="file"
                        ref={resumeInputRef}
                        onChange={handleResumeFileChange}
                        accept=".pdf,.doc,.docx,image/*"
                        className="hidden"
                      />
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
                /* Company: dynamic up-to-3 website links panel */
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 w-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      Company Websites & Links
                    </h3>
                    <span className="text-xs font-semibold text-slate-400">
                      {companyLinks.length}/3 links
                    </span>
                  </div>

                  <div className="space-y-4">
                    {companyLinks.map((link, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Website / Link #{idx + 1}
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <div className="bg-slate-100 p-2.5 border-r border-slate-200 text-slate-500">
                              <Globe className="w-4 h-4" />
                            </div>
                            <input
                              className="bg-transparent border-none outline-none w-full text-xs font-semibold text-slate-800 px-3 py-2"
                              type="url"
                              placeholder="https://companywebsite.com"
                              value={link}
                              onChange={(e) => handleCompanyLinkChange(idx, e.target.value)}
                            />
                          </div>
                          {companyLinks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveCompanyLink(idx)}
                              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="Remove Link"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {companyLinks.length < 3 && (
                      <button
                        type="button"
                        onClick={handleAddCompanyLink}
                        className="w-full mt-2 py-2.5 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-blue-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Add Website Link
                      </button>
                    )}
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
