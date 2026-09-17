"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { getUserRole } from "@/lib/actions/auth";
import { getCachedRole, setCachedRole } from "@/lib/utils/roleCache";
import {
    getStudentApplications,
    getCompanyInternships,
    getInternshipApplicants,
    updateApplicationStatus
} from "@/lib/actions/internships";
import {
    Search,
    SlidersHorizontal,
    ArrowUpDown,
    Eye,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    X,
    Briefcase,
    Users,
    FileText,
    Mail,
    Phone,
    Globe,
    Code,
    Link2,
    Download
} from "lucide-react";
import { useToast } from "@/components/ui/Toaster";
import { useAppModal } from "@/components/ui/AppModal";

interface StudentApplicationItem {
    id: string;
    match_score: number;
    status: string;
    applied_at: string;
    internship_id: string;
    title: string;
    company_name: string;
    company_logo: string;
    company_province: string;
    company_email?: string;
    student_name?: string;
    description: string;
    responsibilities: string;
    location: string;
    internship_type: string;
}

interface CompanyPosition {
    id: string;
    title: string;
    department: string;
    location: string;
    internship_type: string;
    status: "open" | "closed";
    applicantsCount: number;
}

interface StudentSkillItem {
    id?: string;
    skill_id: number;
    name: string;
    category: string;
    level: string;
}

interface PortfolioItem {
    id?: string;
    title: string;
    url: string;
}

interface ApplicantItem {
    application_id: string;
    student_id: string;
    fullname: string;
    phone: string;
    university: string;
    faculty: string;
    major: string;
    study_year: number;
    gpa: string;
    internship_period: string;
    profile_image: string;
    resume_path: string;
    resume_url: string;
    email: string;
    match_score: number;
    status: string;
    applied_at: string;
    skills: StudentSkillItem[];
    portfolios: PortfolioItem[];
}

const STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "reviewing", label: "Reviewing" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" }
];

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
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    Pending
                </span>
            );
    }
};

export default function ApplicationsPage() {
    const [role, setRole] = useState<string | null>(getCachedRole());
    const [isCheckingRole, setIsCheckingRole] = useState(getCachedRole() === null);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;
        async function checkRole() {
            try {
                const res = await getUserRole();
                if (!isMounted) return;
                if (!res.success || (res.role !== "student" && res.role !== "company")) {
                    setCachedRole(null);
                    router.push("/dashboard");
                    return;
                }
                setCachedRole(res.role);
                setRole(res.role);
                setIsCheckingRole(false);
            } catch (err) {
                console.error("Error checking role in Applications page:", err);
                router.push("/dashboard");
            }
        }
        checkRole();
        return () => {
            isMounted = false;
        };
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

    return role === "company" ? <CompanyApplicationsView /> : <StudentApplicationsView />;
}

