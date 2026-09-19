"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Bell, User } from "lucide-react";
import { getHeaderData, HeaderNotificationItem } from "@/lib/actions/notifications";

interface DashboardHeaderProps {
  title: string;
  avatarUrl?: string;
}

type NotificationItem = HeaderNotificationItem;

export default function DashboardHeader({ title, avatarUrl }: DashboardHeaderProps) {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [role, setRole] = useState<"student" | "company" | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [loadingNotifications, setLoadingNotifications] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHeader() {
      setLoadingNotifications(true);
      try {
        const res = await getHeaderData();
        if (!isMounted) return;
        if (res.success) {
          setRole(res.role);
          if (res.avatar && !avatarUrl) setAvatar(res.avatar);
          setNotifications(res.notifications);
          setUnreadCount(res.unreadCount);
        }
      } catch (err) {
        console.error("Error loading header data:", err);
      } finally {
        if (isMounted) setLoadingNotifications(false);
      }
    }

    loadHeader();

    return () => {
      isMounted = false;
    };
  }, [avatarUrl]);

  const displayAvatar = avatarUrl || avatar;
  const router = useRouter();

  const handleNotificationClick = (link: string) => {
    setIsDropdownOpen(false);
    router.push(link);
  };

  return (
    <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 py-3 shadow-sm">
      <div className="flex items-center gap-4">
        <button className="md:hidden text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors">
          <Menu className="w-6 h-6 text-blue-600" />
        </button>
        <h1 className="text-lg md:text-xl font-bold text-slate-800">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-slate-500 hover:bg-slate-100 rounded-full p-2 transition-colors relative cursor-pointer"
            title="แจ้งเตือน"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </button>

          {/* Notification Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">การแจ้งเตือน</h3>
                </div>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {unreadCount} ใหม่
                  </span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {loadingNotifications ? (
                  <div className="py-8 text-center text-xs text-slate-400">กำลังโหลดการแจ้งเตือน...</div>
                ) : notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">ยังไม่มีรายการแจ้งเตือนในขณะนี้</div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item.link)}
                      className="p-3.5 block hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 truncate">{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">{item.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      {item.status && (
                        <div className="mt-1.5">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                              item.status === "accepted"
                                ? "bg-emerald-100 text-emerald-700"
                                : item.status === "rejected"
                                ? "bg-rose-100 text-rose-700"
                                : item.status === "reviewing"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                <Link
                  href="/dashboard/applications"
                  onClick={() => setIsDropdownOpen(false)}
                  className="text-xs font-bold text-blue-600 hover:underline inline-block"
                >
                  ดูรายการทั้งหมดใน Applications →
                </Link>
              </div>
            </div>
          )}
        </div>

        <Link href="/dashboard/profile" className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden hover:opacity-90 transition-opacity flex items-center justify-center bg-slate-100 text-slate-500">
          {displayAvatar ? (
            <img alt="User Profile" className="w-full h-full object-cover" src={displayAvatar} />
          ) : (
            <User className="w-4 h-4" />
          )}
        </Link>
      </div>
    </header>
  );
}
