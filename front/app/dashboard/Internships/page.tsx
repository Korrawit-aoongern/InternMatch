"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { getUserRole } from "@/lib/actions/auth";
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
    Building2,
    Calendar,
    Briefcase,
    Trash2
} from "lucide-react";

export type InternshipStatus = "Active" | "Draft" | "Closed";

export interface Internship {
    id: string;
    title: string;
    department?: string;
    location: string;
    type: string; // e.g. "Hybrid", "Remote", "On-site"
    status: InternshipStatus;
    applicantsCount: number;
    postedDate: string;
    description?: string;
    requirements?: string;
}

const STORAGE_KEY = "internmatch_my_internships";

const INITIAL_INTERNSHIPS: Internship[] = [
    {
        id: "1",
        title: "Software Engineering Intern",
        department: "Engineering",
        location: "Bangkok, Thailand (Hybrid)",
        type: "Hybrid",
        status: "Active",
        applicantsCount: 142,
        postedDate: "2023-10-12",
        description: "Join our core engineering team to build modern web applications using Next.js, React, and TypeScript.",
        requirements: "Basic knowledge of React/Next.js, Git, and REST APIs."
    },
    {
        id: "2",
        title: "Data Science Intern",
        department: "Analytics",
        location: "Remote",
        type: "Remote",
        status: "Active",
        applicantsCount: 87,
        postedDate: "2023-10-15",
        description: "Analyze large datasets and build baseline machine learning models to support business decisions.",
        requirements: "Python, SQL, Pandas, Scikit-learn."
    },
    {
        id: "3",
        title: "UX Design Intern",
        department: "Design",
        location: "Bangkok, Thailand (On-site)",
        type: "On-site",
        status: "Draft",
        applicantsCount: 0,
        postedDate: "2023-10-18",
        description: "Create wireframes, user flows, and interactive prototypes for our student internship portal.",
        requirements: "Figma proficiency, strong portfolio, basic UI/UX methodology."
    },
    {
        id: "4",
        title: "Product Marketing Intern",
        department: "Marketing",
        location: "Chiang Mai, Thailand (On-site)",
        type: "On-site",
        status: "Closed",
        applicantsCount: 215,
        postedDate: "2023-09-30",
        description: "Assist with digital campaign execution and social media strategy.",
        requirements: "Content creation, digital marketing basics."
    }
];

