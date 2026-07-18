"use client";

import Link from "next/link";

export default function RegisterPortalPage() {
  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-6 antialiased relative overflow-hidden w-full">
      {/* Background เอฟเฟกต์แสงฟุ้งหรูๆ */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/40 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/30 blur-[150px] pointer-events-none"></div>

      <main className="w-full max-w-[448px] z-10">
        {/* หัวข้อเว็บ */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">InternMatch</h1>
          <p className="text-sm text-slate-500 mt-1">AI Career Portal Registration</p>
        </div>

        {/* การ์ดแก้วตัวเลือกทางเข้า */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-xl rounded-2xl p-6 md:p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Join Us</h2>
            <p className="text-sm text-slate-500">Select your account type to begin.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* ปุ่มทางเข้าฝั่ง นักศึกษา */}
            <Link
              href="/register_student"
              className="group flex flex-col items-center p-6 rounded-xl border border-slate-200 bg-white hover:bg-blue-50/50 hover:border-blue-400 transition-all duration-200 shadow-sm hover:shadow text-center"
            >
              <span className="material-symbols-outlined text-4xl text-blue-600 mb-2 group-hover:scale-110 transition-transform">school</span>
              <span className="text-sm font-semibold text-slate-800">Student</span>
              <span className="text-[11px] text-slate-400 mt-1 block">สมัครรับทุนและฝึกงาน</span>
            </Link>

            {/* ปุ่มทางเข้าฝั่ง บริษัท */}
            <Link
              href="/register_company"
              className="group flex flex-col items-center p-6 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-400 transition-all duration-200 shadow-sm hover:shadow text-center"
            >
              <span className="material-symbols-outlined text-4xl text-indigo-600 mb-2 group-hover:scale-110 transition-transform">domain</span>
              <span className="text-sm font-semibold text-slate-800">Company</span>
              <span className="text-[11px] text-slate-400 mt-1 block">ลงทะเบียนเปิดรับ นศ.</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{" "}
            <Link className="text-blue-600 font-semibold hover:underline" href="/login">
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}