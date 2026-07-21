"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            // 🎯 1. เพิ่มเงื่อนไขตรวจสอบว่าถ้าส่งสำเร็จและได้ Token มา ให้เด้งเปลี่ยนหน้า
            if (res.ok && data.token) {
                // 🎯 สั่งให้ router เปลี่ยนหน้าทันทีโดยไม่ต้องง้อ setTimeout แล้ว
                router.push(`reset-password?token=${data.token}`);
            } else {
                setMessage(data.message || "ดำเนินการเสร็จสิ้น");
            }
        } catch {
            setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 px-4 py-12">

            {/* 🎯 2. เติมคลาสให้กล่องนี้ เพื่อให้มีพื้นหลังสีขาว กรอบมน และจำกัดความกว้าง */}
            <div className="">

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                        ลืมรหัสผ่านใช่ไหม?
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {message && (
                        <div className="rounded-xl bg-blue-50 p-4 text-center text-sm font-medium text-blue-800 border border-blue-100">
                            {message}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            อีเมลบัญชีผู้ใช้
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="name@company.com"
                            className="w-full rounded-xl border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all bg-white"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {isLoading ? "กำลังดำเนินการ..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                    </button>

                    <div className="text-center pt-2">
                        <Link
                            href="/auth/login"
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                        >
                            ← กลับไปหน้าเข้าสู่ระบบ
                        </Link>
                    </div>
                </form>

            </div>
        </div>
    );
}
