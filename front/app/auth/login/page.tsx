"use client";

import { Mail, Lock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FormInput from "@/components/ui/FormInput";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [identityError, setIdentityError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleIdentityCheck = async () => {
    setIdentityError("");
    setIsChecking(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (identityError || isChecking) return;

    setLoginError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: email, password: password, rememberMe }),
      });

      const result = await response.json();

      if (!response.ok) {
        setLoginError(result.message || "Invalid password or login failed.");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("remembered_email", email);
      } else {
        localStorage.removeItem("remembered_email");
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Login client error:", error);
      setLoginError("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="relative flex h-full min-h-screen flex-col lg:flex-row bg-background text-on-background">
      {/* Logo for mobile/tablet */}
      <div className="absolute top-6 left-6 z-50 lg:hidden">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
            IM
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-blue-600 leading-tight">InternMatch</span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Career Portal</span>
          </div>
        </Link>
      </div>

      {/* Branding Section (Left) */}
      <div className="relative hidden w-full lg:w-1/2 lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-primary to-primary-container p-3xl overflow-hidden">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity self-start z-50">
          <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm">
            IM
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white leading-tight">InternMatch</span>
            <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider">AI Career Portal</span>
          </div>
        </Link>
        <div></div> {/* Spacer */}
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
              {loginError && (
                <div className="p-sm bg-error/10 border border-error/20 text-error rounded-lg text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </div>
              )}

              <FormInput
                label="Email"
                id="email"
                name="email"
                type="text"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleIdentityCheck}
                icon={Mail}
                error={identityError}
                isChecking={isChecking}
              />

              <FormInput
                label="Password"
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
              />

              {/* Remember Me & Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 rounded border-outline-variant text-primary cursor-pointer"
                    id="remember_me"
                    name="remember_me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label
                    className="ml-sm block text-on-surface-variant text-sm select-none cursor-pointer"
                    htmlFor="remember_me"
                  >
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a className="font-semibold text-primary text-sm" href="forgot-password">
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
                  href="/auth/register"
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