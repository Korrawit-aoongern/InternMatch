"use client";

import React, { useState } from "react";
import {
    PlusCircle,
    Search,
    MapPin,
    MoreVertical,
    Pencil,
    Users,
    Eye
} from "lucide-react";

interface InternshipCardProps {
    status: "Active" | "Draft" | "Closed";
    title: string;
    location: string;
    applicants?: number;
    dateLabel: string;
    dateValue: string;
}

export default function MyInternshipsPage() {
    const [activeTab, setActiveTab] = useState("All");

    return (
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">My Internships</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage your active, draft, and closed internship postings.
                    </p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
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
                        placeholder="Search internships..."
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>

                {/* Status Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    {[
                        { label: "All", count: 12 },
                        { label: "Active", count: 5 },
                        { label: "Drafts", count: 3 },
                        { label: "Closed", count: 4 },
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                {/* Card 1: Active */}
                <InternshipCard
                    status="Active"
                    title="Software Engineering..."
                    location="San Francisco, CA (Hybrid)"
                    applicants={142}
                    dateLabel="POSTED"
                    dateValue="Oct 12, 2023"
                />

                {/* Card 2: Active */}
                <InternshipCard
                    status="Active"
                    title="Data Science Intern"
                    location="Remote"
                    applicants={87}
                    dateLabel="POSTED"
                    dateValue="Oct 15, 2023"
                />

                {/* Card 3: Draft */}
                <InternshipCard
                    status="Draft"
                    title="UX Design Intern"
                    location="New York, NY (On-site)"
                    dateLabel="LAST EDITED"
                    dateValue="Yesterday"
                />

                {/* Card 4: Closed */}
                <InternshipCard
                    status="Closed"
                    title="Product Marketing..."
                    location="Austin, TX"
                    applicants={215}
                    dateLabel="CLOSED ON"
                    dateValue="Sep 30, 2023"
                />
            </div>
        </main>
    );
}

{/* Card Component */ }
function InternshipCard({
    status,
    title,
    location,
    applicants,
    dateLabel,
    dateValue,
}: InternshipCardProps) {
    // กำหนดสไตล์ขอบและBadge ตาม Status
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

    return (
        <div
            className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${styles.borderLeft}`}
        >
            {/* Header Info */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
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
                    <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                    </button>
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
                        <p className="text-xl font-bold text-slate-800 mt-0.5">{applicants}</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                            APPLICANTS
                        </p>
                        <p className="text-xl font-bold text-slate-800 mt-0.5">
                            {applicants !== undefined ? applicants : "--"}
                        </p>
                    </div>
                )}

                <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        {dateLabel}
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-1">{dateValue}</p>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
                {status === "Active" && (
                    <div className="grid grid-cols-2 gap-2">
                        <button className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2 px-3 rounded-xl transition-colors">
                            <Pencil className="w-3.5 h-3.5 text-blue-600" />
                            Edit
                        </button>
                        <button className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors shadow-sm">
                            <Users className="w-3.5 h-3.5" />
                            View ({applicants})
                        </button>
                    </div>
                )}

                {status === "Draft" && (
                    <button className="w-full flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2 px-3 rounded-xl transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                        Continue Editing
                    </button>
                )}

                {status === "Closed" && (
                    <button className="w-full flex items-center justify-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs font-bold py-2 px-3 rounded-xl hover:bg-blue-50 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                        View Archive
                    </button>
                )}
            </div>
        </div>
    );
}