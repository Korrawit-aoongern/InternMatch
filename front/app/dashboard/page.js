import Link from "next/link";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// app/dashboard/page.js

async function getUserData() {
  // 🌟 จุดสำคัญ: เพิ่ม await หน้า cookies() เพราะใน Next.js เวอร์ชันใหม่เป็น Promise แล้ว
  const cookieStore = await cookies(); 
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    // ถอดรหัสตั๋ว JWT ด้วย Secret Key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}

export default async function DashboardPage() {
  // ดึงข้อมูลผู้ใช้จริง เช่น userId, email, fullname ที่ฝังไว้ตอน Login
  const user = await getUserData();
  
  // ชื่อผู้ใช้งานเริ่มต้นหากยังไม่ได้ล็อกอินหรือระบุข้อมูล
  const displayName = user?.fullname || "Guest User";

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col md:flex-row antialiased w-full">
      
      {/* --- SideNavBar (Web Only) --- */}
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
        <div className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-1">
            <li>
              <Link href="/dashboard" className="flex items-center gap-4 border-l-4 border-blue-600 bg-blue-50/50 text-blue-700 py-3 px-6 text-sm font-semibold transition-colors">
                <span className="material-symbols-outlined text-xl">dashboard</span>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/applications" className="flex items-center gap-4 text-slate-500 py-3 px-6 text-sm hover:bg-slate-50 hover:text-slate-800 transition-colors border-l-4 border-transparent">
                <span className="material-symbols-outlined text-xl">work</span>
                Applications
              </Link>
            </li>
            <li>
              <Link href="/matches" className="flex items-center gap-4 text-slate-500 py-3 px-6 text-sm hover:bg-slate-50 hover:text-slate-800 transition-colors border-l-4 border-transparent">
                <span className="material-symbols-outlined text-xl">psychology</span>
                Matches
              </Link>
            </li>
            <li>
              <Link href="/messages" className="flex items-center gap-4 text-slate-500 py-3 px-6 text-sm hover:bg-slate-50 hover:text-slate-800 transition-colors border-l-4 border-transparent">
                <span className="material-symbols-outlined text-xl">chat</span>
                Messages
              </Link>
            </li>
            <li>
              <Link href="/settings" className="flex items-center gap-4 text-slate-500 py-3 px-6 text-sm hover:bg-slate-50 hover:text-slate-800 transition-colors border-l-4 border-transparent">
                <span className="material-symbols-outlined text-xl">settings</span>
                Settings
              </Link>
            </li>
          </ul>
        </div>

        {/* Footer Nav */}
        <div className="p-6 border-t border-slate-100 space-y-4">
          <ul className="space-y-1">
            <li>
              <Link href="/help" className="flex items-center gap-4 text-slate-500 py-2.5 px-4 text-sm hover:bg-slate-50 hover:text-slate-800 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-xl">help</span>
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/login" className="flex items-center gap-4 text-red-500 py-2.5 px-4 text-sm hover:bg-red-50 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-xl">logout</span>
                Logout
              </Link>
            </li>
          </ul>
          <Link href="/internships" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center shadow-sm">
            Find Internships
          </Link>
        </div>
      </nav>

      {/* --- Main Content Wrapper --- */}
      <div className="flex-1 flex flex-col md:ml-[260px] min-h-screen w-full">
        
        {/* TopAppBar */}
        <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-600 hover:bg-slate-100 rounded-full p-2 transition-colors">
              <span className="material-symbols-outlined text-blue-600">menu</span>
            </button>
            <h1 className="text-lg md:text-xl font-bold text-slate-800">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:bg-slate-100 rounded-full p-2 transition-colors relative">
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <Link href="/settings" className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden hover:opacity-90 transition-opacity">
              <img alt="User Profile" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100&auto=format&fit=crop" />
            </Link>
          </div>
        </header>

        {/* Dashboard Canvas Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              {/* 🌟 แสดงชื่อจริงจาก Token ล็อกอินอัตโนมัติ */}
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Welcome back, {displayName}!</h2>
              <p className="text-sm text-slate-500 mt-1">Here's your career progress at a glance.</p>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">magic_button</span>
              AI Resume Review
            </button>
          </div>

          {/* Stats Summary Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Match Score */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="relative w-14 h-14 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.5"></path>
                  <path className="text-blue-600" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-dasharray="85, 100" stroke-linecap="round" stroke-width="3.5"></path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-600">85%</div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Match Score</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">High</p>
              </div>
            </div>

            {/* Applied */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">send</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Applied</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">12 Positions</p>
              </div>
            </div>

            {/* Recommended */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                <span className="material-symbols-outlined">lightbulb</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recommended</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">48 Matches</p>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <span className="material-symbols-outlined">campaign</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alerts</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">3 New</p>
              </div>
            </div>
          </div>

          {/* Main Grid Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Box (Activity & Companies) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Recent Activity Timeline */}
              <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-bold text-slate-800">Recent Activity</h3>
                  <button className="text-sm font-semibold text-blue-600 hover:underline">View All</button>
                </div>
                <div className="relative pl-4 space-y-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
                  {/* Activity Item 1 */}
                  <div className="relative pl-6">
                    <div className="absolute left-[-21px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white"></div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:scale-[1.01] transition-transform">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-slate-800">Application Viewed</p>
                        <span className="text-[10px] text-slate-400">2h ago</span>
                      </div>
                      <p className="text-xs text-slate-500">Google reviewed your application for UX Design Intern position.</p>
                      <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">IN PROGRESS</div>
                    </div>
                  </div>

                  {/* Activity Item 2 */}
                  <div className="relative pl-6">
                    <div className="absolute left-[-21px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white"></div>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:scale-[1.01] transition-transform">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-slate-800">New Match Identified</p>
                        <span className="text-[10px] text-slate-400">1d ago</span>
                      </div>
                      <p className="text-xs text-slate-500">Stripe is looking for a Product Intern matching your React skills.</p>
                      <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">NEW MATCH</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Recommended Companies Slider */}
              <section className="space-y-4">
                <h3 className="text-base font-bold text-slate-800">Top Matches by Company</h3>
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
                  {/* Company 1 */}
                  <div className="min-w-[160px] bg-white rounded-2xl border border-slate-200 p-4 shadow-sm snap-start text-center flex flex-col items-center justify-center gap-3 hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                      <span className="material-symbols-outlined text-2xl text-slate-600">token</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">TechFlow</p>
                      <p className="text-[11px] font-bold text-blue-600 mt-0.5">92% Match</p>
                    </div>
                  </div>

                  {/* Company 2 */}
                  <div className="min-w-[160px] bg-white rounded-2xl border border-slate-200 p-4 shadow-sm snap-start text-center flex flex-col items-center justify-center gap-3 hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                      <span className="material-symbols-outlined text-2xl text-slate-600">blur_on</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">DesignSynergy</p>
                      <p className="text-[11px] font-bold text-blue-600 mt-0.5">88% Match</p>
                    </div>
                  </div>

                  {/* Company 3 */}
                  <div className="min-w-[160px] bg-white rounded-2xl border border-slate-200 p-4 shadow-sm snap-start text-center flex flex-col items-center justify-center gap-3 hover:-translate-y-1 transition-transform">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center p-2">
                      <span className="material-symbols-outlined text-2xl text-slate-600">hub</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">DataCore</p>
                      <p className="text-[11px] font-bold text-blue-600 mt-0.5">85% Match</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Box (AI Insights Sticky Widget) */}
            <div className="lg:col-span-4">
              <div className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-2xl p-6 lg:sticky lg:top-24 space-y-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <span className="material-symbols-outlined font-semibold">psychology</span>
                  <h3 className="text-base font-bold text-slate-800">AI Insights</h3>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50/50 to-white rounded-xl p-4 border border-blue-100 relative overflow-hidden">
                  <h4 className="text-xs font-bold text-slate-800">Boost your visibility</h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Adding <strong className="text-slate-700">Figma</strong> and <strong className="text-slate-700">Prototyping</strong> to your skills could increase your match rate by 15% based on current market trends.
                  </p>
                  <button className="mt-4 w-full bg-white border border-blue-600 text-blue-600 hover:bg-blue-50 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-xs">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Update Skills
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Trending Keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/40">React</span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/40">UX Research</span>
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/40">Python</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}