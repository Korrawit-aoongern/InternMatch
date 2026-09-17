import nodemailer from "nodemailer";

export interface SendAcceptedEmailParams {
  studentEmail: string;
  studentName: string;
  internshipTitle: string;
  companyName: string;
  location?: string;
  internshipType?: string;
  applicationId: string;
}

export async function sendStudentAcceptedEmail(params: SendAcceptedEmailParams) {
  const {
    studentEmail,
    studentName,
    internshipTitle,
    companyName,
    location,
    internshipType,
    applicationId,
  } = params;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("EMAIL_USER or EMAIL_PASS not configured. Skipped sending email to:", studentEmail);
    return { success: false, reason: "Email credentials not configured" };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const subject = `🎉 ยินดีด้วย! คุณผ่านการคัดเลือกเข้าฝึกงานกับ ${companyName} (${internshipTitle})`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const html = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px 20px; background-color: #f8fafc;">
      <div style="background-color: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <!-- Logo / Brand Header -->
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #2563eb; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">InternMatch</h1>
          <p style="color: #64748b; font-size: 12px; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">AI Internship Matching Platform</p>
        </div>

        <!-- Celebration Banner -->
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 32px;">🎉</span>
          <h2 style="color: #065f46; font-size: 20px; font-weight: 700; margin: 8px 0 4px 0;">ขอแสดงความยินดีด้วยครับ/ค่ะ!</h2>
          <p style="color: #047857; font-size: 14px; margin: 0; font-weight: 600;">คุณผ่านการคัดเลือกเข้าฝึกงานเรียบร้อยแล้ว</p>
        </div>

        <!-- Greeting & Message -->
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 16px;">
          เรียนคุณ <strong>${studentName}</strong>,
        </p>
        <p style="color: #475569; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          ทางสถานประกอบการ <strong>${companyName}</strong> ได้ตรวจสอบใบสมัครของคุณ และมีความยินดีที่จะแจ้งให้ทราบว่า คุณได้รับการตอบรับเข้าฝึกงานอย่างเป็นทางการ ในตำแหน่งงานดังต่อไปนี้:
        </p>

        <!-- Internship Details Card -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 35%;">ตำแหน่งฝึกงาน:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${internshipTitle}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">บริษัท / สถานประกอบการ:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${companyName}</td>
            </tr>
            ${location ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">สถานที่ปฏิบัติงาน:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${location}</td>
            </tr>
            ` : ""}
            ${internshipType ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">รูปแบบการฝึกงาน:</td>
              <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${internshipType}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 6px 0; color: #64748b; font-weight: 600;">รหัสใบสมัคร:</td>
              <td style="padding: 6px 0; color: #2563eb; font-weight: 700;">#${applicationId.substring(0, 8).toUpperCase()}</td>
            </tr>
          </table>
        </div>

        <!-- Next Steps -->
        <div style="margin-bottom: 24px;">
          <h3 style="color: #0f172a; font-size: 15px; font-weight: 700; margin: 0 0 8px 0;">ขั้นตอนถัดไปที่คุณต้องทำ:</h3>
          <ol style="color: #475569; font-size: 13px; line-height: 1.7; padding-left: 20px; margin: 0;">
            <li>เข้าสู่ระบบ InternMatch ไปที่เมนู <strong>Applications</strong></li>
            <li>ดาวน์โหลด <strong>หนังสือรับรองการตอบรับเข้าฝึกงาน</strong> อย่างเป็นทางการ</li>
            <li>กดปุ่ม <strong>ส่งอีเมลหาบริษัท</strong> เพื่อติดต่อยืนยันกำหนดการเริ่มฝึกงานและสอบถามเอกสารเพิ่มเติม</li>
          </ol>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin-bottom: 28px;">
          <a href="${appUrl}/dashboard/applications" style="background-color: #2563eb; color: #ffffff; display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
            เข้าสู่ระบบเพื่อดูรายละเอียดใบสมัคร
          </a>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
            อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติจากระบบ InternMatch หากมีข้อสงสัยกรุณาติดต่อผ่านทางหน้า Help Center ในระบบ
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"InternMatch" <${process.env.EMAIL_USER}>`,
      to: studentEmail,
      subject,
      text: `ยินดีด้วยคุณ ${studentName}! คุณผ่านการคัดเลือกเข้าฝึกงานกับ ${companyName} ในตำแหน่ง ${internshipTitle} แล้ว กรุณาเข้าสู่ระบบ InternMatch ที่ ${appUrl}/dashboard/applications เพื่อดูรายละเอียดและดาวน์โหลดหลักฐาน`,
      html,
    });
    console.log(`Acceptance email successfully sent to ${studentEmail}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error("Failed to send acceptance email via nodemailer:", err?.message || err);
    return { success: false, error: err?.message || "Send email failed" };
  }
}
