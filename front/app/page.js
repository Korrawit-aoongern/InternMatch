import Link from "next/link";

export default function Home() {
  return (
    <>
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md dark:bg-surface/70 border-b border-white/20 shadow-sm transition-transform duration-200">
        <div className="flex items-center justify-between px-lg py-md max-w-container-max mx-auto">
          <div className="font-h2 text-h2 font-bold text-primary">InternMatch</div>
          <div className="hidden md:flex items-center gap-lg font-body-lg text-body-lg">
            <a className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80" href="#features">Features</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80" href="#how-it-works">How It Works</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80" href="#testimonials">Testimonials</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80" href="#faq">FAQ</a>
          </div>
          <div className="flex items-center gap-md">
            <Link href="/login" className="font-body-sm text-body-sm text-primary hover:opacity-80 transition-all px-4 py-2 rounded-lg font-medium border border-transparent flex items-center justify-center">Login</Link>
            <a href="{{DATA:SCREEN:SCREEN_8}}" className="font-body-sm text-body-sm bg-primary-container text-white px-4 py-2 rounded-lg font-medium hover:bg-primary transition-colors active:scale-95 shadow-md flex items-center justify-center">Get Started</a>
          </div>
        </div>
      </nav>

      <main className="pt-[96px] pb-3xl space-y-[96px]">
        {/* Hero Section */}
        <section className="max-w-container-max mx-auto px-lg grid grid-cols-1 md:grid-cols-2 gap-2xl items-center pt-xl">
          <div className="space-y-lg">
            <h1 className="font-h1 text-h1 md:text-[48px] md:leading-[1.1] text-on-background">
              ค้นหาที่ฝึกงานที่ใช่ด้วยระบบ <span className="text-primary-container">AI อัจฉริยะ</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              จับคู่ทักษะของคุณกับบริษัทชั้นนำ พร้อมวิเคราะห์ Skill Gap เพื่อเตรียมความพร้อมก่อนทำงานจริง
            </p>
            <div className="flex flex-wrap gap-md pt-sm">
              <a
                href="{{DATA:SCREEN:SCREEN_13}}"
                className="flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-lg font-body-sm text-body-sm font-medium hover:bg-primary transition-colors hover:-translate-y-1 shadow-md"
              >
                <span className="material-symbols-outlined" data-icon="search" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
                ค้นหาที่ฝึกงาน
              </a>
              <a
                href="{{DATA:SCREEN:SCREEN_8}}"
                className="flex items-center gap-2 border border-primary-container text-primary-container px-6 py-3 rounded-lg font-body-sm text-body-sm font-medium hover:bg-primary-container/10 transition-colors hover:-translate-y-1"
              >
                สร้างบัญชีผู้ใช้
                <span className="material-symbols-outlined" data-icon="arrow_forward" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
              </a>
            </div>
          </div>
          <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <div
              className="absolute inset-0 bg-cover bg-center w-full h-full rounded-2xl"
              data-alt="A clean, modern corporate illustration depicting a highly organized, professional dashboard interface floating in abstract space. The design uses high-key, soft white lighting with a pristine white background. Elements include glassmorphism panels, subtle shadows, and crisp blue accents (#2563EB) showcasing charts, profile cards, and AI-driven match metrics. The mood is intelligent, efficient, and forward-thinking."
              style={{
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCtf2cv8-5z4FKnE0yDnVlvn0pz7W0sGREWodggVhFsDYvIO-eOxIjlLjSg-AyBG3FcLKEni-y5rwuDREvwcE7CsJ-DetGXQX2KInYw26uqGxwyoNiUQIpgGRefOTul1bZW6tw-VoNP5DgCfR-MGXtK4L9utDfJdvUGQ-jjzQE2c9zqvCh4japovLJsO0_LT_1Cs2KPfwcaZJ7FCVl33q1pkdqHeFYsfKLe7iVYSbpq5JnmmFtV0wYhd7I-aKXpgfZUxQTUNmoI0FdT')"
              }}
            />
          </div>
        </section>

        {/* Stats Strip */}
        <section className="bg-primary-container py-xl">
          <div className="max-w-container-max mx-auto px-lg grid grid-cols-1 md:grid-cols-3 gap-lg text-center">
            <div className="space-y-2">
              <div className="font-h1 text-h1 text-white">10,000+</div>
              <div className="font-body-sm text-body-sm text-primary-fixed-dim">นักศึกษา</div>
            </div>
            <div className="space-y-2 border-y md:border-y-0 md:border-x border-white/20 py-md md:py-0">
              <div className="font-h1 text-h1 text-white">500+</div>
              <div className="font-body-sm text-body-sm text-primary-fixed-dim">บริษัทชั้นนำ</div>
            </div>
            <div className="space-y-2">
              <div className="font-h1 text-h1 text-white">92%</div>
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
                <span className="material-symbols-outlined text-[28px]" data-icon="memory">memory</span>
              </div>
              <h3 className="font-h2-mobile text-h2-mobile mb-2">ระบบจับคู่อัจฉริยะ</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">วิเคราะห์โปรไฟล์และจับคู่กับตำแหน่งที่เหมาะสมที่สุด</p>
            </div>
            {/* Card 2 */}
            <div className="bg-surface rounded-[16px] p-lg transition-transform duration-300 hover:-translate-y-[4px] hover:shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1),_0_2px_4px_-2px_rgb(0,0,0,0.1)] border border-outline-variant/30">
              <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container mb-md">
                <span className="material-symbols-outlined text-[28px]" data-icon="school">school</span>
              </div>
              <h3 className="font-h2-mobile text-h2-mobile mb-2">แนะนำคอร์สเรียนเพิ่มทักษะ</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">เรียนรู้ทักษะที่ขาดเพื่อเตรียมพร้อมสู่โลกการทำงาน</p>
            </div>
            {/* Card 3 */}
            <div className="bg-surface rounded-[16px] p-lg transition-transform duration-300 hover:-translate-y-[4px] hover:shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1),_0_2px_4px_-2px_rgb(0,0,0,0.1)] border border-outline-variant/30">
              <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container mb-md">
                <span className="material-symbols-outlined text-[28px]" data-icon="tune">tune</span>
              </div>
              <h3 className="font-h2-mobile text-h2-mobile mb-2">ค้นหาง่ายและตรงจุด</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">ฟิลเตอร์การค้นหาที่ละเอียดและใช้งานง่าย</p>
            </div>
            {/* Card 4 */}
            <div className="bg-surface rounded-[16px] p-lg transition-transform duration-300 hover:-translate-y-[4px] hover:shadow-[0_4px_6px_-1px_rgb(0,0,0,0.1),_0_2px_4px_-2px_rgb(0,0,0,0.1)] border border-outline-variant/30">
              <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary-container mb-md">
                <span className="material-symbols-outlined text-[28px]" data-icon="notifications">notifications</span>
              </div>
              <h3 className="font-h2-mobile text-h2-mobile mb-2">แจ้งเตือนไม่พลาดทุกโอกาส</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">รับข่าวสารและตำแหน่งงานใหม่ๆ ที่ตรงกับคุณทันที</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-2xl bg-surface-container-low dark:bg-surface-dim border-t border-outline-variant">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-lg px-lg max-w-container-max mx-auto">
          <div className="space-y-md">
            <div className="font-h2 text-h2 font-bold text-primary">InternMatch</div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              AI Career Portal สำหรับนักศึกษาและบริษัทชั้นนำ
            </p>
            <div className="font-body-sm text-body-sm text-on-surface-variant mt-xl opacity-100">
              © 2024 InternMatch AI. All rights reserved.
            </div>
          </div>
          <div className="space-y-sm">
            <h4 className="font-body-lg text-body-lg font-bold text-on-background mb-sm">Platform</h4>
            <ul className="space-y-2 font-body-sm text-body-sm">
              <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Features</a></li>
              <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">How It Works</a></li>
              <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Pricing</a></li>
            </ul>
          </div>
          <div className="space-y-sm">
            <h4 className="font-body-lg text-body-lg font-bold text-on-background mb-sm">Legal</h4>
            <ul className="space-y-2 font-body-sm text-body-sm">
              <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Privacy Policy</a></li>
              <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Terms of Service</a></li>
              <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Cookie Policy</a></li>
            </ul>
          </div>
          <div className="space-y-sm">
            <h4 className="font-body-lg text-body-lg font-bold text-on-background mb-sm">Support</h4>
            <ul className="space-y-2 font-body-sm text-body-sm">
              <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Contact Us</a></li>
              <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Help Center</a></li>
              <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">FAQ</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </>
  );
}
