"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  GraduationCap,
  Building2,
  UserPlus,
  UserCog,
  Search,
  Send,
  BarChart3,
  Brain,
  Sparkles,
  Bell,
  FileText,
  ShieldCheck,
  Briefcase,
  Users,
  Eye,
  ChevronDown,
  ArrowRight,
  BookOpen,
  Lightbulb,
  LayoutDashboard,
} from "lucide-react";
import DashboardSidebar from "@/components/layout/DashboardSidebar";
import DashboardHeader from "@/components/layout/DashboardHeader";

type RoleTab = "student" | "company";

const studentSteps = [
  {
    n: 1,
    title: "สมัครบัญชี Student & เข้าสู่ระบบ",
    where: "/auth/register/student → /auth/login",
    desc: "กรอก Email, Username, Password และโปรไฟล์พื้นฐาน (ชื่อ, มหาวิทยาลัย, สาขา, ชั้นปี) แล้ว Login เข้า Dashboard",
    tip: "ใช้ Email จริง — ระบบส่งลิงก์รีเซ็ตรหัสผ่านทาง Email นี้",
    icon: UserPlus,
  },
  {
    n: 2,
    title: "เติมโปรไฟล์ให้ครบ",
    where: "/dashboard/profile",
    desc: "อัปโหลดรูปโปรไฟล์, เพิ่มทักษะ (Beginner / Intermediate / Advanced), อัปโหลด Resume PDF ≤10MB, ใส่ลิงก์ GitHub / LinkedIn / Portfolio",
    tip: "ทักษะยิ่งครบ Match Score ยิ่งแม่น — แนะนำเพิ่ม 5+ ทักษะ",
    icon: UserCog,
  },
  {
    n: 3,
    title: "หาที่ฝึกงานที่ระบบแนะนำ",
    where: "/dashboard/Internships",
    desc: "ดูตำแหน่งที่เปิดรับทั้งหมด ระบบเรียงตาม Match Score สูง→ต่ำให้อัตโนมัติ ใช้ช่องค้นหา / แท็บ Active คัดกรองได้",
    tip: "Badge % สีน้ำเงินคือคะแนนความเหมาะสมของโปรไฟล์คุณกับตำแหน่งนั้น",
    icon: Search,
  },
  {
    n: 4,
    title: "กดสมัคร 1 คลิก",
    where: "ปุ่ม Apply ใน My Internships",
    desc: "กดสมัคร ระบบจะคำนวณ Match Score จริง ณ เวลาสมัครและเก็บเป็น pending กันสมัครซ้ำอัตโนมัติ",
    tip: "สมัครแล้วสถานะจะเป็น Pending — ดูได้ที่ Applications",
    icon: Send,
  },
  {
    n: 5,
    title: "ติดตามสถานะใบสมัคร",
    where: "/dashboard/applications",
    desc: "ดูตาราง Company & Position, % Match, วันสมัคร, สถานะ (Pending → Reviewing → Accepted / Rejected) พร้อมกรอง/เรียงลำดับ",
    tip: "กดไอคอนกระดิ่งบน Header และดูการแจ้งเตือน Accepted/Reviewing ก่อนใคร",
    icon: BarChart3,
  },
  {
    n: 6,
    title: "อัปสกิลด้วย AI",
    where: "/matches (AI Upskill)",
    desc: "หลังสมัครแล้วเท่านั้น AI จะวิเคราะห์ Skill Gap ของคุณเทียบกับตำแหน่งที่สมัคร และแนะนำคอร์ส YouTube / Coursera / ThaiMOOC ผ่าน Gemini (มี fallback ถ้าไม่มีคีย์)",
    tip: "ไม่มี gap = ข้อความชมเชย 100% ✔️ — ไม่ต้องเรียนเพิ่มก็สมัครได้เลย",
    icon: Brain,
  },
];