function downloadAcceptanceCertificate(item: StudentApplicationItem) {
    const studentName = item.student_name || "นักศึกษาผู้สมัคร";
    const dateStr = new Date().toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    const appliedDateStr = formatDate(item.applied_at);
    const refNo = `IM-ACC-${item.id.slice(0, 8).toUpperCase()}`;

    const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>หนังสือยืนยันการตอบรับเข้าฝึกงาน - ${item.company_name}</title>
  <style>
    body {
      font-family: 'Sarabun', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 40px 20px;
      color: #1e293b;
    }
    .cert-card {
      max-width: 760px;
      margin: 0 auto;
      background: #ffffff;
      border: 2px solid #e2e8f0;
      border-radius: 20px;
      padding: 48px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .brand {
      font-size: 24px;
      font-weight: 800;
      color: #2563eb;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #64748b;
      font-size: 13px;
      display: block;
      font-weight: 500;
      margin-top: 2px;
    }
    .ref-badge {
      background: #eff6ff;
      color: #1d4ed8;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid #bfdbfe;
    }
    .title-box {
      text-align: center;
      margin: 24px 0 32px 0;
    }
    .title-box h1 {
      font-size: 22px;
      color: #0f172a;
      margin: 0 0 8px 0;
    }
    .title-box p {
      font-size: 13px;
      color: #64748b;
      margin: 0;
    }
    .status-stamp {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #dcfce7;
      color: #15803d;
      font-size: 13px;
      font-weight: 800;
      padding: 6px 16px;
      border-radius: 8px;
      border: 1px solid #86efac;
      margin-top: 10px;
    }
    .content-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 14px;
    }
    .content-table td {
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
    }
    .content-table td.label {
      width: 35%;
      color: #64748b;
      font-weight: 600;
    }
    .content-table td.value {
      width: 65%;
      color: #0f172a;
      font-weight: 700;
    }
    .description-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px 20px;
      font-size: 13px;
      line-height: 1.6;
      color: #334155;
      margin-top: 24px;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #f1f5f9;
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .notice {
      font-size: 11px;
      color: #94a3b8;
      max-width: 400px;
      line-height: 1.5;
    }
    .signature {
      text-align: right;
    }
    .signature .name {
      font-weight: 700;
      font-size: 13px;
      color: #1e293b;
    }
    .signature .role {
      font-size: 11px;
      color: #64748b;
    }
    .print-btn {
      display: block;
      margin: 20px auto 0 auto;
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .print-btn:hover {
      background: #1d4ed8;
    }
    @media print {
      body { background: white; padding: 0; }
      .cert-card { border: none; box-shadow: none; padding: 20px 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="cert-card">
    <div class="header">
      <div class="brand">
        InternMatch
        <span>AI-Powered Internship Matching Platform</span>
      </div>
      <div class="ref-badge">เลขที่อ้างอิง: ${refNo}</div>
    </div>

    <div class="title-box">
      <h1>หนังสือรับรองการตอบรับเข้าฝึกงาน</h1>
      <p>INTERNSHIP ACCEPTANCE CONFIRMATION LETTER</p>
      <div class="status-stamp">✓ ผ่านการคัดเลือก (ACCEPTED)</div>
    </div>

    <table class="content-table">
      <tr>
        <td class="label">ชื่อ-นามสกุล นักศึกษา:</td>
        <td class="value">${studentName}</td>
      </tr>
      <tr>
        <td class="label">บริษัท / สถานประกอบการ:</td>
        <td class="value">${item.company_name}</td>
      </tr>
      <tr>
        <td class="label">ตำแหน่งฝึกงาน:</td>
        <td class="value">${item.title}</td>
      </tr>
      <tr>
        <td class="label">สถานที่ปฏิบัติงาน:</td>
        <td class="value">${item.location || item.company_province || "กรุงเทพมหานคร"}</td>
      </tr>
      <tr>
        <td class="label">รูปแบบการฝึกงาน:</td>
        <td class="value">${item.internship_type || "Hybrid"}</td>
      </tr>
      <tr>
        <td class="label">คะแนนความเหมาะสม (Match Score):</td>
        <td class="value">${item.match_score}%</td>
      </tr>
      <tr>
        <td class="label">วันที่ยื่นสมัคร:</td>
        <td class="value">${appliedDateStr}</td>
      </tr>
      <tr>
        <td class="label">วันที่ออกหนังสือรับรอง:</td>
        <td class="value">${dateStr}</td>
      </tr>
    </table>

    <div class="description-box">
      <strong>ข้อความรับรอง:</strong><br />
      เอกสารฉบับนี้ออกโดยระบบ InternMatch เพื่อรับรองว่าผู้สมัครข้างต้นได้รับการพิจารณาและตอบรับเข้าฝึกงานอย่างเป็นทางการจากสถานประกอบการ <strong>${item.company_name}</strong> ขอให้นักศึกษาติดต่อสถานประกอบการเพื่อยืนยันกำหนดการเริ่มฝึกงานและดำเนินการตามขั้นตอนต่อไป
    </div>

    <div class="footer">
      <div class="notice">
        * เอกสารอิเล็กทรอนิกส์นี้สร้างขึ้นโดยระบบอัตโนมัติของ InternMatch สามารถใช้เป็นหลักฐานยืนยันผลการสมัครงานฝึกงานเบื้องต้นได้
      </div>
      <div class="signature">
        <div class="name">InternMatch Verification System</div>
        <div class="role">Verified Electronic Confirmation</div>
      </div>
    </div>
  </div>

  <button class="print-btn" onclick="window.print()">พิมพ์เอกสาร / บันทึกเป็น PDF</button>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cleanCompany = (item.company_name || "Company").replace(/[^a-zA-Z0-9ก-๙]/g, "_");
    const cleanTitle = (item.title || "Internship").replace(/[^a-zA-Z0-9ก-๙]/g, "_");
    a.download = `หลักฐานการตอบรับฝึกงาน_${cleanCompany}_${cleanTitle}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function openCompanyContactEmail(item: StudentApplicationItem) {
    const studentName = item.student_name || "นักศึกษาผู้สมัคร";
    const companyEmail = item.company_email || "contact@internmatch.co.th";
    const subject = `[InternMatch] ยืนยันการฝึกงาน ตำแหน่ง ${item.title} - ${studentName}`;
    const body = `เรียน ฝ่ายบุคคล/ผู้ดูแลการรับสมัคร ${item.company_name},\n\nกระผมนักศึกษา/ดิฉัน ${studentName} ได้รับการตอบรับเข้าฝึกงานในตำแหน่ง "${item.title}" ผ่านระบบ InternMatch (รหัสใบสมัคร: ${item.id})\n\nจึงขอส่งอีเมลนี้เพื่อติดต่อยืนยันการเข้าฝึกงาน และขอสอบถามขั้นตอนการเตรียมตัว เอกสารที่ต้องใช้เพิ่มเติม หรือกำหนดการเริ่มฝึกงานครับ/ค่ะ\n\nข้อมูลผู้สมัคร:\n- ชื่อ-นามสกุล: ${studentName}\n- ตำแหน่งที่สมัคร: ${item.title}\n\nขอขอบพระคุณเป็นอย่างยิ่งที่ให้โอกาสเข้าร่วมฝึกงานกับ ${item.company_name} ครับ/ค่ะ\n\nขอแสดงความนับถือ,\n${studentName}`;

    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(companyEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
}

function StudentApplicationsView() {
    const toast = useToast();
    const [applications, setApplications] = useState<StudentApplicationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const handleAcceptedAction = (item: StudentApplicationItem) => {
        downloadAcceptanceCertificate(item);
        openCompanyContactEmail(item);
        toast.success("ดาวน์โหลดหลักฐานและเปิดหน้าต่างส่งอีเมลหาบริษัทเรียบร้อยแล้ว! 🎉");
    };

    // Filters and Sorting States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [sortField, setSortField] = useState<"applied_at" | "match_score">("applied_at");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    // Modal state
    const [selectedApplication, setSelectedApplication] = useState<StudentApplicationItem | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Fetch applications
    useEffect(() => {
        const fetchApps = async () => {
            setIsLoading(true);
            try {
                const res = await getStudentApplications();
                if (res.success && res.applications) {
                    setApplications(res.applications);
                    // Check URL search params for deep linking notification target
                    const params = new URLSearchParams(window.location.search);
                    const appId = params.get("id");
                    if (appId) {
                        const target = res.applications.find((a: any) => a.id === appId);
                        if (target) {
                            setSelectedApplication(target);
                            setIsDetailsOpen(true);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load applications:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchApps();
    }, []);

    // Handle status filtering, searching, and sorting
    const filteredAndSortedApplications = useMemo(() => {
        let result = [...applications];

        if (statusFilter !== "All") {
            result = result.filter(
                (item) => item.status.toLowerCase() === statusFilter.toLowerCase()
            );
        }

        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (item) =>
                    item.company_name.toLowerCase().includes(query) ||
                    item.title.toLowerCase().includes(query)
            );
        }

        result.sort((a, b) => {
            let valA: string | number = a[sortField];
            let valB: string | number = b[sortField];

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
        setCurrentPage(1);
    };

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
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
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
                                                    setCurrentPage(1);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors ${statusFilter === status
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
                                                    {item.status.toLowerCase() === "accepted" ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleAcceptedAction(item)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                                                                title="ดาวน์โหลดหลักฐานการตอบรับ & ส่งอีเมลติดต่อบริษัท"
                                                            >
                                                                <Download className="w-3.5 h-3.5" />
                                                                <span>หลักฐาน & ส่งอีเมล</span>
                                                                <Mail className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedApplication(item);
                                                                    setIsDetailsOpen(true);
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                                title="ดูรายละเอียด (View Details)"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedApplication(item);
                                                                setIsDetailsOpen(true);
                                                            }}
                                                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                            title="ดูรายละเอียด (View Details)"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                    )}
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
                                            className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${currentPage === page
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
                            <div className="bg-white rounded-2xl p-4 md:p-6 w-full max-w-250 space-y-4 md:space-y-5 shadow-xl border border-slate-100 overflow-hidden">
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
                                        className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg shrink-0 cursor-pointer"
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

                                    {selectedApplication.status.toLowerCase() === "accepted" && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
                                            <div>
                                                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                    คุณผ่านการคัดเลือกเข้าฝึกงานกับบริษัทนี้แล้ว!
                                                </div>
                                                <p className="text-xs text-emerald-700 mt-0.5">
                                                    ดาวน์โหลดเอกสารหลักฐานการตอบรับ และเปิดหน้าต่างส่งอีเมลยืนยันไปยังบริษัท ({selectedApplication.company_email || selectedApplication.company_name})
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleAcceptedAction(selectedApplication)}
                                                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-all shrink-0 cursor-pointer"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span>ดาวน์โหลดหลักฐาน & ส่งอีเมล</span>
                                                <Mail className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>


                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

const getStatusButtonStyles = (value: string, isActive: boolean) => {
    if (!isActive) return "bg-white border-slate-200 text-slate-600 hover:bg-slate-50";
    switch (value) {
        case "accepted":
            return "bg-emerald-600 border-emerald-600 text-white";
        case "rejected":
            return "bg-rose-600 border-rose-600 text-white";
        case "reviewing":
            return "bg-blue-600 border-blue-600 text-white";
        default:
            return "bg-slate-600 border-slate-600 text-white";
    }
};

function CompanyApplicationsView() {
    const toast = useToast();
    const { confirm } = useAppModal();
    const [positions, setPositions] = useState<CompanyPosition[]>([]);
    const [isLoadingPositions, setIsLoadingPositions] = useState(true);
    const [selectedPositionId, setSelectedPositionId] = useState<string | null>(null);
    const [applicants, setApplicants] = useState<ApplicantItem[]>([]);
    const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);

    // Filters and Sorting States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
    const [sortField, setSortField] = useState<"applied_at" | "match_score">("applied_at");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Modal state
    const [selectedApplicant, setSelectedApplicant] = useState<ApplicantItem | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        async function loadPositions() {
            setIsLoadingPositions(true);
            try {
                const res = await getCompanyInternships();
                if (!isMounted) return;
                if (res.success && res.internships) {
                    const mapped: CompanyPosition[] = res.internships.map((item) => ({
                        id: item.id,
                        title: item.title,
                        department: item.department || "",
                        location: item.location || "",
                        internship_type: item.internship_type || "Hybrid",
                        status: item.status as "open" | "closed",
                        applicantsCount: item.applicant_count || 0
                    }));
                    setPositions(mapped);
                    const params = new URLSearchParams(window.location.search);
                    const requested = params.get("position");
                    const initial =
                        requested && mapped.some((p) => p.id === requested)
                            ? requested
                            : mapped[0]?.id ?? null;
                    setSelectedPositionId(initial);
                }
            } catch (err) {
                console.error("Failed to load positions:", err);
            } finally {
                if (isMounted) setIsLoadingPositions(false);
            }
        }
        loadPositions();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!selectedPositionId) return;
        let isMounted = true;
        async function fetchApplicants() {
            setIsLoadingApplicants(true);
            try {
                const res = await getInternshipApplicants(selectedPositionId!);
                if (!isMounted) return;
                if (res.success && res.applicants) {
                    const fetchedApplicants = res.applicants as ApplicantItem[];
                    setApplicants(fetchedApplicants);

                    // Check URL search params for applicant deep linking
                    const params = new URLSearchParams(window.location.search);
                    const appId = params.get("appId");
                    if (appId) {
                        const target = fetchedApplicants.find((a) => a.application_id === appId);
                        if (target) {
                            handleViewApplicantDetails(target);
                        }
                    }
                } else {
                    console.error("getInternshipApplicants error response:", res);
                    setApplicants([]);
                }
            } catch (err) {
                console.error("Failed to load applicants:", err);
                if (isMounted) setApplicants([]);
            } finally {
                if (isMounted) setIsLoadingApplicants(false);
            }
        }
        fetchApplicants();
        return () => {
            isMounted = false;
        };
    }, [selectedPositionId]);

    const handleSelectPosition = (positionId: string) => {
        if (positionId === selectedPositionId) return;
        setSelectedPositionId(positionId);
        setSearchQuery("");
        setStatusFilter("All");
        setCurrentPage(1);
    };

    const selectedPosition = useMemo(
        () => positions.find((p) => p.id === selectedPositionId) ?? null,
        [positions, selectedPositionId]
    );

    const filteredAndSortedApplicants = useMemo(() => {
        let result = [...applicants];

        if (statusFilter !== "All") {
            result = result.filter(
                (item) => item.status.toLowerCase() === statusFilter.toLowerCase()
            );
        }

        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (item) =>
                    item.fullname.toLowerCase().includes(query) ||
                    item.university.toLowerCase().includes(query) ||
                    item.major.toLowerCase().includes(query) ||
                    item.email.toLowerCase().includes(query)
            );
        }

        result.sort((a, b) => {
            let valA: string | number = a[sortField];
            let valB: string | number = b[sortField];

            if (sortField === "applied_at") {
                valA = new Date(valA).getTime();
                valB = new Date(valB).getTime();
            }

            if (valA < valB) return sortDirection === "asc" ? -1 : 1;
            if (valA > valB) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [applicants, statusFilter, searchQuery, sortField, sortDirection]);

    const totalEntries = filteredAndSortedApplicants.length;
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));
    const paginatedApplicants = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredAndSortedApplicants.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredAndSortedApplicants, currentPage]);

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
        setCurrentPage(1);
    };

    const handleUpdateStatus = async (applicationId: string, newStatus: string, skipConfirm = false) => {
        if (!skipConfirm) {
            const label = STATUS_OPTIONS.find((o) => o.value === newStatus)?.label || newStatus;
            const isAccepting = newStatus === "accepted";
            const isRejecting = newStatus === "rejected";

            const ok = await confirm({
              title: isAccepting
                ? "ยืนยันรับเข้าฝึกงาน (Accept)?"
                : isRejecting
                ? "ยืนยันปฏิเสธใบสมัคร (Reject)?"
                : "เปลี่ยนสถานะ?",
              message: isAccepting
                ? "คุณต้องการรับผู้สมัครคนนี้เข้าฝึกงานใช่หรือไม่? ระบบจะส่งอีเมลแจ้งผลการคัดเลือกไปยังนักศึกษาโดยอัตโนมัติ 📧🎉"
                : `คุณแน่ใจหรือไม่ว่าต้องการเปลี่ยนสถานะใบสมัครเป็น "${label}"?`,
              confirmText: isAccepting ? "ยืนยันและส่งอีเมลแจ้งผล" : "ยืนยัน",
              cancelText: "ยกเลิก",
              variant: isRejecting ? "danger" : "default",
            });
            if (!ok) return;
        }
        setUpdatingStatusId(applicationId);
        try {
            const res = await updateApplicationStatus(applicationId, newStatus);
            if (res.success) {
                if (!skipConfirm) toast.success(res.message || `เปลี่ยนสถานะเป็น ${newStatus} สำเร็จ`);
                setApplicants((prev) =>
                    prev.map((a) =>
                        a.application_id === applicationId ? { ...a, status: newStatus } : a
                    )
                );
                setSelectedApplicant((prev) =>
                    prev && prev.application_id === applicationId
                        ? { ...prev, status: newStatus }
                        : prev
                );
            } else if (!skipConfirm) {
                toast.error("ไม่สามารถเปลี่ยนสถานะได้: " + (res.error || ""));
            } else {
                toast.error("ไม่สามารถเปลี่ยนสถานะได้: " + (res.error || ""));
            }
        } catch (err) {
            console.error("Failed to update application status:", err);
            toast.error("เกิดข้อผิดพลาดในการอัปเดตสถานะ");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleViewApplicantDetails = (item: ApplicantItem) => {
        setSelectedApplicant(item);
        setIsDetailsOpen(true);
        // Automatically change status from pending to reviewing if it has not been reviewed yet
        if (item.status.toLowerCase() === "pending") {
            handleUpdateStatus(item.application_id, "reviewing", true);
        }
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/).slice(0, 2);
        return parts.map((w) => w[0]?.toUpperCase()).join("") || "?";
    };

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col md:flex-row antialiased w-full">
            <DashboardSidebar />
            <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen w-full">
                <DashboardHeader title="Applications" />
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 font-sans">Applications</h1>
                        <p className="text-sm text-slate-500 mt-1 font-sans">
                            จัดการผู้สมัครฝึกงานรายตำแหน่ง ตรวจสอบคะแนนความเหมาะสม และอัปเดตสถานะใบสมัคร
                        </p>
                    </div>

                    {isLoadingPositions ? (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
                            <div className="flex justify-center items-center p-12">
                                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                            </div>
                        </div>
                    ) : positions.length === 0 ? (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12 text-center text-slate-500 space-y-3">
                            <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-base font-semibold text-slate-700">ยังไม่มีประกาศรับสมัครฝึกงาน</p>
                            <p className="text-xs text-slate-400">สร้างประกาศรับสมัครฝึกงานเพื่อเริ่มรับใบสมัครจากนิสิต</p>
                            <Link
                                href="/dashboard/Internships"
                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                            >
                                ไปที่หน้า My Internships
                            </Link>
                        </div>
                    ) : (
                        <>
                            {/* Position Selector Tabs */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {positions.map((pos) => {
                                    const isActive = pos.id === selectedPositionId;
                                    return (
                                        <button
                                            key={pos.id}
                                            onClick={() => handleSelectPosition(pos.id)}
                                            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${isActive
                                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            {pos.title}
                                            <span
                                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                                                    }`}
                                            >
                                                {pos.applicantsCount}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Selected Position Summary */}
                            {selectedPosition && (
                                <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                                    <div className="min-w-0">
                                        <h2 className="text-base font-bold text-slate-800 truncate">{selectedPosition.title}</h2>
                                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                                            {selectedPosition.department || "General Department"} • {selectedPosition.location}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-auto">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full uppercase">
                                            {selectedPosition.internship_type}
                                        </span>
                                        <span
                                            className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${selectedPosition.status === "open"
                                                ? "bg-blue-50 text-blue-600"
                                                : "bg-rose-50 text-rose-600"
                                                }`}
                                        >
                                            {selectedPosition.status === "open" ? "Active" : "Closed"}
                                        </span>
                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                            {selectedPosition.applicantsCount} Applicants
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Header Controls */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        placeholder="ค้นหาชื่อนิสิต, มหาวิทยาลัย, สาขา..."
                                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm "
                                    />
                                </div>

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
                                                            setCurrentPage(1);
                                                        }}
                                                        className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors ${statusFilter === status
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

                            {/* Applicants Table Card */}
                            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden w-full">
                                {isLoadingApplicants ? (
                                    <div className="flex justify-center items-center p-12">
                                        <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></span>
                                    </div>
                                ) : paginatedApplicants.length === 0 ? (
                                    <div className="p-12 text-center text-slate-500 space-y-3">
                                        <Users className="w-12 h-12 text-slate-300 mx-auto" />
                                        <p className="text-base font-semibold text-slate-700">ไม่พบรายชื่อผู้สมัคร</p>
                                        <p className="text-xs text-slate-400">
                                            {applicants.length === 0
                                                ? "ยังไม่มีนิสิตสมัครเข้ามาสำหรับตำแหน่งนี้"
                                                : "ลองตรวจสอบตัวกรองหรือค้นหาอีกครั้ง"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto w-full">
                                        <table className="min-w-full divide-y divide-slate-100">
                                            <thead className="bg-slate-50/75">
                                                <tr>
                                                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                                        APPLICANT
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
                                                {paginatedApplicants.map((item) => (
                                                    <tr key={item.application_id} className="hover:bg-slate-50/50 transition-colors">
                                                        {/* Applicant */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center shrink-0 overflow-hidden font-bold text-sm text-slate-500">
                                                                    {item.profile_image ? (
                                                                        <img
                                                                            src={item.profile_image}
                                                                            alt={item.fullname}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        getInitials(item.fullname)
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-slate-800">
                                                                        {item.fullname}
                                                                    </span>
                                                                    <span className="text-xs text-slate-400 font-medium">
                                                                        {item.university}
                                                                        {item.major ? ` • ${item.major}` : ""}
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
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleViewApplicantDetails(item)}
                                                                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                                                    title="ดูรายละเอียดผู้สมัคร"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                {item.status.toLowerCase() !== "accepted" && (
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(item.application_id, "accepted")}
                                                                        disabled={updatingStatusId === item.application_id}
                                                                        className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                                                                        title="รับเข้าฝึกงาน (Accept & ส่งอีเมล)"
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* Pagination Footer */}
                                {!isLoadingApplicants && totalEntries > 0 && (
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
                                                    className={`px-3 py-1 text-xs font-bold rounded-lg cursor-pointer ${currentPage === page
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
                        </>
                    )}

                    {/* Applicant Details Modal */}
                    {isDetailsOpen && selectedApplicant && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white rounded-2xl p-4 sm:p-5  flex flex-col shadow-2xl border max-w-400 border-slate-100 overflow-hidden">
                                {/* Fixed Header */}
                                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center shrink-0 overflow-hidden font-bold text-xs text-slate-500">
                                            {selectedApplicant.profile_image ? (
                                                <img
                                                    src={selectedApplicant.profile_image}
                                                    alt={selectedApplicant.fullname}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                getInitials(selectedApplicant.fullname)
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-base font-bold text-slate-800 truncate leading-tight">
                                                {selectedApplicant.fullname}
                                            </h2>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                                                {selectedApplicant.university}
                                                {selectedApplicant.major ? ` • ${selectedApplicant.major}` : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsDetailsOpen(false);
                                            setSelectedApplicant(null);
                                        }}
                                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg shrink-0 cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Scrollable Body */}
                                <div className="flex-1 overflow-y-auto pr-1.5 space-y-3.5 py-3 text-xs">
                                    {/* Badges Bar */}
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-100">
                                            Match Score: {selectedApplicant.match_score}%
                                        </span>
                                        <span className="text-[11px] font-bold bg-slate-50 text-slate-500 px-2.5 py-0.5 rounded-full border border-slate-100">
                                            Applied on {formatDate(selectedApplicant.applied_at)}
                                        </span>
                                        {selectedApplicant.email && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-100">
                                                <Mail className="w-3 h-3 text-slate-400" />
                                                {selectedApplicant.email}
                                            </span>
                                        )}
                                        {selectedApplicant.phone && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-100">
                                                <Phone className="w-3 h-3 text-slate-400" />
                                                {selectedApplicant.phone}
                                            </span>
                                        )}
                                    </div>

                                    {/* Compact Academic Grid */}
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">มหาวิทยาลัย</p>
                                            <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">
                                                {selectedApplicant.university || "-"}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">คณะ</p>
                                            <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">
                                                {selectedApplicant.faculty || "-"}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">สาขาวิชา</p>
                                            <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">
                                                {selectedApplicant.major || "-"}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ชั้นปี</p>
                                            <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">
                                                {selectedApplicant.study_year ? `ปี ${selectedApplicant.study_year}` : "-"}
                                            </p>
                                        </div>
                                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 col-span-2">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">ช่วงเวลาที่สะดวกฝึกงาน</p>
                                            <p className="text-xs font-semibold text-slate-700 mt-0.5">
                                                {selectedApplicant.internship_period || "มิ.ย. - ส.ค. 2568 (โดยประมาณ)"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Resume */}
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resume (ประวัตินิสิต)</h4>
                                        {selectedApplicant.resume_url ? (
                                            <a
                                                href={selectedApplicant.resume_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-lg px-3 py-2 transition-colors group cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                                    <span className="text-xs font-bold text-blue-600 group-hover:text-blue-700">
                                                        เปิดไฟล์ Resume
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 group-hover:text-blue-500 font-medium">คลิกเพื่อดูไฟล์ PDF</span>
                                            </a>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                                                <FileText className="w-4 h-4 text-slate-300 shrink-0" />
                                                <span className="text-xs font-medium text-slate-400">
                                                    ไม่มีไฟล์ Resume
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Skills */}
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ทักษะและความสามารถ (Skills)</h4>
                                        {selectedApplicant.skills && selectedApplicant.skills.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                {selectedApplicant.skills.map((skill, index) => (
                                                    <span
                                                        key={skill.skill_id || index}
                                                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 shadow-2xs"
                                                    >
                                                        <span>{skill.name}</span>
                                                        {skill.level && (
                                                            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1 rounded">
                                                                {skill.level}
                                                            </span>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                                                <span className="text-xs font-medium text-slate-400">
                                                    ยังไม่ได้ระบุทักษะความสามารถ
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Portfolios & External Links */}
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">ผลงานและลิงก์ภายนอก (Portfolio / Links)</h4>
                                        {selectedApplicant.portfolios && selectedApplicant.portfolios.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                {selectedApplicant.portfolios.map((port, index) => {
                                                    const rawUrl = port.url.startsWith("http://") || port.url.startsWith("https://") ? port.url : `https://${port.url}`;
                                                    const isGithub = port.title.toLowerCase().includes("github") || port.url.toLowerCase().includes("github");
                                                    const isLinkedin = port.title.toLowerCase().includes("linkedin") || port.url.toLowerCase().includes("linkedin");
                                                    
                                                    return (
                                                        <a
                                                            key={port.id || index}
                                                            href={rawUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-400 rounded-lg p-2 transition-colors group shadow-2xs"
                                                        >
                                                            {isGithub ? (
                                                                <Code className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                                                            ) : isLinkedin ? (
                                                                <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                            ) : (
                                                                <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                                            )}
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 truncate">
                                                                    {port.title}
                                                                </span>
                                                                <span className="text-[9px] text-slate-400 truncate">
                                                                    {port.url}
                                                                </span>
                                                            </div>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg p-2.5">
                                                <span className="text-xs font-medium text-slate-400">
                                                    ยังไม่ได้แนบลิงก์ผลงานภายนอก
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Manage Status */}
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">จัดการสถานะใบสมัคร (Manage Status)</h4>
                                            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                                <Mail className="w-3 h-3" /> ส่งอีเมลอัตโนมัติเมื่อกด Accept
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {STATUS_OPTIONS.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => handleUpdateStatus(selectedApplicant.application_id, option.value)}
                                                    disabled={
                                                        updatingStatusId === selectedApplicant.application_id ||
                                                        selectedApplicant.status.toLowerCase() === option.value
                                                    }
                                                    className={`flex items-center justify-center gap-1 border text-[11px] font-bold py-2 px-2.5 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${getStatusButtonStyles(
                                                        option.value,
                                                        selectedApplicant.status.toLowerCase() === option.value
                                                    )}`}
                                                >
                                                    {option.value === "accepted" && <CheckCircle2 className="w-3 h-3" />}
                                                    {option.value === "rejected" && <X className="w-3 h-3" />}
                                                    {option.value === "reviewing" && <Eye className="w-3 h-3" />}
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Fixed Footer */}
                                <div className="border-t border-slate-100 pt-2.5 shrink-0 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 font-medium">
                                        สถานะปัจจุบัน: <strong className="text-slate-600">{selectedApplicant.status}</strong>
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
