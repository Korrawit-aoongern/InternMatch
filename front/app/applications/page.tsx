"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { getUserRole } from "@/lib/actions/auth";
import { getStudentApplications } from "@/lib/actions/internships";
import {
    Search,
    SlidersHorizontal,
    ArrowUpDown,
    Eye,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    X,
    Briefcase
} from "lucide-react";

interface ApplicationItem {
    id: string;
    match_score: number;
    status: string;
    applied_at: string;
    internship_id: string;
    title: string;
    company_name: string;
    company_logo: string;
    company_province: string;
    description: string;
    responsibilities: string;
    location: string;
    internship_type: string;
}

export default function ApplicationsPage() {
    const [role, setRole] = useState<string | null>(null);
    const [isCheckingRole, setIsCheckingRole] = useState(true);
    const [applications, setApplications] = useState<ApplicationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Filters and Sorting States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [sortField, setSortField] = useState<"applied_at" | "match_score">("applied_at");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4; // Display 4 entries per page as requested

    // Modal state
    const [selectedApplication, setSelectedApplication] = useState<ApplicationItem | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Authorization check
    useEffect(() => {
        async function checkRole() {
            try {
                const res = await getUserRole();
                if (!res.success || (res.role !== "student" && res.role !== "company")) {
                    router.push("/dashboard");
                    return;
                }
                if (res.role === "company") {
                    // Redirect company users to Internships where they manage applicants
                    router.push("/dashboard/Internships");
                    return;
                }
                setRole(res.role);
                setIsCheckingRole(false);
            } catch (err) {
                console.error("Error checking role in Applications page:", err);
                router.push("/dashboard");
            }
        }
        checkRole();
    }, [router]);

    // Fetch applications
    useEffect(() => {
        if (role === "student") {
            const fetchApps = async () => {
                setIsLoading(true);
                try {
                    const res = await getStudentApplications();
                    if (res.success && res.applications) {
                        setApplications(res.applications);
                    }
                } catch (err) {
                    console.error("Failed to load applications:", err);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchApps();
        }
    }, [role]);

    // Handle status filtering, searching, and sorting
    const filteredAndSortedApplications = useMemo(() => {
        let result = [...applications];

        // 1. Status Filter
        if (statusFilter !== "All") {
            result = result.filter(
                (item) => item.status.toLowerCase() === statusFilter.toLowerCase()
            );
        }

        // 2. Search query filter
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (item) =>
                    item.company_name.toLowerCase().includes(query) ||
                    item.title.toLowerCase().includes(query)
            );
        }

        // 3. Sorting
        result.sort((a, b) => {
            let valA: any = a[sortField];
            let valB: any = b[sortField];

            if (sortField === "applied_at") {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [applications, statusFilter, searchQuery, sortField, sortDirection]);

    // Reset pagination when filter/search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, sortField, sortDirection]);

    // Pagination calculations
    const totalEntries = filteredAndSortedApplications.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));
    const paginatedApplications = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedApplications.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedApplications, currentPage]);

    const startIndexLabel = totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endIndexLabel = Math.min(currentPage * itemsPerPage, totalEntries);

    const toggleSort = () => {
        if (sortField === "applied_at") {
            setSortField("match_score");
            setSortDirection("desc");
        } else {
            setSortField("applied_at");
            setSortDirection("desc");
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });
        } catch {
            return dateStr;
        }
    };

    const renderStatusBadge = (status: string) => {
        const normalized = status.toLowerCase();
        switch (normalized) {
            case "reviewing":
                return (
                    <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
                        Reviewing
                    </span>
                );
            case "accepted":
                return (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accepted
                    </span>
                );
            case "rejected":
                return (
                    <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-500">
                        Rejected
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        Pending
                    </span>
                );
        }
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
            <DashboardSidebar />
            <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen w-full">
                <DashboardHeader title="Applications" />
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 font-sans">Applications</h1>
                        <p className="text-sm text-slate-500 mt-1 font-sans">
                            ติดตามสถานะการสมัครงานและประเมินผลคะแนนความเหมาะสมของคุณ
                        </p>
                    </div>

                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {/* Search bar ฝั่งซ้าย */}
                        <div className="relative w-full sm:max-w-xs">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search applications..."
                                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm "
                            />
                        </div>

                        {/* Filter และ Sort ฝั่งขวา */}
                        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                                    className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filter{statusFilter !== "All" && `: ${statusFilter}`}
                                </button>
                                {isFilterDropdownOpen && (
                                    <div className="absolute right-0 mt-1.5 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-10 p-1">
                                        {["All", "Pending", "Reviewing", "Accepted", "Rejected"].map((status) => (
                                            <button
                                                key={status}
                                                onClick={() => {
                                                    setStatusFilter(status);
                                                    setIsFilterDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors ${
                                                    statusFilter === status
                                                        ? "text-blue-600 bg-blue-50/55 font-bold"
                                                        : "text-slate-600 font-medium"
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={toggleSort}
                                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
                            >
                                <ArrowUpDown className="h-4 w-4" />
                                Sort: {sortField === "applied_at" ? "Date" : "Match %"}
                            </button>
                        </div>
                    </div>

                    {/* Applications Table Card */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
                        {isLoading ? (
                            <div className="flex justify-center items-center p-12">
                                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                            </div>
                        ) : paginatedApplications.length === 0 ? (
                            <div className="p-12 text-center text-slate-500 space-y-3">
                                <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                                <p className="text-base font-semibold text-slate-700">ไม่พบรายการใบสมัครงาน</p>
                                <p className="text-xs text-slate-400">ลองตรวจสอบตัวกรองหรือค้นหาอีกครั้ง</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto w-full">
                                <table className="min-w-full divide-y divide-slate-100">
                                    <thead className="bg-slate-50/75">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                COMPANY & POSITION
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                MATCH SCORE
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                APPLIED DATE
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                STATUS
                                            </th>
                                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                ACTION
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-100">
                                        {paginatedApplications.map((item) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                {/* Company & Position */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center shrink-0 overflow-hidden font-bold text-sm text-slate-500">
                                                            {item.company_logo ? (
                                                                <img
                                                                    src={item.company_logo}
                                                                    alt={item.company_name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                item.company_name.substring(0, 2).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-800">
                                                                {item.company_name}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-medium">
                                                                {item.title}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Match Score */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden shrink-0">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${item.match_score}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-xs font-bold text-slate-700">
                                                            {item.match_score}%
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Applied Date */}
                                                <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-600">
                                                    {formatDate(item.applied_at)}
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {renderStatusBadge(item.status)}
                                                </td>

                                                {/* Action */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedApplication(item);
                                                            setIsDetailsOpen(true);
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Footer */}
                        {!isLoading && totalEntries > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/20">
                                <span className="text-xs font-semibold text-slate-500">
                                    Showing {startIndexLabel} to {endIndexLabel} of {totalEntries} entries
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${
                                                currentPage === page
                                                    ? "bg-blue-600 text-white"
                                                    : "border border-slate-200 text-slate-600 hover:bg-white hover:text-slate-800"
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* View Details Modal */}
                    {isDetailsOpen && selectedApplication && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                            <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-150 space-y-4 md:space-y-5 shadow-xl border border-slate-100 overflow-hidden">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800">
                                            {selectedApplication.title}
                                        </h2>
                                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                            {selectedApplication.company_name} ({selectedApplication.company_province})
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsDetailsOpen(false);
                                            setSelectedApplication(null);
                                        }}
                                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-2">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
                                            รูปแบบงาน: {selectedApplication.internship_type || "Hybrid"}
                                        </span>
                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                            สถานที่: {selectedApplication.location || "Bangkok"}
                                        </span>
                                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
                                            Match Score: {selectedApplication.match_score}%
                                        </span>
                                        <span className="text-xs font-bold bg-slate-50 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-100">
                                            Applied on {formatDate(selectedApplication.applied_at)}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">รายละเอียดงาน (Job Description)</h4>
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {selectedApplication.description || "ไม่มีข้อมูลรายละเอียดงาน"}
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">หน้าที่ความรับผิดชอบ (Responsibilities)</h4>
                                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {selectedApplication.responsibilities || "ไม่มีข้อมูลหน้าที่ความรับผิดชอบ"}
                                        </p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">สถานะใบสมัคร (Application Status)</h4>
                                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {renderStatusBadge(selectedApplication.status)}
                                            <span className="text-xs font-medium text-slate-500">
                                                {selectedApplication.status.toLowerCase() === "accepted"
                                                    ? "ยินดีด้วย! บริษัทได้รับใบสมัครของคุณเรียบร้อยแล้วและอนุมัติการสมัคร"
                                                    : selectedApplication.status.toLowerCase() === "rejected"
                                                    ? "น่าเสียดาย บริษัทปฏิเสธใบสมัครของคุณแล้วในรอบนี้"
                                                    : selectedApplication.status.toLowerCase() === "reviewing"
                                                    ? "บริษัทกำลังอยู่ระหว่างการพิจารณาตรวจสอบข้อมูลของคุณ"
                                                    : "ใบสมัครของคุณถูกส่งแล้วและอยู่ในคิวรอการตรวจสอบ"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-3 shrink-0 flex justify-end">
                                    <button
                                        onClick={() => {
                                            setIsDetailsOpen(false);
                                            setSelectedApplication(null);
                                        }}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
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
