# 4. โครงสร้างของระบบ InternMatch

ระบบ **InternMatch (แพลตฟอร์มจับคู่ตำแหน่งฝึกงานด้วยทักษะและปัญญาประดิษฐ์)** ได้รับการออกแบบและพัฒนาขึ้นบนสถาปัตยกรรมแบบ **Full-Stack Web Application** โดยใช้เฟรมเวิร์ก **Next.js (App Router)** เป็นแกนหลัก ซึ่งเป็นการรวมส่วนการทำงานทั้ง Front-End (ส่วนติดต่อผู้ใช้) และ Back-End (บริการจัดการข้อมูลและตรรกะทางธุรกิจ) ไว้ภายใต้โครงสร้างโปรเจกต์เดียวกันในโฟลเดอร์ `front/` ช่วยลดความซับซ้อนในการเชื่อมต่อ เพิ่มประสิทธิภาพการประมวลผลบนฝั่งเซิร์ฟเวอร์ (Server-Side Execution) และเพิ่มความปลอดภัยในการเข้าถึงฐานข้อมูลและการประมวลผลตรรกะระดับสูง

---

## 4.1 สถาปัตยกรรมระบบและการทำงานฝั่ง Back-End ของระบบ InternMatch

สถาปัตยกรรมของระบบ InternMatch ถูกแบ่งออกเป็น 4 ลำดับชั้นหลัก (Layered Architecture) เพื่อให้ระบบมีความเป็นสัดส่วน (Modularity) ง่ายต่อการบำรุงรักษา และมีความปลอดภัยสูง ดังแสดงในภาพที่ 4