export default function MyInternshipsPage() {
    const [internships, setInternships] = useState<Internship[]>(INITIAL_INTERNSHIPS);
    const [isLoaded, setIsLoaded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<string>("All");
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const router = useRouter();

    // Check user role before rendering the page content
    useEffect(() => {
        async function checkRole() {
            try {
                const res = await getUserRole();
                if (!res.success || res.role !== "company") {
                    router.push("/dashboard");
                    return;
                }
                setIsCheckingRole(false);
            } catch (err) {
                console.error("Error checking role in Internships page:", err);
                router.push("/dashboard");
            }
        }
        checkRole();
    }, [router]);

    // Load initial data from localStorage after mounting
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                const parsed = JSON.parse(savedData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setInternships(parsed);
                }
            }
        } catch (e) {
            console.error("Failed to load internships from localStorage:", e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    // Save to localStorage whenever internships state changes (only after initial load)
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(internships));
        } catch (e) {
            console.error("Failed to save internships to localStorage:", e);
        }
    }, [internships, isLoaded]);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingInternship, setEditingInternship] = useState<Internship | null>(null);

    // View Applicants modal state
    const [viewingApplicantsInternship, setViewingApplicantsInternship] = useState<Internship | null>(null);

    // Form fields
    const [formData, setFormData] = useState({
        title: "",
        department: "",
        location: "",
        type: "Hybrid",
        status: "Active" as InternshipStatus,
        description: "",
        requirements: ""
    });

    // Counts calculation
    const counts = useMemo(() => {
        return {
            All: internships.length,
            Active: internships.filter((item) => item.status === "Active").length,
            Drafts: internships.filter((item) => item.status === "Draft").length,
            Closed: internships.filter((item) => item.status === "Closed").length,
        };
    }, [internships]);

    // Filtered internships search & tab filter
    const filteredInternships = useMemo(() => {
        return internships.filter((item) => {
            // Tab filter
            if (activeTab === "Active" && item.status !== "Active") return false;
            if (activeTab === "Drafts" && item.status !== "Draft") return false;
            if (activeTab === "Closed" && item.status !== "Closed") return false;

            // Search filter
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

    // Open modal to create
    const handleOpenCreateModal = () => {
        setEditingInternship(null);
        setFormData({
            title: "",
            department: "",
            location: "",
            type: "Hybrid",
            status: "Active",
            description: "",
            requirements: ""
        });
        setIsModalOpen(true);
    };

    // Open modal to edit
    const handleOpenEditModal = (item: Internship) => {
        setEditingInternship(item);
        setFormData({
            title: item.title,
            department: item.department || "",
            location: item.location,
            type: item.type || "Hybrid",
            status: item.status,
            description: item.description || "",
            requirements: item.requirements || ""
        });
        setIsModalOpen(true);
    };

    // Toggle status quickly
    const handleToggleStatus = (id: string, newStatus: InternshipStatus) => {
        setInternships((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
        );
    };

    // Delete Internship
    const handleDeleteInternship = (id: string) => {
        if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบประกาศรับสมัครฝึกงานนี้?")) {
            setInternships((prev) => prev.filter((item) => item.id !== id));
            if (editingInternship?.id === id) {
                setIsModalOpen(false);
                setEditingInternship(null);
            }
        }
    };

    // Save Internship (Create / Edit)
    const handleSaveInternship = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.location) return;

        if (editingInternship) {
            // Edit existing
            setInternships((prev) =>
                prev.map((item) =>
                    item.id === editingInternship.id
                        ? {
                            ...item,
                            title: formData.title,
                            department: formData.department,
                            location: formData.location,
                            type: formData.type,
                            status: formData.status,
                            description: formData.description,
                            requirements: formData.requirements
                        }
                        : item
                )
            );
        } else {
            // Create new
            const newId = Date.now().toString();
            const today = new Date().toISOString().split("T")[0];
            const newItem: Internship = {
                id: newId,
                title: formData.title,
                department: formData.department,
                location: formData.location,
                type: formData.type,
                status: formData.status,
                applicantsCount: 0,
                postedDate: today,
                description: formData.description,
                requirements: formData.requirements
            };
            setInternships((prev) => [newItem, ...prev]);
        }
        setIsModalOpen(false);
    };

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
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="ค้นหาประกาศหานิสิตฝึกงาน..."
                                className=" pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Status Filter Tabs */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                            {[
                                { label: "All", count: counts.All },
                                { label: "Active", count: counts.Active },
                                { label: "Drafts", count: counts.Drafts },
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
                                    {tab.label} ({tab.count})
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Internship Cards Grid */}
                    {filteredInternships.length === 0 ? (
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

                    {/* Modal: Create & Edit Internship */}
                    {isModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                            <div className="bg-white rounded-2xl p-6 space-y-5 shadow-xl border border-slate-100">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">
                                            {editingInternship ? "แก้ไขประกาศรับสมัครฝึกงาน" : "สร้างประกาศรับสมัครฝึกงานใหม่"}
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-1">
                                            กรอกข้อมูลตำแหน่งงาน หน้าที่ และคุณสมบัติที่ต้องการ
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveInternship} className="space-y-4">
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
                                                แผนก / ฝ่าย
                                            </label>
                                            <input
                                                type="text"
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
                                                placeholder="เช่น กรุงเทพมหานคร (Hybrid)"
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
                                                <option value="Active">Active (เปิดรับสมัคร)</option>
                                                <option value="Draft">Draft (ฉบับร่าง)</option>
                                                <option value="Closed">Closed (ปิดรับสมัคร)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            รายละเอียดงาน (Job Description)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="รายละเอียดการทำงาน หน้าที่ความรับผิดชอบ..."
                                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                            คุณสมบัติผู้สมัคร (Requirements)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={formData.requirements}
                                            onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                                            placeholder="ทักษะ เกรดเฉลี่ย สาขาที่เปิดรับ..."
                                            className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        {editingInternship ? (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteInternship(editingInternship.id)}
                                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                ลบประกาศนี้
                                            </button>
                                        ) : <div />}
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(false)}
                                                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="submit"
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                                            >
                                                {editingInternship ? "บันทึกการแก้ไข" : "สร้างประกาศ"}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Modal: View Applicants Info */}
                    {viewingApplicantsInternship && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl p-6 space-y-5 shadow-xl border border-slate-100">
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
    const { status, title, location, applicantsCount, postedDate } = item;

    const getStatusStyles = () => {
        switch (status) {
            case "Active":
                return {
                    borderLeft: "border-l-4 border-l-blue-600",
                    badgeBg: "bg-blue-50 text-blue-600",
                    dotColor: "bg-blue-600",
                };
            case "Draft":
                return {
                    borderLeft: "border-l-4 border-l-slate-300",
                    badgeBg: "bg-slate-100 text-slate-600",
                    dotColor: "",
                };
            case "Closed":
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
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${styles.badgeBg}`}
                    >
                        {status === "Active" && (
                            <span className={`w-1.5 h-1.5 rounded-full ${styles.dotColor}`} />
                        )}
                        {status === "Draft" && (
                            <span className="text-[10px]">📄</span>
                        )}
                        {status === "Closed" && (
                            <span className="w-1.5 h-1.5 rounded-full border border-rose-600" />
                        )}
                        {status}
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
                                {status !== "Active" && (
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            onToggleStatus(item.id, "Active");
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        เปลี่ยนเป็น Active
                                    </button>
                                )}
                                {status !== "Closed" && (
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            onToggleStatus(item.id, "Closed");
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        เปลี่ยนเป็น Closed
                                    </button>
                                )}
                                {status !== "Draft" && (
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            onToggleStatus(item.id, "Draft");
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <Briefcase className="w-3.5 h-3.5" />
                                        เปลี่ยนเป็น Draft
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
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {location}
                    </p>
                </div>
            </div>

            {/* Middle Applicants Info */}
            <div className="flex items-baseline gap-6 pt-2 border-t border-slate-100">
                {status === "Closed" ? (
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
                            {applicantsCount !== undefined ? applicantsCount : "--"}
                        </p>
                    </div>
                )}

                <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        {status === "Draft" ? "LAST EDITED" : status === "Closed" ? "CLOSED ON" : "POSTED"}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{formatDate(postedDate)}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
                {status === "Active" && (
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
                )}

                {status === "Draft" && (
                    <button
                        onClick={onEdit}
                        className="w-full flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2 px-3 rounded-xl transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5" />
                        Continue Editing
                    </button>
                )}

                {status === "Closed" && (
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
