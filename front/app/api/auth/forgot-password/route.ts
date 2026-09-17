import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        // 1. เช็กว่ามีผู้ใช้อีเมลนี้ในตาราง users ไหม
        const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("id, email")
            .eq("email", email)
            .maybeSingle();

        if (error || !user) {
            // 💡 ปรับเป็น token: null เพราะเคสนี้ไม่มีผู้ใช้จริงในระบบ จึงไม่มีการสร้าง Token ครับ
            return NextResponse.json({
                success: true,
                message: "หากมีอีเมลนี้ในระบบ ลิงก์รีเซ็ตถูกส่งไปแล้ว",
                token: null
            });
        }

        // 2. ✨ สร้าง Token ชั่วคราว (หมดอายุใน 15 นาที) ผูกกับ ID ของผู้ใช้คนนี้
        const resetToken = jwt.sign(
            { userId: user.id, purpose: "password_reset" },
            process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY",
            { expiresIn: "15m" }
        );

        // 3. สร้างลิงก์สำหรับเอาไปกดเปลี่ยนรหัสผ่าน
        const origin = request.nextUrl.origin;
        const resetLink = `${origin}/auth/reset-password?token=${resetToken}`;

        // 🎯 พิมพ์ออกมาดูใน Terminal ระหว่างพัฒนา
        console.log(`\n📧 [EMAIL SENT TO: ${user.email}] \nคลิกลิงก์นี้เพื่อเปลี่ยนรหัสผ่าน: \n${resetLink}\n`);

        // 4. ส่งอีเมลจริงด้วย Nodemailer
        try {
            console.log(`Starting nodemailer sendMail to ${user.email} using sender: ${process.env.EMAIL_USER}...`);
            const info = await transporter.sendMail({
                from: `"InternMatch" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: "Reset your InternMatch password",
                text: `Reset your password by clicking this link: ${resetLink}`,
                html: `
                    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f8fafc;">
                        <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <h1 style="color: #2563eb; font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.02em;">InternMatch</h1>
                            </div>
                            <h2 style="color: #0f172a; font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px;">Reset your password</h2>
                            <p style="color: #475569; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;">
                                We received a request to reset the password for your account. Click the button below to reset it. This link is valid for 15 minutes.
                            </p>
                            <div style="text-align: center; margin-bottom: 24px;">
                                <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 600; font-size: 15px; padding: 12px 24px; text-decoration: none; border-radius: 8px; transition: background-color 0.2s;">
                                    Reset Password
                                </a>
                            </div>
                            <p style="color: #475569; font-size: 14px; line-height: 20px; margin-bottom: 8px;">
                                If you did not request a password reset, please ignore this email or contact support if you have questions.
                            </p>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
                            <p style="color: #94a3b8; font-size: 12px; line-height: 16px; margin: 0; text-align: center;">
                                © ${new Date().getFullYear()} InternMatch. All rights reserved.
                            </p>
                        </div>
                    </div>
                `,
            });
            console.log("Nodemailer sendMail success! Message ID:", info.messageId);
        } catch (emailError) {
            console.error("Nodemailer Error details:", emailError);
            return NextResponse.json({ message: "ไม่สามารถส่งอีเมลรีเซ็ตรหัสผ่านได้ในขณะนี้" }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: "ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว",
            token: resetToken
        });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
    }
}