const companySteps = [
  {
    n: 1,
    title: "สมัครบัญชี Company & เข้าสู่ระบบ",
    where: "/auth/register/company → /auth/login",
    desc: "กรอกข้อมูลบริษัท ชื่อบริษัท, จังหวัด, ที่อยู่, คำอธิบาย, ลิงก์เว็บไซต์ (สูงสุด 3 ลิงก์) แล้ว Login",
    tip: "โลโก้บริษัทอัปโหลดได้ที่หน้า Profile",
    icon: Building2,
  },
  {
    n: 2,
    title: "เติมโปรไฟล์บริษัท",
    where: "/dashboard/profile",
    desc: "แก้ไขชื่อ/ที่อยู่/จังหวัด/คำอธิบาย และลิงก์เว็บไซต์ อัปโหลดโลโก้ แล้วกด Save Changes",
    tip: "โปรไฟล์ที่สมบูรณ์ช่วยให้นักศึกษาเชื่อมั่นและสมัครมากขึ้น",
    icon: UserCog,
  },
  {
    n: 3,
    title: "สร้างประกาศรับฝึกงาน",
    where: "/dashboard/Internships → Create New Internship",
    desc: "Wizard 2 ขั้น: (1) ชื่อตำแหน่ง แผนก สถานที่ รูปแบบงาน Hybrid/Remote/On-site รายละเอียดงาน (2) ค้นหา & เลือกทักษะที่ต้องการ (อย่างน้อย 1) + ระบุระดับ Beginner/Intermediate/Advanced",
    tip: "ต้องเลือก 1 ทักษะขึ้นไป ระบบถึงจะคำนวณ Match Score ให้ผู้สมัครได้",
    icon: Briefcase,
  },
  {
    n: 4,
    title: "ดูผู้สมัครเรียงตามความเหมาะสม",
    where: "/dashboard/applications → เลือกแท็บตำแหน่ง",
    desc: "เลือกตำแหน่งบนแถบแท็บ ระบบดึงผู้สมัครทั้งหมดของตำแหน่งนั้น เรียงตาม Match Score สูง→ต่ำ พร้อมตัวกรองสถานะ/ค้นหาชื่อ/มหาวิทยาลัย",
    tip: "Badge % สีน้ำเงินคือคะแนนของผู้สมัครเทียบกับทักษะที่คุณประกาศ",
    icon: Users,
  },
  {
    n: 5,
    title: "เปิดดูโปรไฟล์ผู้สมัคร",
    where: "กดดูรายละเอียดผู้สมัคร",
    desc: "ดูข้อมูล มหาวิทยาลัย/สาขา/ชั้นปี, ทักษะพร้อมระดับ, Portfolio, Resume (ลิงก์แบบ signed URL หมดอายุ 1 ชม.), ช่องทางติดต่อ",
    tip: "เปิดดูครั้งแรก ระบบจะเปลี่ยน Pending → Reviewing อัตโนมัติ",
    icon: Eye,
  },
  {
    n: 6,
    title: "อัปเดตสถานะใบสมัคร",
    where: "ปุ่ม Pending / Reviewing / Accepted / Rejected",
    desc: "เปลี่ยนสถานะได้ตลอด: Pending → Reviewing → Accepted หรือ Rejected นักศึกษาจะเห็นสถานะใหม่ทันทีที่หน้า Applications + กระดิ่งแจ้งเตือน",
    tip: "Accepted = สีเขียว, Rejected = สีแดง, Reviewing = สีน้ำเงิน",
    icon: ShieldCheck,
  },
];

