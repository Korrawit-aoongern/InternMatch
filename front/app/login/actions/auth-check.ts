"use server";

import { createClient } from "@supabase/supabase-js";

// สร้าง Instance พิเศษใช้คีย์ลับหลังบ้าน (Service Role Key) เพื่อคุยกับฐานข้อมูลแบบ Full Access
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function checkUserExists(identity: string) {
    if (!identity) return { exists: false };

    const cleanIdentity = identity.trim().toLowerCase();

    // ยิง Query เช็กทั้งช่อง Email และ Username พร้อมกันในคำสั่งเดียว
    const { data, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .or(`email.eq.${cleanIdentity},username.eq.${cleanIdentity}`)
        .maybeSingle();

    if (error) {
        console.error("Database query error:", error.message);
        return { exists: false, error: true };
    }

    // ถ้าเจอข้อมูลส่งกลับเป็นวัตถุ แปลว่ามีผู้ใช้นี้อยู่จริงในระบบ
    return { exists: !!data };
}
