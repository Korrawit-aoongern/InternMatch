import Link from "next/link";
import { 
  School,        // นักศึกษา / การศึกษา
  Cpu,           // Memory / ประมวลผล / AI
  Sliders,       // Tune / ปรับแต่ง
  Bell,
  Search,
  ArrowRight
} from 'lucide-react';
import LandingNavbar from "@/components/layout/LandingNavbar";
import LandingFooter from "@/components/layout/LandingFooter";

export default function Home() {
  return (
    <>
      <LandingNavbar />

      <main className="pt-[96px] pb-3xl space-y-[96px]">
        {/* Hero Section */}
        <section className="max-w-container-max mx-auto px-lg grid grid-cols-1 md:grid-cols-2 gap-2xl items-center pt-xl">
          <div className="space-y-lg">
            <h1 className="font-h1 text-h1 md:text-[48px] md:leading-[1.1] text-on-background">
              ค้นหาที่ฝึกงานที่ใช่ด้วยระบบ <span className="text-primary-container">AI อัจฉริยะ</span>
            </h1>
            <p>
              จับคู่ทักษะของคุณกับบริษัทชั้นนำ พร้อมวิเคราะห์ Skill Gap เพื่อเตรียมความพร้อมก่อนทำงานจริง
            </p>
            <div className="flex flex-wrap gap-md pt-sm">
              <Link
                href="/auth/login"
                className="flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-lg font-body-sm text-body-sm font-medium hover:bg-primary transition-colors hover:-translate-y-1 shadow-md"
              >
                <Search/>
                ค้นหาที่ฝึกงาน
              </Link>
              <Link
                href="/auth/register"
                className="flex items-center gap-2 border border-primary-container text-primary-container px-6 py-3 rounded-lg font-body-sm text-body-sm font-medium hover:bg-primary-container/10 transition-colors hover:-translate-y-1"
              >
                สร้างบัญชีผู้ใช้
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
          {/* Product UI Mock - Option 2 */}
          <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-slate-50 border border-slate-200 p-3 md:p-5 flex flex-col gap-3 md:gap-4">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-full h-7 border border-slate-200 flex items-center px-3 gap-2 text-xs text-slate-400">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                internmatch.co.th/dashboard
              </div>
            </div>

            {/* Mock header */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 md:p-4 flex justify-between items-center shrink-0">
              <div>
                <div className="text-[11px] font-bold text-primary-container uppercase tracking-wider">Student Dashboard</div>
                <div className="text-sm font-bold text-slate-800">Welcome back, Alex!</div>
                <div className="text-[11px] text-slate-500">Here&apos;s your career progress at a glance.</div>
              </div>
              <div className="hidden sm:flex bg-primary-container text-white text-xs font-semibold px-3 py-1.5 rounded-lg items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> AI Resume Review
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 md:gap-3 shrink-0">
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Match Score</div>
                <div className="text-sm font-black text-slate-800">High (82%)</div>
                <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-[82%] bg-emerald-500 rounded-full" />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Applied</div>
                <div className="text-sm font-black text-slate-800">5 Positions</div>
                <div className="text-[11px] text-primary-container font-semibold mt-1">View →</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-2.5 md:p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Recommended</div>
                <div className="text-sm font-black text-emerald-600">12 Matches</div>
                <div className="text-[11px] text-slate-500 mt-1">Top 92% fit</div>
              </div>
            </div>

            {/* Internships list + AI Insights */}
            <div className="flex-1 grid grid-cols-5 gap-3 min-h-0">
              <div className="col-span-3 bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-2.5 overflow-hidden">
                <div className="flex justify-between items-center shrink-0">
                  <span className="text-xs font-bold text-slate-800">Recommended for you</span>
                  <span className="text-[11px] font-semibold text-primary-container">View All</span>
                </div>
                {/* Card 1 */}
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-2.5 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <div className="text-xs font-bold text-slate-800 leading-tight">Frontend Intern — SCB TechX</div>
                    <span className="shrink-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">92% Match</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Bangkok • React • Tailwind</div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[92%] bg-primary-container rounded-full" />
                  </div>
                </div>
                {/* Card 2 */}
                <div className="bg-slate-50 rounded-lg border border-slate-100 p-2.5 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <div className="text-xs font-bold text-slate-800 leading-tight">Data Science Intern — Agoda</div>
                    <span className="shrink-0 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">78% Match</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Bangkok • Python • SQL</div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full w-[78%] bg-primary-container rounded-full" />
                  </div>
                </div>
                <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1.5 font-medium">
                  ⚠️ Skill Gap: ขาด Docker (แนะนำคอร์ส 2 ชม.)
                </div>
              </div>

              {/* AI Insights mini */}
              <div className="col-span-2 bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-2 overflow-hidden">
                <div className="flex items-center gap-1.5 text-primary-container shrink-0">
                  <Cpu className="w-4 h-4" />
                  <span className="text-xs font-bold text-slate-800">AI Insights</span>
                  <span className="ml-auto text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">SE 100%</span>
                </div>
                <div className="bg-gradient-to-br from-blue-50/60 to-white rounded-lg border border-blue-100 p-2.5 space-y-2 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Resume Score</span>
                    <span className="text-sm font-black text-primary-container">86<span className="text-[10px] text-slate-400">/100</span></span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]"><span className="text-slate-600">Structure</span><span className="font-bold">90/100</span></div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full w-[90%] bg-emerald-500 rounded-full" /></div>
                    <div className="flex justify-between text-[10px]"><span className="text-slate-600">Skills</span><span className="font-bold">78/100</span></div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full w-[78%] bg-amber-500 rounded-full" /></div>
                    <div className="flex justify-between text-[10px]"><span className="text-slate-600">Experience</span><span className="font-bold">85/100</span></div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full w-[85%] bg-emerald-500 rounded-full" /></div>
                  </div>
                  <div className="text-[10px] font-semibold text-white bg-primary-container rounded-md px-2 py-1.5 text-center">
                    ดูรายงานฉบับเต็ม →
                  </div>
                </div>
              </div>
            </div>

            {/* subtle glow */}
            <div className="pointer-events-none absolute -bottom-10 -right-10 w-40 h-40 bg-primary-container/10 rounded-full blur-2xl" />
          </div>
        </section>

        {/* Stats Strip */}
        <section className="bg-primary-container py-xl">
          <div className="max-w-container-max mx-auto px-lg grid grid-cols-1 md:grid-cols-3 gap-lg text-center">
            <div className="space-y-2">
              <div className="font-h1 text-h1 text-white">1000+</div>
              <div className="font-body-sm text-body-sm text-primary-fixed-dim">นักศึกษา</div>
            </div>
            <div className="space-y-2 border-y md:border-y-0 md:border-x border-white/20 py-md md:py-0">
              <div className="font-h1 text-h1 text-white">50+</div>
              <div className="font-body-sm text-body-sm text-primary-fixed-dim">บริษัทชั้นนำ</div>
            </div>
            <div className="space-y-2">
              <div className="font-h1 text-h1 text-white">95.9%</div>
              <div className="font-body-sm text-body-sm text-primary-fixed-dim">อัตราการจับคู่สำเร็จ</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-container-max mx-auto px-lg" id="features">
          <div className="text-center mb-xl space-y-sm">
            <h2 className="font-h2 text-h2 text-on-background">ฟีเจอร์เด่น</h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant">เทคโนโลยีที่จะช่วยให้การหางานของคุณง่ายขึ้น</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
            {/* Card 1 */}
            <div className="bg-surface rounded-[16px] p-lg transition-transform duration-300 hover:-translate-y-[4px] hover:shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1),_0_2px_4px_-2px_rgb(0,0,0,0.1)] border border-outline-variant/30">
              <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container mb-md">
                <Cpu/>
              </div>
              <h3 className="font-h2-mobile text-h2-mobile mb-2">ระบบจับคู่อัจฉริยะ</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">วิเคราะห์โปรไฟล์และจับคู่กับตำแหน่งที่เหมาะสมที่สุด</p>
            </div>
            {/* Card 2 */}
            <div className="bg-surface rounded-[16px] p-lg transition-transform duration-300 hover:-translate-y-[4px] hover:shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1),_0_2px_4px_-2px_rgb(0,0,0,0.1)] border border-outline-variant/30">
              <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container mb-md">
                <School />
              </div>
              <h3 className="font-h2-mobile text-h2-mobile mb-2">แนะนำคอร์สเรียนเพิ่มทักษะ</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">เรียนรู้ทักษะที่ขาดเพื่อเตรียมพร้อมสู่โลกการทำงาน</p>
            </div>
            {/* Card 3 */}
            <div className="bg-surface rounded-[16px] p-lg transition-transform duration-300 hover:-translate-y-[4px] hover:shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1),_0_2px_4px_-2px_rgb(0,0,0,0.1)] border border-outline-variant/30">
              <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container mb-md">
                <Sliders/>
              </div>
              <h3 className="font-h2-mobile text-h2-mobile mb-2">ค้นหาง่ายและตรงจุด</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">ฟิลเตอร์การค้นหาที่ละเอียดและใช้งานง่าย</p>
            </div>
            {/* Card 4 */}
            <div className="bg-surface rounded-[16px] p-lg transition-transform duration-300 hover:-translate-y-[4px] hover:shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1),_0_2px_4px_-2px_rgb(0,0,0,0.1)] border border-outline-variant/30">
              <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container mb-md">
                <Bell/>
              </div>
              <h3 className="font-h2-mobile text-h2-mobile mb-2">แจ้งเตือนไม่พลาดทุกโอกาส</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">รับข่าวสารและตำแหน่งงานใหม่ๆ ที่ตรงกับคุณทันที</p>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </>
  );
}