![ภาพที่ 4 แสดงโครงสร้าง Back-End และสถาปัตยกรรมระบบ InternMatch](file:///D:/int/internmatch/Section4_SystemStructure.png)

**ภาพที่ 4** แสดงโครงสร้าง Back-End และสถาปัตยกรรมระบบ InternMatch (Next.js Integrated Architecture)

### การอภิปรายรายละเอียดสถาปัตยกรรมระบบในแต่ละส่วน (ภาพที่ 4)

จากภาพที่ 4 โครงสร้างสถาปัตยกรรมของระบบ InternMatch แบ่งออกเป็น 4 ชั้นการทำงานหลัก ได้แก่:

1. **ชั้นที่ 1: Client Layer (Web Application Frontend)**  
   เป็นส่วนติดต่อผู้ใช้งานที่พัฒนาด้วย **Next.js 15, React 19 และ Tailwind CSS** ทำหน้าที่แสดงผลข้อมูลและรับการโต้ตอบจากผู้ใช้ รองรับการแสดงผลทุกขนาดหน้าจอ (Responsive Design) ประกอบด้วย:
   - **Landing Page & Help Center:** ส่วนหน้าแรกของระบบ แสดงฟีเจอร์เด่น สถิติการใช้งาน และศูนย์ช่วยเหลือแนะนำการใช้งานระบบ
   - **Authentication UI:** ฟอร์มเข้าสู่ระบบ (Login), ฟอร์มสมัครสมาชิก (Register) ที่แยกตามประเภทผู้ใช้ (นักศึกษา และ บริษัท), และหน้าระบบขอรีเซ็ตรหัสผ่าน
   - **User Dashboards:** แดชบอร์ดสำหรับนักศึกษา (StudentDashboard) แสดงสถิติและตำแหน่งงานแนะนำ และแดชบอร์ดสำหรับบริษัท (CompanyDashboard) แสดงรายชื่อผู้สมัครและสถิติประกาศงาน
   - **Matching & Interactive UI:** การ์ดแสดงผลตำแหน่งงานและผลคะแนน Match Score (`MatchCardItem`), การ์ดแสดงคอร์สเรียนแนะนำจาก AI (`RecommendationResourceCard`), โมดูลจัดการทักษะแบบโต้ตอบ (`SkillsManagement`) และกล่องแจ้งเตือนสถานะการทำงาน (`AppModal`, `Toaster`)

2. **ชั้นที่ 2: Next.js API & Routing Layer (App Router & Route Handlers)**  
   ทำหน้าที่เป็นจุดรับส่งข้อมูล (Entry Points) ระหว่างผู้ใช้งานกับเซิร์ฟเวอร์ ผ่านโพรโทคอล HTTP/HTTPS ในรูปแบบ REST API Route Handlers และการเรียกใช้ผ่าน Server Actions RPC:
   - `app/api/auth/login`: ตรวจสอบอีเมล/ชื่อผู้ใช้ เปรียบเทียบรหัสผ่านที่เข้ารหัสด้วย `bcryptjs` และสร้างโทเค็นยืนยันตัวตนในรูปแบบ HTTP-only Cookie JWT
   - `app/api/auth/register`: รองรับข้อมูลการลงทะเบียนผู้ใช้งานใหม่ แยกประเภทบทบาทผู้ใช้ และบันทึกข้อมูลอย่างปลอดภัย
   - `app/api/auth/forgot-password` และ `reset-password`: ตรวจสอบและสร้างโทเค็นรีเซ็ตรหัสผ่านที่มีอายุจำกัด พร้อมประสานงานกับบริการ Nodemailer เพื่อส่งอีเมลแจ้งลิงก์ยืนยัน

3. **ชั้นที่ 3: Backend & Business Logic Layer (Server Actions & Services ใน front/lib/)**  
   เป็นแกนกลางในการประมวลผลตรรกะทางธุรกิจ (Business Logic) ของระบบ ซึ่งทำงานบนสภาพแวดล้อม **Node.js Runtime บนฝั่งเซิร์ฟเวอร์ (Server Actions)** เพื่อความปลอดภัย โดยเบราว์เซอร์ไม่สามารถเข้าถึงซอร์สโค้ดส่วนนี้ได้ ประกอบด้วย:
   - `lib/actions/auth.ts`: บริการจัดการบัญชีผู้ใช้, ระบบตรวจสอบสิทธิ์ (Role-Based Access Control: RBAC), การจัดการโปรไฟล์นักศึกษา/บริษัท และการอัปโหลดไฟล์
   - `lib/actions/internships.ts`: บริการ CRUD ตำแหน่งงานฝึกงาน, การจัดการส่งใบสมัครของนักศึกษา, และการอัปเดตสถานะผลการคัดเลือก
   - `lib/actions/skills.ts`: บริการจัดการข้อมูลทักษะมาตรฐาน, การบันทึกและแก้ไขระดับความชำนาญของนักศึกษา (Beginner, Intermediate, Advanced)
   - `lib/actions/portfolios.ts`: บริการจัดการลิงก์และผลงานโปรเจกต์ของนักศึกษา
   - `lib/utils/match.ts`: อัลกอริทึมวิเคราะห์และคำนวณคะแนนความเข้ากันได้ (Match Score) ถ่วงน้ำหนักตามระดับความชำนาญของทักษะ (Level-Weighted Algorithm)
   - `lib/actions/geminiRecommendations.ts`: บริการประมวลผลการวิเคราะห์ช่องว่างทักษะ (Skill Gap) และแนะนำคอร์สเรียนหรือสื่อการเรียนรู้เฉพาะบุคคลผ่าน Google Gemini AI

4. **ชั้นที่ 4: Database & External Services Layer**  
   เป็นชั้นจัดเก็บข้อมูลถาวรและบริการภายนอกที่ช่วยขับเคลื่อนระบบ:
   - **Supabase PostgreSQL:** ระบบฐานข้อมูลเชิงสัมพันธ์ ประกอบด้วย 9 ตารางหลัก (`users`, `students`, `companies`, `skills`, `student_skills`, `internships`, `internship_skills`, `applications`, `portfolios`)
   - **Supabase Storage:** บักเก็ตจัดเก็บไฟล์จริง ได้แก่ `avatars` (รูปภาพโปรไฟล์/โลโก้บริษัท) และ `resumes` (ไฟล์เอกสารเรซูเม่ PDF)
   - **Google Gemini AI API:** บริการ Large Language Model ภายนอก สำหรับวิเคราะห์จุดแข็ง-จุดอ่อนของนักศึกษา พร้อมแนะนำแหล่งเรียนรู้คุณภาพสูง
   - **Nodemailer SMTP Service:** บริการส่งอีเมลแจ้งเตือนอัตโนมัติไปยังนักศึกษาเมื่อผ่านการคัดเลือกเข้าฝึกงาน และอีเมลรีเซ็ตรหัสผ่าน

---

### โครงสร้างโฟลเดอร์หลักของระบบ

ตารางที่ 2 แสดงโครงสร้างโฟลเดอร์หลักของระบบ InternMatch ซึ่งจัดระเบียบตามสถาปัตยกรรม Next.js Full-Stack Web Application

**ตารางที่ 2** แสดงโครงสร้างโฟลเดอร์หลักของระบบ InternMatch

| ลำดับ | ชื่อโฟลเดอร์ (Folder) | หน้าที่และความรับผิดชอบ |
| :---: | :--- | :--- |
| 1 | `front/app/` | โฟลเดอร์หลักของ Next.js App Router ทำหน้าที่จัดการเส้นทางของระบบ (Routing), หน้าแสดงผลของเว็บแอปพลิเคชัน (Pages/Layouts) และ API Route Handlers สำหรับบริการหลังบ้าน เช่น ระบบ Authentication |
| 2 | `front/app/api/` | โฟลเดอร์เก็บ Endpoint API สำหรับรับส่งข้อมูลภายนอกและภายในระบบผ่าน HTTP Methods (POST, GET) เช่น การเข้าสู่ระบบ การออกจากระบบ และการส่งคำขอรีเซ็ตรหัสผ่าน |
| 3 | `front/components/` | โฟลเดอร์สำหรับเก็บคอมโพเนนต์ส่วนติดต่อผู้ใช้ (UI Components) ที่ถูกแบ่งเป็นส่วนย่อยแบบโมดูลาร์ เช่น แดชบอร์ด ฟอร์ม การ์ดแสดงผล และกล่องข้อความแจ้งเตือน |
| 4 | `front/lib/actions/` | โฟลเดอร์สำหรับเก็บ Server Actions ที่ทำหน้าที่เสมือน Controllers และ Services ฝั่ง Back-End จัดการตรรกะทางธุรกิจทั้งหมด เช่น การจัดการข้อมูลผู้ใช้ งานฝึกงาน ทักษะ และการเชื่อมต่อ AI |
| 5 | `front/lib/supabase/` | โฟลเดอร์สำหรับเก็บไฟล์คอนฟิกูเรชันและการเชื่อมต่อฐานข้อมูล Supabase PostgreSQL (เชื่อมต่อผ่าน Supabase Admin Client ด้วย Service Role Key) |
| 6 | `front/lib/utils/` | โฟลเดอร์สำหรับเก็บฟังก์ชันอรรถประโยชน์ (Utility Functions) ตรรกะช่วยคำนวณ เช่น อัลกอริทึมคำนวณ Match Score, บริการส่งอีเมลผ่าน Nodemailer และระบบ Fallback Mock Analysis |
| 7 | `front/public/` | โฟลเดอร์สำหรับจัดเก็บไฟล์ทรัพยากรคงที่ (Static Assets) ของระบบ เช่น รูปภาพไอคอน โลโก้ และฟอนต์ที่ให้บริการตรงสู่หน้าเว็บ |

---

## 4.2 โครงสร้างไฟล์และการทำงานของระบบฝั่ง Back-End Services

ระบบ InternMatch รวมการทำงานของฝั่ง Back-End ไว้ภายใต้โครงสร้างโฟลเดอร์หลัก `front/` เพื่อให้สอดรับกับการประมวลผลแบบ Server-Side First ของ Next.js ซึ่งมีการจัดระเบียบไฟล์ดังแสดงในภาพที่ 5

![ภาพที่ 5 แสดงโครงสร้างไฟล์ของระบบ InternMatch](file:///D:/int/internmatch/Section4_FileStructure.png)

**ภาพที่ 5** แสดงโครงสร้างไฟล์ของระบบ InternMatch (โฟลเดอร์หลัก front/)

### การอภิปรายรายละเอียดโครงสร้างไฟล์และการทำงาน (ภาพที่ 5)

จากภาพที่ 5 โครงสร้างไฟล์ถูกแบ่งออกเป็น 3 หมวดหมู่หลักตามหน้าที่ความรับผิดชอบ:

1. **หมวด Routing & Pages (`front/app/`):** จัดการเส้นทางการนำทางและจุดให้บริการ API ได้แก่:
   - `page.tsx & layout.tsx`: หน้าแรกของระบบและ Root Layout ที่รวมการตั้งค่า Global CSS และ Navigation Bar
   - `auth/login/` และ `auth/register/`: หน้าอินเทอร์เฟซเข้าสู่ระบบและสมัครสมาชิก
   - `auth/forgot-pw/` และ `auth/reset-pw/`: หน้าจัดการการขอรีเซ็ตรหัสผ่านและการเปลี่ยนรหัสผ่านใหม่
   - `dashboard/profile/`: หน้าจัดการโปรไฟล์ ประวัติการศึกษา และการอัปโหลดเรซูเม่
   - `dashboard/internships/`: หน้าสำหรับบริษัทในการประกาศรับสมัครและจัดการตำแหน่งฝึกงาน
   - `dashboard/applications/`: หน้าติดตามใบสมัครและการพิจารณาผู้สมัครฝึกงาน
   - `matches/page.tsx`: หน้าจอแสดงรายการตำแหน่งงานที่จับคู่กับทักษะของนักศึกษา
   - `api/auth/`: Route Handlers สำหรับบริการ Authentication API

2. **หมวด UI Library (`front/components/`):** คอมโพเนนต์ฝั่ง Front-End ที่ทำหน้าที่เรนเดอร์ข้อมูลและเชื่อมต่อกับ Server Actions ได้แก่:
   - `layout/`: คอมโพเนนต์แถบเมนูด้านบน (Navbar), ส่วนท้ายเว็บ (Footer), และแถบข้างแดชบอร์ด (Sidebar)
   - `dashboard/`: คอมโพเนนต์แดชบอร์ดของนักศึกษาและบริษัท
   - `matches/`: การ์ดแสดงผลการจับคู่ทักษะ (`MatchCardItem`), การ์ดคอร์สเรียนแนะนำ (`RecommendationResourceCard`), และป็อปอัปแสดงรายละเอียดงาน (`MatchesInternshipDetailsModal`)
   - `ui/`: คอมโพเนนต์ย่อย เช่น ระบบจัดการทักษะแบบ Interactive (`SkillsManagement`), โมดัลป็อปอัป (`AppModal`) และการแจ้งเตือน (`Toaster`)

3. **หมวด Server Actions & Utils (`front/lib/`):** ทำหน้าที่เป็น Back-End Services และ Business Logic Layer ทั้งหมดของระบบ ประมวลผลบนฝั่งเซิร์ฟเวอร์โดยตรง

---

### โครงสร้างไฟล์และการทำงานของ Back-End Services

ตารางที่ 3 แสดงรายละเอียดไฟล์บริการ (Services / Server Actions) ฝั่ง Back-End ภายในโฟลเดอร์ `front/lib/` ซึ่งทำหน้าที่จัดการข้อมูล ตรรกะทางธุรกิจ และการสื่อสารกับฐานข้อมูลและบริการภายนอก

**ตารางที่ 3** แสดงโครงสร้างไฟล์และฟังก์ชันการทำงานส่วน Back-End Services ของระบบ InternMatch

| ลำดับ | ชื่อไฟล์ (Folder/File) | หน้าที่และความรับผิดชอบ (Functions & Responsibilities) |
| :---: | :--- | :--- |
| 1 | `front/lib/actions/auth.ts` | ทำหน้าที่จัดการระบบยืนยันตัวตนและบัญชีผู้ใช้ (Authentication & Authorization):<br>• `checkUserExists`: ตรวจสอบการซ้ำของอีเมลหรือชื่อผู้ใช้<br>• `registerUser`: ลงทะเบียนผู้ใช้ใหม่พร้อมแฮชรหัสผ่านด้วย `bcryptjs`<br>• `getStudentProfile` / `updateStudentProfile`: ดึงและแก้ไขข้อมูลโปรไฟล์นักศึกษา<br>• `getCompanyProfile` / `updateCompanyProfile`: ดึงและแก้ไขข้อมูลโปรไฟล์บริษัท<br>• `uploadProfileImage` / `uploadResume`: อัปโหลดรูปโปรไฟล์และไฟล์เรซูเม่ (PDF) ไปยัง Supabase Storage<br>• `changeUserPassword`: ตรวจสอบรหัสผ่านเดิมและเปลี่ยนรหัสผ่านใหม่<br>• `getUserRole`: ตรวจสอบสิทธิ์และบทบาทของผู้ใช้งานจาก JWT Cookie |
| 2 | `front/lib/actions/internships.ts` | ทำหน้าที่จัดการประกาศรับสมัครงานฝึกงานและกระบวนการสมัครงาน (Internships & Applications Management):<br>• `createInternship` / `updateInternship` / `deleteInternship`: บริการ CRUD ตำแหน่งงานฝึกงานและทักษะที่ต้องการ<br>• `getCompanyInternships`: ดึงรายการตำแหน่งงานของบริษัทที่เข้าสู่ระบบ<br>• `getStudentInternships`: ดึงรายการงานฝึกงานทั้งหมดสำหรับนักศึกษาค้นหา<br>• `applyToInternship` / `cancelApplication`: บริการส่งใบสมัครฝึกงานและยกเลิกการสมัครงาน<br>• `getInternshipApplicants` / `getCompanyApplications`: ดึงรายชื่อผู้สมัครและคะแนน Match Score สำหรับบริษัทพิจารณา<br>• `updateApplicationStatus`: อัปเดตสถานะการสมัคร (Pending, Accepted, Rejected) พร้อมสั่งส่งอีเมลแจ้งผล |
| 3 | `front/lib/actions/skills.ts` | ทำหน้าที่จัดการข้อมูลทักษะ (Skill Management Service):<br>• `getMasterSkills`: ดึงรายการทักษะมาตรฐานทั้งหมดจากตารางกลาง (`skills`) เพื่อใช้เป็นตัวเลือก<br>• `getStudentSkills`: ดึงข้อมูลทักษะและระดับความชำนาญของนักศึกษา<br>• `updateStudentSkills`: บันทึก ปรับปรุง และลบทักษะของนักศึกษา พร้อมกำหนดระดับความเชี่ยวชาญ (Beginner, Intermediate, Advanced) |
| 4 | `front/lib/actions/portfolios.ts` | ทำหน้าที่จัดการแฟ้มสะสมผลงานและโครงงานของนักศึกษา (Portfolio Service):<br>• `getStudentPortfolios`: ดึงรายการผลงานและลิงก์โปรเจกต์ของนักศึกษา<br>• `updateStudentPortfolios`: เพิ่ม แก้ไข หรือลบรายการผลงานของนักศึกษาลงฐานข้อมูล |
| 5 | `front/lib/utils/match.ts` | ทำหน้าที่คำนวณคะแนนความเข้ากันได้ระหว่างผู้สมัครกับตำแหน่งงาน (Skill Matching Engine):<br>• `calculateMatchScoreHelper`: อัลกอริทึมคำนวณ Match Score (%) โดยเปรียบเทียบทักษะที่นักศึกษามีกับทักษะที่งานต้องการ และคำนวณค่าน้ำหนักระดับความเชี่ยวชาญ (Level Weights: Beginner=1, Intermediate=2, Advanced=3) สรุปออกมาเป็นค่าร้อยละ (0–100%) |
| 6 | `front/lib/actions/geminiRecommendations.ts` | ทำหน้าที่ให้บริการวิเคราะห์ทักษะและแนะนำสื่อการเรียนรู้ด้วย AI (AI Skill Gap & Upskilling Service):<br>• `getAiSkillRecommendations`: วิเคราะห์ความต่างระหว่างทักษะที่นักศึกษามีและทักษะที่งานต้องการ (Gap Analysis) ส่ง Prompt ไปยัง Google Gemini Generative AI REST API เพื่อสร้างคำแนะนำคอร์สเรียน วิดีโอ และแหล่งเรียนรู้ที่เหมาะสม พร้อมระบบ Fallback เมื่อเกิดปัญหาการเชื่อมต่อ |
| 7 | `front/lib/utils/email.ts` | ทำหน้าที่บริการส่งอีเมลแจ้งเตือนอัตโนมัติ (Email Notification Service):<br>• `sendStudentAcceptedEmail`: ส่งอีเมลแจ้งเตือนผลการคัดเลือกเข้าฝึกงาน (Offer Acceptance Notification) ในรูปแบบ HTML Template ที่สวยงามผ่าน Nodemailer SMTP ไปยังอีเมลของนักศึกษาโดยอัตโนมัติเมื่อบริษัทกดตอบรับ |
| 8 | `front/lib/supabase/server.ts` | ทำหน้าที่เป็นตัวเชื่อมต่อฐานข้อมูลฝั่งเซิร์ฟเวอร์ (Database Connection Provider):<br>• `getSupabaseAdmin`: สร้างและส่งคืน Supabase Client Instance โดยใช้ `SUPABASE_SERVICE_ROLE_KEY` เพื่อให้ฝั่ง Back-End มีสิทธิ์ในการอ่านเขียนฐานข้อมูลได้อย่างสมบูรณ์และปลอดภัย |

---

## 4.3 ระบบย่อยและการทำงานร่วมกันของระบบ InternMatch (Subsystems & Workflow)

เพื่อให้เห็นภาพการทำงานเชิงลึกของระบบฝั่ง Back-End ที่ฝังตัวอยู่ภายในโครงสร้าง Full-Stack Next.js ระบบ InternMatch ประกอบไปด้วย 5 ระบบย่อยสำคัญที่ทำงานประสานกันอย่างมีประสิทธิภาพ ดังนี้:

### 4.3.1 ระบบยืนยันตัวตนและการควบคุมสิทธิ์การเข้าถึง (Authentication & Role-Based Access Control: RBAC)
- **การยืนยันตัวตน (Authentication):** เมื่อผู้ใช้เข้าสู่ระบบผ่าน `app/api/auth/login` ข้อมูลจะถูกตรวจสอบความถูกต้อง รหัสผ่านจะถูกตรวจสอบความตรงกันด้วยกระบวนการแฮชของไลบรารี `bcryptjs` เมื่อผ่านการตรวจสอบ เซิร์ฟเวอร์จะสร้าง JWT (JSON Web Token) และฝังลงใน HTTP-only Cookie เพื่อป้องกันการโจมตีแบบ Cross-Site Scripting (XSS)
- **การควบคุมสิทธิ์ (Role-Based Access Control):** ระบบจำแนกผู้ใช้เป็น 2 สิทธิ์หลัก ได้แก่ `student` (นักศึกษา) และ `company` (บริษัท) โดยฟังก์ชัน `getUserRole()` ใน `front/lib/actions/auth.ts` จะตรวจสอบความถูกต้องของโทเค็นในทุกคำขอ เพื่อป้องกันไม่ให้ผู้ใช้เข้าถึงข้อมูลหรือหน้าแดชบอร์ดข้ามบทบาท

### 4.3.2 ระบบคำนวณและจับคู่ตำแหน่งงานด้วยทักษะ (Skill-Based Matching Engine)
- ทำงานผ่านโมดูล `front/lib/utils/match.ts` โดยใช้อัลกอริทึม **Level-Weighted Match Score**
- นำทักษะที่บริษัทระบุในประกาศรับสมัครงาน (`internship_skills`) มาเปรียบเทียบกับทักษะของนักศึกษา (`student_skills`)
- แปลงระดับความชำนาญเป็นคะแนน: Beginner = 1, Intermediate = 2, Advanced = 3
- หากระดับทักษะของนักศึกษาสูงกว่าหรือเท่ากับที่งานต้องการ จะได้รับคะแนนเต็ม 1.0 ของทักษะข้อนั้น แต่หากมีทักษะแต่ระดับต่ำกว่า จะได้คะแนนตามสัดส่วน $Score = \frac{StudentLevel}{RequiredLevel}$
- ผลลัพธ์สุดท้ายจะถูกเฉลี่ยตามจำนวนทักษะที่งานต้องการทั้งหมด และแปลงเป็นคะแนนร้อยละ (0%–100%) เพื่อให้นักศึกษาและบริษัทเห็นระดับความพร้อมได้อย่างชัดเจน

### 4.3.3 ระบบวิเคราะห์ช่องว่างทักษะและแนะนำคอร์สเรียนด้วย AI (AI Skill Gap & Upskilling Engine)
- ทำงานผ่าน `front/lib/actions/geminiRecommendations.ts`
- เมื่อนักศึกษาเลือกดูตำแหน่งงานที่สนใจ ระบบจะค้นหาทักษะที่นักศึกษายังขาด (Missing Skills) หรือทักษะที่มีระดับต่ำกว่าที่ต้องการ (Under-leveled Skills)
- ส่งข้อมูลช่องว่างทักษะและรายละเอียดงานเข้าสู่ **Google Gemini Generative AI (REST API)** โดยระบุโมเดล เช่น `gemini-1.5-flash` / `gemini-2.5-flash` เพื่อสร้างผลการวิเคราะห์เชิงลึก (Gap Analysis Summary)
- AI จะค้นหาและจัดสรรคอร์สเรียนออนไลน์ วิดีโอบทเรียน หรือสื่อการเรียนรู้คุณภาพสูงจากแพลตฟอร์มชั้นนำ เช่น Coursera, Udemy, YouTube, ThaiMOOC และ FutureSkill พร้อมลิงก์ที่สามารถคลิกเข้าไปศึกษาได้ทันที
- มีระบบ **Fallback Mode** (`mockAnalysis.ts`) ที่พร้อมทำงานโดยอัตโนมัติในกรณีที่ API Key หมดโควตาหรือเครือข่ายขัดข้อง เพื่อให้ระบบไม่หยุดชะงัก

### 4.3.4 ระบบจัดการประกาศงานและการติดตามผลการสมัครฝึกงาน (Internship & Application Tracking)
- บริษัทสามารถประกาศตำแหน่งฝึกงาน ระบุคุณสมบัติ สวัสดิการ และทักษะที่ต้องการได้อย่างละเอียดผ่าน `createInternship`
- นักศึกษาสามารถค้นหา กรองตำแหน่งงาน และส่งใบสมัครงานพร้อมแนบข้อมูลโปรไฟล์และเรซูเม่ผ่าน `applyToInternship`
- บริษัทสามารถตรวจสอบรายชื่อผู้สมัครที่เรียงลำดับตามคะแนน Match Score และสามารถอัปเดตสถานะการสมัครเป็น `Accepted` (ผ่านการคัดเลือก) หรือ `Rejected` (ไม่ผ่านการคัดเลือก) ผ่าน `updateApplicationStatus`

### 4.3.5 ระบบจัดเก็บไฟล์และส่งการแจ้งเตือน (Storage & Notification Subsystem)
- **การจัดเก็บไฟล์ (File Storage):** เอกสารเรซูเม่ (PDF) และรูปโปรไฟล์จะถูกส่งผ่าน Server Actions ไปยัง Supabase Storage Bucket ซึ่งจัดเก็บไฟล์แบบแยกส่วนตามความปลอดภัย และสร้าง URL อ้างอิงเพื่อบันทึกลงในฐานข้อมูล PostgreSQL
- **การแจ้งเตือนทางอีเมล (Email Notification):** เมื่อบริษัทเปลี่ยนสถานะใบสมัครเป็น `Accepted` ฟังก์ชัน `sendStudentAcceptedEmail` ใน `front/lib/utils/email.ts` จะสร้างอีเมลแจ้งผลทางการด้วย HTML Template และส่งผ่าน **Nodemailer SMTP** ไปยังอีเมลของนักศึกษาทันที พร้อมรายละเอียดตำแหน่งงานและชื่อบริษัทที่รับเข้าฝึกงาน
