"use client";

import React, { useEffect, useState } from "react";
import { X, MapPin, Globe, Briefcase, Building2, ExternalLink, Loader2 } from "lucide-react";
import { getCompanyPublicProfile } from "@/lib/actions/auth";

interface CompanyProfileModalProps {
  companyId: string | null;
  companyNameFallback?: string;
  onClose: () => void;
}

export default function CompanyProfileModal({ companyId, companyNameFallback, onClose }: CompanyProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      setError("ไม่พบข้อมูลบริษัท");
      return;
    }
    let isMounted = true;
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const res = await getCompanyPublicProfile(companyId!);
        if (!isMounted) return;
        if (res.success && res.profile) {
          setProfile(res.profile);
        } else {
          setError(res.error || "ไม่พบข้อมูลบริษัท");
        }
      } catch (err) {
        if (isMounted) setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [companyId]);

  const websiteLinks: string[] = (() => {
    if (!profile?.website) return [];
    const raw = profile.website as string;
    try {
      if (raw.trim().startsWith("[")) return JSON.parse(raw);
      return raw.split(",").map((s: string) => s.trim()).filter(Boolean);
    } catch {
      return [raw];
    }
  })();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-[640px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden font-bold text-sm text-slate-600">
              {profile?.logo ? (
                <img src={profile.logo} alt={profile.company_name} className="w-full h-full object-cover" />
              ) : (
                (profile?.company_name || companyNameFallback || "C").charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-800 truncate flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                {profile?.company_name || companyNameFallback || "Company Profile"}
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {profile?.province || "—"} • {profile?.openInternshipsCount ?? 0} open positions
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-semibold text-slate-500">กำลังโหลดข้อมูลบริษัท...</span>
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-700 text-center">{error}</div>
          ) : (
            <>
              {/* Description */}
              <div className="space-y-1.5">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">เกี่ยวกับบริษัท</h3>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed break-words">
                    {profile.description?.trim() ? profile.description : "บริษัทนี้ยังไม่ได้เพิ่มคำอธิบายไว้"}
                  </p>
                </div>
              </div>

              {/* Address */}
              {profile.address && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ที่อยู่</h3>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600 leading-relaxed break-words">{profile.address}</p>
                  </div>
                </div>
              )}

              {/* Websites */}
              {websiteLinks.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">เว็บไซต์ & ลิงก์</h3>
                  <div className="space-y-2">
                    {websiteLinks.map((link, idx) => {
                      const href = link.startsWith("http") ? link : `https://${link}`;
                      return (
                        <a
                          key={idx}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
                        >
                          <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="text-xs font-semibold text-blue-700 truncate flex-1 group-hover:underline">{link}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent open internships */}
              {profile.recentInternships?.length > 0 && (
                <div className="space-y-1.5">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ตำแหน่งที่เปิดรับตอนนี้ ({profile.openInternshipsCount})</h3>
                  <div className="space-y-2">
                    {profile.recentInternships.map((intern: any) => (
                      <div key={intern.id} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">{intern.title}</p>
                          <p className="text-[11px] text-slate-500 truncate">{intern.internship_type} • {intern.location}</p>
                        </div>
                        <span className="shrink-0 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> Open
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-400 text-center pt-2 border-t border-slate-100">
                ข้อมูลนี้แสดงเพื่อช่วยตัดสินใจก่อนสมัคร — ไม่เกี่ยวข้องกับสถานะใบสมัครของคุณ
              </p>
            </>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition-colors">
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
