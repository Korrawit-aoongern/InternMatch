import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { identity, password } = await request.json();
        const cleanIdentity = identity.trim().toLowerCase();

        // 🎯 เพิ่ม console.log ตัวนี้เพื่อดูว่าหน้าบ้านส่งอะไรมา และหลังบ้านกำลังหาคำว่าอะไร
        console.log("กำลังค้นหาผู้ใช้ด้วยคำว่า:", cleanIdentity);

        const supabaseAdmin = getSupabaseAdmin();
        const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("id, email, username, password")
            .or(`email.eq.${cleanIdentity},username.eq.${cleanIdentity}`)
            .maybeSingle();

        // 🎯 ดูผลลัพธ์จาก Supabase ใน Terminal
        console.log("ผลลัพธ์จาก Supabase -> Error:", error, "Data:", user);

        if (error || !user) {
            // ปรับ Message ให้บอกชัดขึ้นเล็กน้อยตอนทำระบบ
            return NextResponse.json({ message: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" }, { status: 401 });
        }

        // 2. เช็กสิทธิ์รหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
        }

        // 3. ออกตั๋ว JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, username: user.username },
            process.env.JWT_SECRET_KEY || "YOUR_SUPER_SECRET_KEY",
            { expiresIn: "7d" }
        );

        const response = NextResponse.json({ success: true }, { status: 200 });

        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Login API Error:", error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
    }
}