const faqs = [
  {
    q: "ทำไม Match Score = 0%?",
    a: "ประกาศนั้นอาจไม่มีทักษะที่คุณมีเลย หรือคุณยังไม่ได้เพิ่มทักษะที่หน้า Profile → เพิ่มทักษะให้ตรงกับประกาศแล้วลองดูใหม่ คะแนนจะคำนวณใหม่ทันที",
  },
  {
    q: "สมัครงานซ้ำได้ไหม?",
    a: "ไม่ได้ ระบบกันสมัครซ้ำต่อตำแหน่ง หากต้องการยกเลิกให้กด Cancel ที่ /dashboard/Internships (สำหรับ Student) แล้วสมัครใหม่ได้",
  },
  {
    q: "ทำไมไม่เห็นหน้า AI Upskill?",
    a: "หน้านี้จะแสดงเฉพาะตำแหน่งที่คุณสมัครแล้วเท่านั้น (has_applied = true และ match > 0) ลองสมัคร 1 ตำแหน่งก่อน แล้วกลับมาที่ /matches",
  },
  {
    q: "อัปโหลด Resume ไม่ได้?",
    a: "ต้องเป็น PDF และขนาด ≤10MB เท่านั้น ปุ่มอัปโหลดอยู่ที่ /dashboard/profile การ์ด Resume → Click to upload หากเกินขนาดให้ลดไฟล์ก่อน",
  },
  {
    q: "ลืมรหัสผ่าน?",
    a: "ไปที่ /auth/forgot-password กรอก Email ระบบจะส่งลิงก์รีเซ็ต (หมดอายุ 15 นาที) ทาง Email ที่ตั้งใน .env (nodemailer) หากไม่ได้รับให้ตรวจสอบ Spam",
  },
  {
    q: "บริษัทแก้ไขประกาศอย่างไร?",
    a: "ที่ /dashboard/Internships กดจุดไข่ปลา ⋮ บนการ์ด → แก้ไขประกาศ / เปลี่ยน Active↔Closed / ลบประกาศ ได้ทันที",
  },
];

