"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { getStudentProfile, getCompanyProfile } from "@/lib/actions/auth";

interface DashboardHeaderProps {
  title: string;
  avatarUrl?: string;
}

export default function DashboardHeader({ title, avatarUrl }: DashboardHeaderProps) {
  const defaultAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop";
  const [avatar, setAvatar] = useState<string | null>(null);

  useEffect(() => {
    // If avatarUrl is explicitly provided (e.g. from parent component state), use it
    if (avatarUrl) {
      setAvatar(avatarUrl);
      return;
    }

    async function loadProfileAvatar() {
      try {
        // Try to fetch student profile
        const studentRes = await getStudentProfile();
        if (studentRes.success && studentRes.profile) {
          if (studentRes.profile.profile_image) {
            setAvatar(studentRes.profile.profile_image);
          }
          return;
        }

        // Try to fetch company profile
        const companyRes = await getCompanyProfile();
        if (companyRes.success && companyRes.profile) {
          if (companyRes.profile.logo) {
            setAvatar(companyRes.profile.logo);
          }
          return;
        }
      } catch (err) {
        console.error("Failed to load header avatar:", err);
      }
    }

    loadProfileAvatar();
  }, [avatarUrl]);

  return (
    <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 py-3 shadow-sm">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors">
          <Menu className="w-6 h-6 text-blue-600" />
        </button>
        <h1 className="text-lg md:text-xl font-bold text-slate-800">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-slate-500 hover:bg-slate-100 rounded-full p-2 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <Link href="/dashboard/profile" className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden hover:opacity-90 transition-opacity">
          <img alt="User Profile" className="w-full h-full object-cover" src={avatar || avatarUrl || defaultAvatar} />
        </Link>
      </div>
    </header>
  );
}
