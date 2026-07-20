import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const { identity, password } = await request.json();
        
        if (!identity || !password) {
            return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
        }

        const cleanIdentity = identity.trim().toLowerCase();
        const supabaseAdmin = getSupabaseAdmin();

        // 1. ค้นหาผู้ใช้จากตาราง users
        const { data: user, error: userError } = await supabaseAdmin
            .from("users")
            .select("id, email, username, password, role")
            .or(`email.eq.${cleanIdentity},username.eq.${cleanIdentity}`)
            .maybeSingle();

        if (userError || !user) {
            return NextResponse.json({ message: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" }, { status: 401 });
        }

        // 2. เช็กสิทธิ์รหัสผ่าน
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
        }

        // 3. ดึงข้อมูล fullname หรือชื่อบริษัทตาม Role ของผู้ใช้งานเพื่อใส่ใน JWT Payload
        let fullname = "";
        if (user.role === "student") {
            const { data: student } = await supabaseAdmin
                .from("students")
                .select("fullname")
                .eq("user_id", user.id)
                .maybeSingle();
            if (student) {
                fullname = student.fullname;
            }
        } else if (user.role === "company") {
            const { data: company } = await supabaseAdmin
                .from("companies")
                .select("company_name")
                .eq("user_id", user.id)
                .maybeSingle();
            if (company) {
                fullname = company.company_name;
            }
        }

        // 4. รับคีย์ลับสำหรับ JWT (ไม่อนุญาตให้ใช้ค่าเริ่มต้นที่ฮาร์ดโค้ดเพื่อความปลอดภัย)
        const jwtSecret = process.env.JWT_SECRET || process.env.JWT_SECRET_KEY;
        if (!jwtSecret) {
            console.error("❌ JWT Secret Key is missing in environment variables!");
            return NextResponse.json({ message: "เกิดข้อผิดพลาดในการกำหนดค่าระบบความปลอดภัยหลังบ้าน" }, { status: 500 });
        }

        // 5. ออกตั๋ว JWT พร้อมข้อมูลผู้ใช้งานครบถ้วน
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                username: user.username,
                role: user.role,
                fullname: fullname
            },
            jwtSecret,
            { expiresIn: "7d" }
        );

        const response = NextResponse.json({ success: true, role: user.role }, { status: 200 });

        // 6. บันทึก Cookie ลงในเว็บบราวเซอร์
        response.cookies.set("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
        });

        return response;

    } catch (error: any) {
        console.error("Login API Error:", error);
        return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
    }
}
