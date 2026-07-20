import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();
        const cleanEmail = email.trim().toLowerCase();

        // 1. เช็กว่ามีผู้ใช้อีเมลนี้ในตาราง users ไหม
        const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("id, email")
            .eq("email", cleanEmail)
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
        const resetLink = `${origin}/reset-password?token=${resetToken}`;

        // 🎯 พิมพ์ออกมาดูใน Terminal ระหว่างพัฒนา
        console.log(`\n📧 [EMAIL SENT TO: ${user.email}] \nคลิกลิงก์นี้เพื่อเปลี่ยนรหัสผ่าน: \n${resetLink}\n`);

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