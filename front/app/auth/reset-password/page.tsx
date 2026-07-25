"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import FormInput from "@/components/ui/FormInput";

function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"success" | "error" | "">("");
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token"); // ดึงตัว Token มาจาก URL

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage("รหัสผ่านไม่ตรงกัน");
            setStatus("error");
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });
            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "เกิดข้อผิดพลาด");
                setStatus("error");
            } else {
                setStatus("success");
                setMessage("เปลี่ยนรหัสผ่านใหม่เสร็จสมบูรณ์! กำลังนำทางไปหน้าเข้าสู่ระบบ...");
                setTimeout(() => {
                    router.push("/auth/login");
                }, 2000);
            }
        } catch {
            setMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
            setStatus("error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[448px] bg-surface rounded-xl p-lg md:p-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1)] border border-outline-variant/30 text-on-surface">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-on-surface tracking-tight">ตั้งรหัสผ่านใหม่</h2>
                <p className="mt-2 text-sm text-on-surface-variant">กรุณากรอกรหัสผ่านใหม่และยืนยันเพื่อเสร็จสิ้นขั้นตอน</p>
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
                    id="password"
                    label="รหัสผ่านใหม่"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={Lock}
                />

                <FormInput
                    id="confirmPassword"
                    label="ยืนยันรหัสผ่านใหม่"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={Lock}
                />

                <button 
                    type="submit" 
                    disabled={isLoading || !token} 
                    className="w-full rounded-xl bg-primary-container py-3 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 transition-all cursor-pointer"
                >
                    {isLoading ? "กำลังบันทึก..." : "ยืนยันรหัสผ่านใหม่"}
                </button>
            </form>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 text-on-background">
            <Suspense fallback={<div className="text-on-surface-variant text-sm font-medium">กำลังโหลด...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}

