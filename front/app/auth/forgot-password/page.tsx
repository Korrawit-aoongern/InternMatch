"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import FormInput from "@/components/ui/FormInput";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"success" | "error">("success");
    const [isLoading, setIsLoading] = useState(false);

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

            if (res.ok) {
                setStatus("success");
                setMessage(data.message || "ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว");
            } else {
                setStatus("error");
                setMessage(data.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
            }
        } catch {
            setStatus("error");
            setMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 text-on-background">
            <div className="w-full max-w-[448px] bg-surface rounded-xl p-lg md:p-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1)] border border-outline-variant/30">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-on-surface tracking-tight">
                        ลืมรหัสผ่านใช่ไหม?
                    </h2>
                    <p className="mt-2 text-sm text-on-surface-variant">
                        กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {message && (
                        <div className={`rounded-xl p-4 text-center text-sm font-medium border ${
                            status === "success" 
                                ? "bg-primary-container/10 text-primary border-primary/20" 
                                : "bg-error/10 text-error border-error/20"
                        }`}>
                            {message}
                        </div>
                    )}

                    <FormInput
                        id="email"
                        label="อีเมลบัญชีผู้ใช้"
                        type="email"
                        placeholder="name@company.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={Mail}
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-primary-container py-3 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer"
                    >
                        {isLoading ? "กำลังดำเนินการ..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                    </button>

                    <div className="text-center pt-2">
                        <Link
                            href="/auth/login"
                            className="text-sm font-medium text-primary hover:text-surface-tint transition-colors"
                        >
                            ← กลับไปหน้าเข้าสู่ระบบ
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}

