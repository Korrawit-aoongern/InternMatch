"use client";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 1. นำเข้าระบบจัดการเส้นทางของ Next.js
import { checkUserExists } from "@/app/login/actions/auth-check";

export default function LoginPage() {
  const router = useRouter(); // 2. ประกาศเรียกใช้งาน router
  const [passwordType, setPasswordType] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [identityError, setIdentityError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [loginError, setLoginError] = useState(""); // เพิ่ม State สำหรับจับข้อผิดพลาดตอนล็อกอิน (เช่น รหัสผ่านผิด)

  const handleTogglePassword = () => {
    setPasswordType(passwordType === "password" ? "text" : "password");
  };

  const handleIdentityCheck = async () => {
    if (!email) {
      setIdentityError("");
      return;
    }
    setIsChecking(true);
    setIdentityError("");

    const result = await checkUserExists(email);

    if (result.error) {
      setIdentityError("Cannot verify account status at this moment.");
    } else if (!result.exists) {
      setIdentityError("This email or username does not exist in our system.");
    } else {
      setIdentityError("");
    }
    setIsChecking(false);
  };

  // 3. ปรับปรุงฟังก์ชันส่งฟอร์มเพื่อเข้าสู่ระบบ
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (identityError || isChecking) return;

    setLoginError(""); // ล้างข้อความแจ้งเตือนเดิมก่อนเริ่มทำงาน

    try {
      // ยิง Request ไปยัง Endpoint ตรวจสอบสิทธิ์ของสถาปัตยกรรม Bcrypt + JWT ที่คุณออกแบบไว้
      // (ตัวอย่างนี้อิงตามการทำ API Route ทั่วไป ถ้าคุณใช้ Server Action สามารถเปลี่ยนไปเรียกใช้งานตรงๆ ได้เลยครับ)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: email, password: password }),
      });

      const result = await response.json();

      if (!response.ok) {
        // ถ้ารหัสผ่านไม่ถูกต้อง หรือมีอะไรผิดพลาดฝั่งเซิร์ฟเวอร์
        setLoginError(result.message || "Invalid password or login failed.");
        return;
      }

      // ตรวจสอบเรียบร้อย รหัสผ่านถูก ตั๋ว JWT ถูกสร้างและเก็บลง Cookie/LocalStorage เสร็จสิ้น
      // พาผู้ใช้ย้ายหน้าไปยัง app/page.js ทันที
      router.push("/dashboard");
    } catch (error) {
      console.error("Login client error:", error);
      setLoginError("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="flex h-full min-h-screen flex-col lg:flex-row bg-background text-on-background">
      {/* Branding Section (Left) */}
      <div className="relative hidden w-full lg:w-1/2 lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-primary to-primary-container p-3xl overflow-hidden">
        {/* ... (คงส่วนนี้ไว้) ... */}
      </div>

      {/* Login Form Section (Right) */}
      <div className="flex flex-1 flex-col justify-center px-lg py-xl lg:px-3xl">
        <div className="mx-auto w-full max-w-[448px]">
          <div className="text-center mb-xl">
            <h1 className="text-on-surface mb-sm text-3xl font-bold">
              Welcome back
            </h1>
            <p className="text-on-surface-variant text-base">
              Please enter your details to sign in.
            </p>
          </div>

          <div className="bg-surface rounded-xl p-lg md:p-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1)] border border-outline-variant/30">
            <form onSubmit={handleSubmit} className="space-y-lg">
              {/* แสดงกล่องแจ้งเตือนความผิดพลาดระดับฟอร์ม (เช่น ถ้ารหัสผ่านผิดจะโชว์ตรงนี้) */}
              {loginError && (
                <div className="p-sm bg-error/10 border border-error/20 text-error rounded-lg text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </div>
              )}

              {/* Email or Username Input */}
              <div>
                <label
                  className="block text-on-surface mb-sm text-sm font-semibold"
                  htmlFor="email"
                >
                  Email or Username
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm">
                    <Mail />
                  </div>
                  <input
                    className={`block w-full rounded-lg border bg-white py-2.5 pl-[40px] pr-3 text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none transition-shadow text-sm ${
                      identityError
                        ? "border-error focus:border-error"
                        : "border-outline-variant focus:border-primary"
                    }`}
                    id="email"
                    name="email"
                    placeholder="you@example.com or username"
                    required
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleIdentityCheck}
                  />
                </div>
                {isChecking && (
                  <p className="text-xs text-on-surface-variant mt-1">
                    Checking account...
                  </p>
                )}
                {identityError && (
                  <p className="text-error text-xs mt-1 font-medium">
                    {identityError}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label
                  className="block text-on-surface mb-sm text-sm font-semibold"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm">
                    <Lock />
                  </div>
                  <input
                    className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-[40px] pr-[40px] text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-shadow text-sm"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type={passwordType}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-sm text-outline"
                    type="button"
                    onClick={handleTogglePassword}
                  >
                    {passwordType === "password" ? (
                      <EyeOff className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 rounded border-outline-variant text-primary"
                    id="remember-me"
                    type="checkbox"
                  />
                  <label
                    className="ml-sm block text-on-surface-variant text-sm select-none cursor-pointer"
                    htmlFor="remember-me"
                  >
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a className="font-semibold text-primary text-sm" href="#">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  className="flex w-full justify-center rounded-lg bg-primary-container py-3 text-on-primary font-semibold text-sm shadow-sm hover:bg-primary transition-colors disabled:opacity-50"
                  type="submit"
                  disabled={!!identityError || isChecking}
                >
                  Login
                </button>
              </div>
            </form>
            {/* Register Link */}
            <div className="mt-lg text-center">
              <p className="text-on-surface-variant text-sm">
                {"Don't have an account?"}{" "}
                <Link
                  className="font-semibold text-primary hover:text-surface-tint transition-colors"
                  href="/register_sc"
                >
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
