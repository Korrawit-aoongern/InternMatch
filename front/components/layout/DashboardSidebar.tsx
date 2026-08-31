"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Briefcase, 
  Brain, 
  Settings, 
  HelpCircle, 
  LogOut
} from "lucide-react";
import { getUserRole } from "@/lib/actions/auth";
import { getCachedRole, setCachedRole } from "@/lib/utils/roleCache";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(getCachedRole());

  useEffect(() => {
    let isMounted = true;
    async function loadRole() {
      try {
        const res = await getUserRole();
        if (!isMounted) return;
        if (res.success && res.role) {
          setCachedRole(res.role);
          setRole(res.role);
        }
      } catch (err) {
        console.error("Failed to fetch user role in sidebar:", err);
      }
    }
    loadRole();
    return () => {
      isMounted = false;
    };
  }, []);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ...(role === "student" || role === "company" ? [{ name: "My Internships", href: "/dashboard/Internships", icon: Briefcase }] : []),
    ...(role === "student" || role === "company"
      ? [
          { name: "Applications", href: "/dashboard/applications", icon: Briefcase },
          { name: "AI Upskill", href: "/matches", icon: Brain },
        ]
      : []
    ),
    { name: "Settings", href: "/dashboard/profile", icon: Settings },
  ];

  return (
    <nav className="hidden md:flex flex-col h-full border-r border-slate-200 bg-white fixed left-0 top-0 w-[260px] shadow-sm z-50">
      {/* Header Branding */}
      <div className="p-6 flex items-center gap-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg">
          IM
        </div>
        <div>
          <h1 className="text-lg font-bold text-blue-600 leading-tight">InternMatch</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Career Portal</p>
        </div>
      </div>

      {/* Main Nav Links */}
      <div className="flex-1 py-6 overflow-y-auto px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 py-3 px-6 text-sm font-semibold rounded-xl transition-colors border-l-4 ${
                    isActive
                      ? "border-blue-600 bg-blue-50/50 text-blue-700"
                      : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "fill-blue-600/20" : ""}`} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer Nav */}
      <div className="p-6 border-t border-slate-100 space-y-4">
        <ul className="space-y-1">
          <li>
            <Link href="/help" className="flex items-center gap-4 text-slate-500 py-2.5 px-4 text-sm hover:bg-slate-50 hover:text-slate-800 rounded-lg transition-colors">
              <HelpCircle className="w-5 h-5" />
              Help Center
            </Link>
          </li>
          <li>
            <Link href="/auth/login" className="flex items-center gap-4 text-red-500 py-2.5 px-4 text-sm hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
              Logout
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
