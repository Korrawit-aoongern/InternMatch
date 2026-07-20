import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface DecodedToken {
    userId: string;
    purpose: string;
}

export async function POST(request: NextRequest) {
    try {
        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            return NextResponse.json({ message: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
        }

        // 1. ตรวจสอบความถูกต้องและอายุของ Token จากลิงก์
        let decoded: DecodedToken;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY") as DecodedToken;
        } catch (err) {
            return NextResponse.json({ message: "ลิงก์หมดอายุ หรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่อีกครั้ง" }, { status: 401 });
        }

        // มั่นใจว่าเป็น Token รีเซ็ตรหัสผ่านจริง ๆ
        if (decoded.purpose !== "password_reset") {
            return NextResponse.json({ message: "Token ไม่ถูกต้อง" }, { status: 401 });
        }

        // 2. ✨ ทำการแปลงรหัสผ่านใหม่ให้เป็น Bcrypt Hash ก่อนบันทึก
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // 3. อัปเดตทับลงในฐานข้อมูล Supabase ตาราง users ตรง ๆ
        const { error } = await supabaseAdmin
            .from("users")
            .update({ password: newPasswordHash }) // ปรับชื่อคอลัมน์ให้ตรงกับตารางจริงของคุณนะครับ
            .eq("id", decoded.userId);

        if (error) {
            console.error("Supabase Update Error:", error);
            return NextResponse.json({ message: "ไม่สามารถอัปเดตรหัสผ่านได้" }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: "เปลี่ยนรหัสผ่านใหม่เสร็จสมบูรณ์!" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
    }
}