export default function HelpCenterPage() {
  const [role, setRole] = useState<RoleTab>("student");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const steps = role === "student" ? studentSteps : companySteps;

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col md:flex-row antialiased w-full">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen w-full">
        <DashboardHeader title="Help Center" />

        <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Hero */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                  <HelpCircle className="w-3.5 h-3.5" /> Help Center — Manual
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
                  ใช้ InternMatch อย่างไร
                  <span className="text-sm font-semibold text-slate-400 hidden sm:inline">· Simplicity at best</span>
                </h1>
                <p className="text-sm text-slate-500 leading-relaxed">
                  คู่มือสั้น กระชับ ใช้งานได้จริง — เลือกบทบาทของคุณแล้วทำตามขั้นตอน 6 ขั้น ทุกปุ่มบอกตำแหน่งหน้าไว้ให้แล้ว
                </p>
              </div>
              <div className="hidden md:flex w-14 h-14 rounded-2xl bg-blue-600 text-white items-center justify-center shrink-0">
                <BookOpen className="w-7 h-7" />
              </div>
            </div>

            {/* Role switch */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRole("student")}
                className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${
                  role === "student"
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <GraduationCap className="w-4 h-4" /> I&apos;m a Student
              </button>
              <button
                onClick={() => setRole("company")}
                className={`flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-colors cursor-pointer ${
                  role === "company"
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Building2 className="w-4 h-4" /> I&apos;m a Company
              </button>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <Link href="/dashboard" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                <LayoutDashboard className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Dashboard</p>
                  <p className="text-[11px] text-slate-500">ภาพรวม & สถิติ</p>
                </div>
              </Link>
              <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                <UserCog className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Profile</p>
                  <p className="text-[11px] text-slate-500">ทักษะ & Resume</p>
                </div>
              </Link>
              <Link href={role === "student" ? "/dashboard/Internships" : "/dashboard/Internships"} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <div>
                  <p className="text-xs font-bold text-slate-800">My Internships</p>
                  <p className="text-[11px] text-slate-500">{role === "student" ? "ค้นหา & สมัคร" : "สร้าง & จัดการ"}</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {role === "student" ? <GraduationCap className="w-5 h-5 text-blue-600" /> : <Building2 className="w-5 h-5 text-indigo-600" />}
                {role === "student" ? "Student — 6 ขั้นจบ" : "Company — 6 ขั้นจบ"}
              </h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                เสร็จใน ~5 นาที
              </span>
            </div>

            <div className="relative pl-2">
              {/* vertical line */}
              <div className="absolute left-[22px] top-2 bottom-2 w-px bg-slate-200 hidden sm:block" />
              <div className="space-y-4">
                {steps.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.n} className="relative flex gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:bg-white hover:shadow-sm transition-colors">
                      <div className="hidden sm:flex w-8 h-8 rounded-full bg-blue-600 text-white items-center justify-center text-xs font-black shrink-0 z-10">
                        {s.n}
                      </div>
                      <div className="sm:hidden w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shrink-0">
                        {s.n}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <Icon className="w-4 h-4 text-slate-500" /> {s.title}
                          </h3>
                          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                            {s.where}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                        <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 inline-flex items-start gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {s.tip}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Concepts — collapsible simple */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" /> Match Score คิดอย่างไร?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                เทียบทักษะที่ประกาศต้องการกับทักษะของคุณต่อทักษะ: มีและระดับ ≥ ที่ต้องการ = 1.0 คะแนน, มีแต่ระดับต่ำกว่า = studentLevel / requiredLevel (Beginner=1, Intermediate=2, Advanced=3) แล้วเฉลี่ยทุกทักษะ ×100
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 border border-slate-100 rounded-xl py-2">
                  <p className="font-bold text-slate-700">Beginner</p>
                  <p className="text-slate-500">1</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl py-2">
                  <p className="font-bold text-blue-700">Intermediate</p>
                  <p className="text-blue-600">2</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl py-2">
                  <p className="font-bold text-indigo-700">Advanced</p>
                  <p className="text-indigo-600">3</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">ตัวอย่าง: ต้องการ React Advanced (3) คุณมี Intermediate (2) → 2/3 = 0.66 ต่อทักษะนั้น</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> ระบบ AI & การแจ้งเตือน
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex gap-2">
                  <Brain className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span><span className="font-bold">AI Upskill (/matches)</span> — วิเคราะห์ gap แล้วเรียก Gemini แบบไล่โมเดล (flash-lite → flash) ถ้าไม่มีคีย์หรือเรียกไม่สำเร็จจะใช้คอร์สสำรองในระบบ</span>
                </li>
                <li className="flex gap-2">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><span className="font-bold">AI Resume Review</span> — ปุ่มบน Student Dashboard ประเมิน 5 หมวด (Projects 45%, Skills 25%, Education 15%, Contact 10%, Extra 5%) พร้อมคำแนะนำ Action Verb</span>
                </li>
                <li className="flex gap-2">
                  <Bell className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span><span className="font-bold">กระดิ่ง</span> ที่ Header — Student เห็นสถานะใบสมัคร, Company เห็นใบสมัครใหม่คลิกแล้วพาไปหน้า Applications</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href="/matches" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                  ไป AI Upskill <ArrowRight className="w-3 h-3" />
                </Link>
                <span className="text-slate-300">·</span>
                <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                  เปิด Dashboard <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* Common checklist */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-800">เช็กลิสต์เริ่มต้นใช้งานให้ราบรื่น</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5" />
                <span><span className="font-bold">Profile ครบ</span> — รูป, เบอร์, มหาวิทยาลัย/สาขา, ลิงก์ครบ</span>
              </div>
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                <FileText className="w-4 h-4 text-blue-600 mt-0.5" />
                <span><span className="font-bold">Resume PDF ≤10MB</span> — อัปโหลดที่ Profile แล้วกด Save</span>
              </div>
              <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                <Bell className="w-4 h-4 text-amber-600 mt-0.5" />
                <span><span className="font-bold">เช็คกระดิ่งทุกวัน</span> — สถานะเปลี่ยนทันทีไม่ต้องรอ Email</span>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" /> คำถามที่พบบ่อย (FAQ)
            </h3>
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {faqs.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">{f.q}</p>
                    {openFaq === i && <p className="text-xs text-slate-600 leading-relaxed">{f.a}</p>}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold">พร้อมเริ่มแล้วหรือยัง?</h4>
              <p className="text-sm text-blue-100">ทำตาม 6 ขั้นด้านบน คุณจะใช้งาน InternMatch ได้คล่องใน 5 นาที</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/dashboard/Internships" className="bg-white text-blue-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors">
                ไปหา Internship
              </Link>
              <Link href="/dashboard/profile" className="bg-white/15 text-white border border-white/20 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-white/25 transition-colors">
                เติมโปรไฟล์
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 pb-2">
            ยังติดปัญหา? ติดต่อผ่าน Email ที่ตั้งในระบบ หรือดูโค้ดที่ <span className="font-mono">front/lib/actions</span>
          </p>
        </main>
      </div>
    </div>
  );
}
