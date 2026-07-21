"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [status, setStatus] = useState(""); // "success" หรือ "error"
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
                // 🎯 สั่งเปลี่ยนหน้าไปที่ /login ทันทีที่เปลี่ยนรหัสผ่านสำเร็จ ไม่ต้องรอ 3 วินาทีแล้ว
                router.push("/auth/login");
            }
        } catch {
            setMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
            setStatus("error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="">
            <h2 className="text-xl font-bold text-center">ตั้งรหัสผ่านใหม่</h2>
            {message && (
                <p className={`text-sm p-2 rounded text-center ${status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {message}
                </p>
            )}
            <input
                type="password"
                placeholder="รหัสผ่านใหม่"
                className="w-full rounded border p-2 text-sm focus:outline-none"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <input
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                className="w-full rounded border p-2 text-sm focus:outline-none"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button type="submit" disabled={isLoading || !token} className="w-full rounded bg-green-600 p-2 text-white text-sm font-semibold disabled:opacity-50">
                {isLoading ? "กำลังบันทึก..." : "ยืนยันรหัสผ่านใหม่"}
            </button>
        </form>
    );
}

export default function ResetPassword() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Suspense fallback={<div>กำลังโหลด...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
