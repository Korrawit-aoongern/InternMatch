"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { getUserRole } from "@/lib/actions/auth";
import {
    getCompanyInternships,
    createInternship,
    updateInternship,
    deleteInternship,
    getStudentInternships,
    applyToInternship
} from "@/lib/actions/internships";
import { getMasterSkills } from "@/lib/actions/skills";
import {
    PlusCircle,
    Search,
    MapPin,
    MoreVertical,
    Pencil,
    Users,
    Eye,
    X,
    CheckCircle2,
    XCircle,
    Briefcase,
    Trash2,
    ChevronRight,
    ChevronLeft
} from "lucide-react";

export type InternshipStatus = "open" | "closed";

export interface MasterSkill {
    id: number;
    name: string;
    category: string;
}

export interface InternshipSkill {
    id: string;
    skill_id: number;
    name: string;
    category: string;
    level: string;
}

export interface Internship {
    id: string;
    company_id: string;
    title: string;
    department: string;
    location: string;
    internship_type: string;
    status: InternshipStatus;
    applicantsCount: number;
    postedDate: string;
    description?: string;
    responsibilities?: string;
    skills: InternshipSkill[];
}

function CompanyInternshipsView() {
    const [internships, setInternships] = useState<Internship[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<string>("All");
    const router = useRouter();

    // Modal Wizard States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInternship, setEditingInternship] = useState<Internship | null>(null);
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // Skills data lists
    const [masterSkills, setMasterSkills] = useState<MasterSkill[]>([]);
    const [skillSearchQuery, setSkillSearchQuery] = useState("");
    const [selectedSkills, setSelectedSkills] = useState<{
        skill_id: number;
        name: string;
        category: string;
        level: string;
    }[]>([]);

    // View Applicants modal state
    const [viewingApplicantsInternship, setViewingApplicantsInternship] = useState<Internship | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        department: "",
        location: "",
        type: "Hybrid",
        status: "open" as InternshipStatus,
        description: "",
        responsibilities: "",
    });

    const fetchInternships = async () => {
        setIsLoading(true);
        try {
            const res = await getCompanyInternships();
            if (res.success && res.internships) {
                const mapped = res.internships.map((item) => ({
                    id: item.id,
                    company_id: item.company_id,
                    title: item.title,
                    department: item.department || "",
                    location: item.location || "",
                    internship_type: item.internship_type || "Hybrid",
                    status: item.status as InternshipStatus,
                    postedDate: item.created_at,
                    applicantsCount: item.applicant_count || 0,
                    skills: item.skills || [],
                    description: item.description || "",
                    responsibilities: item.responsibilities || ""
                }));
                setInternships(mapped);
            }
        } catch (err) {
            console.error("Failed to load internships:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Load internships and master skills on mount
    useEffect(() => {
        let isMounted = true;
        async function loadInitialData() {
            try {
                const [internshipsRes, skillsRes] = await Promise.all([
                    getCompanyInternships(),
                    getMasterSkills()
                ]);
                if (!isMounted) return;
                if (internshipsRes.success && internshipsRes.internships) {
                    const mapped = internshipsRes.internships.map((item) => ({
                        id: item.id,
                        company_id: item.company_id,
                        title: item.title,
                        department: item.department || "",
                        location: item.location || "",
                        internship_type: item.internship_type || "Hybrid",
                        status: item.status as InternshipStatus,
                        postedDate: item.created_at,
                        applicantsCount: item.applicant_count || 0,
                        skills: item.skills || [],
                        description: item.description || "",
                        responsibilities: item.responsibilities || ""
                    }));
                    setInternships(mapped);
                }
                if (skillsRes.success && skillsRes.skills) {
                    setMasterSkills(skillsRes.skills);
                }
            } catch (err) {
                console.error("Failed to load initial data:", err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }
        loadInitialData();
        return () => {
            isMounted = false;
        };
    }, []);

    // Filtered internships calculation
    const counts = useMemo(() => {
        return {
            All: internships.length,
            Active: internships.filter((item) => item.status === "open").length,
            Closed: internships.filter((item) => item.status === "closed").length,
        };
    }, [internships]);

    const filteredInternships = useMemo(() => {
        return internships.filter((item) => {
            if (activeTab === "Active" && item.status !== "open") return false;
            if (activeTab === "Closed" && item.status !== "closed") return false;

            if (searchQuery.trim() !== "") {
                const query = searchQuery.toLowerCase();
                const matchTitle = item.title.toLowerCase().includes(query);
                const matchLocation = item.location.toLowerCase().includes(query);
                const matchDept = (item.department || "").toLowerCase().includes(query);
                return matchTitle || matchLocation || matchDept;
            }
            return true;
        });
    }, [internships, activeTab, searchQuery]);

    // Open Modal Handlers
    const handleOpenCreateModal = () => {
        setEditingInternship(null);
        setFormData({
            title: "",
            department: "",
            location: "",
            type: "Hybrid",
            status: "open",
            description: "",
            responsibilities: "",
        });
        setSelectedSkills([]);
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (item: Internship) => {
        setEditingInternship(item);
        setFormData({
            title: item.title,
            department: item.department || "",
            location: item.location,
            type: item.internship_type || "Hybrid",
            status: item.status,
            description: item.description || "",
            responsibilities: item.responsibilities || "",
        });
        setSelectedSkills(item.skills.map(s => ({
            skill_id: s.skill_id,
            name: s.name,
            category: s.category,
            level: s.level || "Intermediate"
        })));
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    // Toggle skills selection in Step 2
    const handleToggleSkill = (skill: { id: number; name?: string; category?: string }) => {
        const index = selectedSkills.findIndex(s => s.skill_id === skill.id);
        if (index > -1) {
            setSelectedSkills(selectedSkills.filter(s => s.skill_id !== skill.id));
        } else {
            setSelectedSkills([...selectedSkills, {
                skill_id: skill.id,
                name: skill.name || "",
                category: skill.category || "",
                level: "Intermediate"
            }]);
        }
    };

    const handleToggleSkillLevel = (skillId: number, level: string) => {
        setSelectedSkills(selectedSkills.map(s =>
            s.skill_id === skillId ? { ...s, level } : s
        ));
    };

    // Toggle status quickly
    const handleToggleStatus = async (id: string, newStatus: InternshipStatus) => {
        const res = await updateInternship(id, { status: newStatus });
        if (res.success) {
            fetchInternships();
        } else {
            alert("Failed to update status: " + res.error);
        }
    };

    // Delete Internship Action
    const handleDeleteInternship = async (id: string) => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประกาศรับสมัครฝึกงานนี้?")) {
            const res = await deleteInternship(id);
            if (res.success) {
                fetchInternships();
                setIsModalOpen(false);
                setEditingInternship(null);
            } else {
                alert("Failed to delete internship: " + res.error);
            }
        }
    };

    // Unified Save Handler (inserts matching skills inside same transaction)
    const handleSaveInternship = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.location || !formData.description || !formData.department || !formData.responsibilities) return;

        const skillsPayload = selectedSkills.map(s => ({
            skill_id: s.skill_id,
            level: s.level || "Intermediate"
        }));

        let res;
        if (editingInternship) {
            res = await updateInternship(editingInternship.id, {
                title: formData.title,
                department: formData.department,
                location: formData.location,
                internship_type: formData.type,
                status: formData.status,
                description: formData.description,
                responsibilities: formData.responsibilities,
                skills: skillsPayload
            });
        } else {
            res = await createInternship({
                title: formData.title,
                department: formData.department,
                location: formData.location,
                internship_type: formData.type,
                status: formData.status,
                description: formData.description,
                responsibilities: formData.responsibilities,
                skills: skillsPayload
            });
        }

        if (res.success) {
            setIsModalOpen(false);
            fetchInternships();
        } else {
            alert("Error saving: " + res.error);
        }
    };

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col md:flex-row antialiased w-full">
            {/* Sidebar */}
            <DashboardSidebar />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen w-full">
                {/* Header */}
                <DashboardHeader title="My Internships" />

                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My Internships</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                จัดการและสร้างประกาศรับสมัครนิสิตฝึกงาน ดูจำนวนผู้สมัคร และสถานะการเปิดรับ
                            </p>
                        </div>
                        <button
                            onClick={handleOpenCreateModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Create New Internship
                        </button>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 pt-2">

                        {/* Search Input */}
                        <div className="flex-1 w-full md:max-w-md">
                            <div className="relative w-full">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="ค้นหาประกาศหานิสิตฝึกงาน..."
                                    className=" pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                            {[
                                { label: "All", count: counts.All },
                                { label: "Active", count: counts.Active },
                                { label: "Closed", count: counts.Closed },
                            ].map((tab) => (
                                <button
                                    key={tab.label}
                                    onClick={() => setActiveTab(tab.label)}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${activeTab === tab.label
                                        ? "bg-blue-50 text-blue-600 border-blue-200"
                                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        }`}
                                >
                                    {tab.label === "Active" ? "Active (เปิดรับ)" : tab.label === "Closed" ? "Closed (ปิดรับ)" : "All"} ({tab.count})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Internship Cards Grid */}
                    {isLoading ? (
                        <div className="flex justify-center items-center p-12">
                            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                        </div>
                    ) : filteredInternships.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-base font-semibold text-slate-700">ไม่พบประกาศรับสมัครฝึกงาน</p>
                            <p className="text-xs text-slate-400">ลองเปลี่ยนคำค้นหา หรือสร้างประกาศฝึกงานใหม่</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                            {filteredInternships.map((item) => (
                                <InternshipCardItem
                                    key={item.id}
                                    item={item}
                                    onEdit={() => handleOpenEditModal(item)}
                                    onToggleStatus={handleToggleStatus}
                                    onDelete={() => handleDeleteInternship(item.id)}
                                    onViewApplicants={() => setViewingApplicantsInternship(item)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Modal: Create & Edit Internship (Multi-step) */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                            <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-4xl space-y-4 md:space-y-5 shadow-xl border border-slate-100 max-h-[calc(100vh-2rem)] md:max-h-[90vh] flex flex-col justify-between overflow-hidden">

                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">
                                            {editingInternship ? "แก้ไขประกาศรับสมัครฝึกงาน" : "สร้างประกาศรับสมัครฝึกงานใหม่"}
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            ขั้นตอนที่ {currentStep} จาก 2: {currentStep === 1 ? "กรอกข้อมูลทั่วไป" : "ระบุทักษะที่ต้องการ"}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                    <div
                                        className="bg-blue-600 h-full transition-all duration-300"
                                        style={{ width: `${currentStep * 50}%` }}
                                    />
                                </div>

                                {/* Form content (scrollable area) */}
                                <div className="flex-1 overflow-y-auto py-2 pr-1 space-y-4">
                                    {currentStep === 1 ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                    ชื่อตำแหน่งงาน *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    placeholder="เช่น Software Engineering Intern"
                                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                        แผนก / ฝ่าย *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.department}
                                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                                        placeholder="เช่น Engineering, Marketing"
                                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                        รูปแบบงาน
                                                    </label>
                                                    <select
                                                        value={formData.type}
                                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                                    >
                                                        <option value="Hybrid">Hybrid</option>
                                                        <option value="Remote">Remote</option>
                                                        <option value="On-site">On-site</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                        สถานที่ทำงาน / จังหวัด *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={formData.location}
                                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                        placeholder="เช่น กรุงเทพมหานคร"
                                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                        สถานะประกาศ
                                                    </label>
                                                    <select
                                                        value={formData.status}
                                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as InternshipStatus })}
                                                        className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                                                    >
                                                        <option value="open">Active (เปิดรับสมัคร)</option>
                                                        <option value="closed">Closed (ปิดรับสมัคร)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                    รายละเอียดงาน (Job Description) *
                                                </label>
                                                <textarea
                                                    rows={5}
                                                    required
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    placeholder="รายละเอียดการทำงาน หน้าที่ความรับผิดชอบ..."
                                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                                    หน้าที่ความรับผิดชอบ (Responsibilities) *
                                                </label>
                                                <textarea
                                                    rows={4}
                                                    required
                                                    value={formData.responsibilities}
                                                    onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                                                    placeholder="ระบุหน้าที่ความรับผิดชอบสำหรับตำแหน่งงานนี้..."
                                                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {/* Skill Selection Step */}
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                                    พิมพ์ค้นหาและเลือกทักษะที่เกี่ยวข้อง
                                                </label>
                                                <div className="relative mb-4">
                                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        value={skillSearchQuery}
                                                        onChange={(e) => setSkillSearchQuery(e.target.value)}
                                                        placeholder="ค้นหาทักษะ... เช่น Javascript, React, Figma"
                                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                                    />
                                                </div>
                                            </div>

                                            {/* Selected skills summary list */}
                                            {selectedSkills.length > 0 && (
                                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                                        ทักษะที่เลือกแล้ว ({selectedSkills.length})
                                                    </h3>
                                                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                                                        {selectedSkills.map((s) => (
                                                            <div key={s.skill_id} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                                                                <span className="text-sm font-semibold text-slate-700">{s.name} <span className="text-[10px] text-slate-400">({s.category})</span></span>
                                                                <div className="flex items-center gap-2">
                                                                    <select
                                                                        value={s.level || "Intermediate"}
                                                                        onChange={(e) => handleToggleSkillLevel(s.skill_id, e.target.value)}
                                                                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none bg-slate-50 font-medium"
                                                                    >
                                                                        <option value="Advanced">Advanced (เชี่ยวชาญ)</option>
                                                                        <option value="Intermediate">Intermediate (พอใช้-ปานกลาง)</option>
                                                                        <option value="Beginner">Beginner (ขั้นต้น)</option>
                                                                    </select>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleSkill({ id: s.skill_id })}
                                                                        className="text-rose-500 hover:text-rose-700 font-bold text-sm px-1.5"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Master Skills list grouped by category */}
                                            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                                                {Object.entries(
                                                    masterSkills
                                                        .filter((s) => s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()))
                                                        .reduce<Record<string, MasterSkill[]>>((acc, skill) => {
                                                            acc[skill.category] = acc[skill.category] || [];
                                                            acc[skill.category].push(skill);
                                                            return acc;
                                                        }, {})
                                                ).map(([category, skills]) => (
                                                    <div key={category} className="space-y-1.5">
                                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                            {category}
                                                        </h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {skills.map((skill) => {
                                                                const isSelected = selectedSkills.some((s) => s.skill_id === skill.id);
                                                                return (
                                                                    <button
                                                                        key={skill.id}
                                                                        type="button"
                                                                        onClick={() => handleToggleSkill(skill)}
                                                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${isSelected
                                                                            ? "bg-blue-600 border-blue-600 text-white"
                                                                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                                                            }`}
                                                                    >
                                                                        {skill.name}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                <div className="flex items-center justify-between border-t border-slate-100 pt-4 shrink-0">
                                    <div>
                                        {editingInternship && currentStep === 1 ? (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteInternship(editingInternship.id)}
                                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                ลบประกาศนี้
                                            </button>
                                        ) : <div />}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {currentStep === 1 ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsModalOpen(false)}
                                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                                                >
                                                    ยกเลิก
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (formData.title && formData.location && formData.description && formData.department && formData.responsibilities) {
                                                            setCurrentStep(2);
                                                        } else {
                                                            alert("กรุณากรอกข้อมูลจำเป็นให้ครบถ้วนก่อนไปขั้นตอนถัดไป (*)");
                                                        }
                                                    }}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                                                >
                                                    ถัดไป
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentStep(1)}
                                                    className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-1.5"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                    ย้อนกลับ
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSaveInternship}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                                                >
                                                    {editingInternship ? "บันทึกการแก้ไข" : "สร้างประกาศ"}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal: View Applicants Info */}
                    {viewingApplicantsInternship && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-150 space-y-4 md:space-y-5 shadow-xl border border-slate-100 overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <h3 className="text-lg font-bold text-slate-800">
                                        นิสิตที่สมัครตำแหน่งนี้
                                    </h3>
                                    <button
                                        onClick={() => setViewingApplicantsInternship(null)}
                                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                        <h4 className="text-sm font-bold text-blue-900">{viewingApplicantsInternship.title}</h4>
                                        <p className="text-xs text-blue-700 mt-0.5">{viewingApplicantsInternship.location}</p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-xs font-semibold text-slate-600">จำนวนผู้สมัครทั้งหมด:</span>
                                            <span className="text-xl font-extrabold text-blue-600">
                                                {viewingApplicantsInternship.applicantsCount} คน
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        คุณสามารถดูรายละเอียดรายชื่อนิสิตที่สมัครเข้ามาและจัดการสถานะใบสมัครได้ที่เมนู ผู้สมัคร (Applicants)
                                    </p>
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <button
                                        onClick={() => setViewingApplicantsInternship(null)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                                    >
                                        ปิดหน้าต่าง
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

{/* Card Component */ }
function InternshipCardItem({
    item,
    onEdit,
    onToggleStatus,
    onDelete,
    onViewApplicants
}: {
    item: Internship;
    onEdit: () => void;
    onToggleStatus: (id: string, status: InternshipStatus) => void;
    onDelete: () => void;
    onViewApplicants: () => void;
}) {
    const [showDropdown, setShowDropdown] = useState(false);
    const { status, title, department, location, applicantsCount, postedDate, skills } = item;

    const getStatusStyles = () => {
        switch (status) {
            case "open":
                return {
                    borderLeft: "border-l-4 border-l-blue-600",
                    badgeBg: "bg-blue-50 text-blue-600",
                    dotColor: "bg-blue-600",
                };
            case "closed":
                return {
                    borderLeft: "border-l-4 border-l-rose-600",
                    badgeBg: "bg-rose-50 text-rose-600",
                    dotColor: "border border-rose-600",
                };
            default:
                return {};
        }
    };

    const styles = getStatusStyles();

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div
            className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${styles.borderLeft}`}
        >
            {/* Header Info */}
            <div className="space-y-3">
                <div className="flex items-center justify-between relative">
                    <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${styles.badgeBg}`}
                    >
                        {status === "open" ? (
                            <>
                                <span className={`w-1.5 h-1.5 rounded-full ${styles.dotColor}`} />
                                Active
                            </>
                        ) : (
                            <>
                                <span className="w-1.5 h-1.5 rounded-full border border-rose-600" />
                                Closed
                            </>
                        )}
                    </span>

                    {/* Action menu dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {showDropdown && (
                            <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 text-xs">
                                <button
                                    onClick={() => {
                                        setShowDropdown(false);
                                        onEdit();
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <Pencil className="w-3.5 h-3.5 text-slate-500" />
                                    แก้ไขประกาศ
                                </button>
                                {status !== "open" ? (
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            onToggleStatus(item.id, "open");
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        เปลี่ยนเป็น Active
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            onToggleStatus(item.id, "closed");
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        เปลี่ยนเป็น Closed
                                    </button>
                                )}
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                    onClick={() => {
                                        setShowDropdown(false);
                                        onDelete();
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                    ลบประกาศ
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-base font-bold text-slate-800 line-clamp-1">{title}</h3>
                    <p className="text-xs text-slate-400 font-semibold">{department || "General Department"}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {location}
                    </p>
                </div>

                {/* Skills Section */}
                {skills && skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                        {skills.map((skill) => (
                            <span
                                key={skill.skill_id}
                                className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-blue-50 text-blue-600 border-blue-200"
                            >
                                {skill.name} ({skill.level})
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Middle Applicants Info */}
            <div className="flex items-baseline gap-6 pt-2 border-t border-slate-100">
                {status === "closed" ? (
                    <div>
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            TOTAL APPLICANTS
                        </p>
                        <p className="text-xl font-bold text-slate-800 mt-0.5">{applicantsCount}</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            APPLICANTS
                        </p>
                        <p className="text-xl font-bold text-slate-800 mt-0.5">
                            {applicantsCount !== undefined ? applicantsCount : "0"}
                        </p>
                    </div>
                )}

                <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        {status === "closed" ? "CLOSED ON" : "POSTED"}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{formatDate(postedDate)}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
                {status === "open" ? (
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={onEdit}
                            className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2 px-3 rounded-xl transition-colors"
                        >
                            <Pencil className="w-3.5 h-3.5 text-blue-600" />
                            Edit
                        </button>
                        <button
                            onClick={onViewApplicants}
                            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors shadow-sm"
                        >
                            <Users className="w-3.5 h-3.5" />
                            View ({applicantsCount})
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={onViewApplicants}
                        className="w-full flex items-center justify-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-bold py-2 px-3 rounded-xl hover:bg-blue-50 transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        View Archive ({applicantsCount})
                    </button>
                )}
            </div>
        </div>
    );
}

export default function MyInternshipsPage() {
    const [role, setRole] = useState<string | null>(null);
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function checkRole() {
            try {
                const res = await getUserRole();
                if (!res.success || (res.role !== "company" && res.role !== "student")) {
                    router.push("/dashboard");
                    return;
                }
                setRole(res.role);
                setIsCheckingRole(false);
            } catch (err) {
                console.error("Error checking role in Internships page:", err);
                router.push("/dashboard");
            }
        }
        checkRole();
    }, [router]);

    if (isCheckingRole) {
        return (
            <div className="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center antialiased w-full">
                <div className="flex flex-col items-center justify-center">
                    <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                    <p className="text-sm font-semibold text-slate-500 mt-2">Checking access permissions...</p>
                </div>
            </div>
        );
    }

    if (role === "student") {
        return <StudentInternshipsView />;
    }

    return <CompanyInternshipsView />;
}

function StudentInternshipsView() {
    const [internships, setInternships] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedInternship, setSelectedInternship] = useState<any | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [applyingId, setApplyingId] = useState<string | null>(null);

    const fetchInternships = async () => {
        setIsLoading(true);
        try {
            const res = await getStudentInternships();
            if (res.success && res.internships) {
                setInternships(res.internships);
            }
        } catch (err) {
            console.error("Failed to load student internships:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchInternships();
    }, []);

    const handleApply = async (internshipId: string) => {
        if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการสมัครตำแหน่งงานนี้?")) return;
        setApplyingId(internshipId);
        try {
            const res = await applyToInternship(internshipId);
            if (res.success) {
                alert("สมัครตำแหน่งงานเสร็จสิ้นสำเร็จเรียบร้อย! 🎉");
                fetchInternships();
                if (selectedInternship && selectedInternship.id === internshipId) {
                    setSelectedInternship((prev: any) => prev ? { ...prev, has_applied: true } : null);
                }
            } else {
                alert("เกิดข้อผิดพลาดในการสมัคร: " + res.error);
            }
        } catch (err) {
            console.error("Apply error:", err);
        } finally {
            setApplyingId(null);
        }
    };

    const filteredInternships = useMemo(() => {
        return internships.filter((item) => {
            if (searchQuery.trim() !== "") {
                const query = searchQuery.toLowerCase();
                const matchTitle = item.title.toLowerCase().includes(query);
                const matchCompany = item.company_name.toLowerCase().includes(query);
                const matchDept = item.department.toLowerCase().includes(query);
                const matchLocation = item.location.toLowerCase().includes(query);
                return matchTitle || matchCompany || matchDept || matchLocation;
            }
            return true;
        });
    }, [internships, searchQuery]);

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col md:flex-row antialiased w-full">
            <DashboardSidebar />
            <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen w-full">
                <DashboardHeader title="My Internships" />
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My Internships</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                ค้นหาและยื่นใบสมัครรับเลือกเป็นนิสิตฝึกงานกับบริษัทชั้นนำ
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 w-full md:max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาตามตำแหน่ง, ฝ่าย หรือบริษัท..."
                                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm w-full"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center p-12">
                            <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                        </div>
                    ) : filteredInternships.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-base font-semibold text-slate-700">ไม่พบประกาศรับสมัครฝึกงาน</p>
                            <p className="text-xs text-slate-400">ลองใช้คำค้นหาอื่นดูอีกครั้ง</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                            {filteredInternships.map((item) => (
                                <StudentInternshipCardItem
                                    key={item.id}
                                    item={item}
                                    onViewDetails={() => {
                                        setSelectedInternship(item);
                                        setIsDetailsOpen(true);
                                    }}
                                    onApply={() => handleApply(item.id)}
                                    isApplying={applyingId === item.id}
                                />
                            ))}
                        </div>
                    )}

                    {isDetailsOpen && selectedInternship && (
                        <StudentInternshipDetailsModal
                            item={selectedInternship}
                            onClose={() => {
                                setIsDetailsOpen(false);
                                setSelectedInternship(null);
                            }}
                            onApply={() => handleApply(selectedInternship.id)}
                            isApplying={applyingId === selectedInternship.id}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}

function StudentInternshipCardItem({
    item,
    onViewDetails,
    onApply,
    isApplying
}: {
    item: any;
    onViewDetails: () => void;
    onApply: () => void;
    isApplying: boolean;
}) {
    const { title, company_name, location, internship_type, has_applied, skills } = item;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden border-l-4 border-l-blue-600">
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
                        {internship_type}
                    </span>
                    {has_applied && (
                        <span className="text-[10px] font-bold tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-md uppercase">
                            APPLIED
                        </span>
                    )}
                </div>

                <div>
                    <h3 className="text-base font-bold text-slate-800 line-clamp-1">{title}</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{company_name}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {location}
                    </p>
                </div>

                {skills && skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {skills.map((skill: any) => (
                            <span
                                key={skill.skill_id}
                                className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200"
                            >
                                {skill.name} ({skill.level})
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                    onClick={onViewDetails}
                    className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2 px-3 rounded-xl transition-colors"
                >
                    View Details
                </button>
                {has_applied ? (
                    <button
                        disabled
                        className="bg-green-100 text-green-700 text-xs font-bold py-2 px-3 rounded-xl cursor-not-allowed opacity-90 text-center"
                    >
                        Applied
                    </button>
                ) : (
                    <button
                        onClick={onApply}
                        disabled={isApplying}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1"
                    >
                        {isApplying ? "Applying..." : "Apply Now"}
                    </button>
                )}
            </div>
        </div>
    );
}

function StudentInternshipDetailsModal({
    item,
    onClose,
    onApply,
    isApplying
}: {
    item: any;
    onClose: () => void;
    onApply: () => void;
    isApplying: boolean;
}) {
    const { title, company_name, location, internship_type, description, responsibilities, skills, has_applied } = item;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-2xl space-y-4 shadow-xl border border-slate-100 max-h-[90vh] flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">{company_name}</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2">
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
                            รูปแบบงาน: {internship_type}
                        </span>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            สถานที่: {location}
                        </span>
                    </div>

                    <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">รายละเอียดงาน (Job Description)</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {description || "ไม่มีข้อมูลรายละเอียด"}
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">หน้าที่ความรับผิดชอบ (Responsibilities)</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                            {responsibilities || "ไม่มีข้อมูลหน้าที่ความรับผิดชอบ"}
                        </p>
                    </div>

                    {skills && skills.length > 0 && (
                        <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">ทักษะที่ต้องการ (Required Skills)</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {skills.map((skill: any) => (
                                    <span
                                        key={skill.skill_id}
                                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border bg-blue-50 text-blue-600 border-blue-100"
                                    >
                                        {skill.name} ({skill.level})
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-100 pt-3 shrink-0 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">
                        ปิดหน้าต่าง
                    </button>
                    {has_applied ? (
                        <button
                            disabled
                            className="bg-green-100 text-green-700 text-sm font-semibold px-5 py-2 rounded-xl cursor-not-allowed"
                        >
                            Applied
                        </button>
                    ) : (
                        <button
                            onClick={onApply}
                            disabled={isApplying}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                            {isApplying ? "Applying..." : "Apply Now"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
