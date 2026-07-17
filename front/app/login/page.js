"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [passwordType, setPasswordType] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleTogglePassword = () => {
    setPasswordType(passwordType === "password" ? "text" : "password");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitting:", { email, password });
  };

  return (
    <div className="flex h-full min-h-screen flex-col lg:flex-row bg-background text-on-background">
      
      {/* Branding Section (Left) - Hidden on Mobile */}
      <div className="relative hidden w-full lg:w-1/2 lg:flex lg:flex-col lg:justify-between bg-gradient-to-br from-primary to-primary-container p-3xl overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        <div className="relative z-10">
          <Link className="inline-flex items-center gap-sm" href="/">
            <span className="material-symbols-outlined text-white text-[32px]">work</span>
            <span className="text-white font-bold text-3xl">InternMatch</span>
          </Link>
        </div>
        
        {/* แก้จาก max-w-md เป็น max-w-[448px] เพื่อเลี่ยง bug คอนฟิกชนกัน */}
        <div className="relative z-10 w-full max-w-[448px]">
          <div className="backdrop-blur-md bg-white/10 rounded-xl p-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
            <h2 className="text-white mb-md text-2xl font-bold">Launch your career with AI.</h2>
            <p className="text-white/90 text-base">
              Join thousands of students connecting with top companies. Our intelligent matching system finds the perfect internship tailored to your skills and aspirations.
            </p>
          </div>
        </div>
        
        {/* Abstract background shape */}
        <div className="absolute -bottom-[20%] -right-[10%] w-[80%] h-[80%] rounded-full bg-white/5 blur-3xl pointer-events-none"></div>
      </div>

      {/* Login Form Section (Right) */}
      <div className="flex flex-1 flex-col justify-center px-lg py-xl lg:px-3xl">
        {/* แก้ตรงนี้เป็น max-w-[448px] เพื่อให้กล่องฟอร์มกางออกปกติ */}
        <div className="mx-auto w-full max-w-[448px]">
          
          {/* Mobile Logo (hidden on desktop) */}
          <div className="mb-2xl flex justify-center lg:hidden">
            <Link className="inline-flex items-center gap-sm" href="/">
              <span className="material-symbols-outlined text-primary text-[24px]">work</span>
              <span className="text-primary font-bold text-2xl">InternMatch</span>
            </Link>
          </div>

          <div className="text-center mb-xl">
            <h1 className="text-on-surface mb-sm text-3xl font-bold">Welcome back</h1>
            <p className="text-on-surface-variant text-base">Please enter your details to sign in.</p>
          </div>

          <div className="bg-surface rounded-xl p-lg md:p-xl shadow-[0_4px_6px_-1px_rgb(0_0_0/0.1),0_2px_4px_-2px_rgb(0_0_0/0.1)] border border-outline-variant/30">
            <form onSubmit={handleSubmit} className="space-y-lg">
              
              {/* Email Input */}
              <div>
                <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="email">
                  Email or Username
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm">
                    <span className="material-symbols-outlined text-outline">mail</span>
                  </div>
                  <input
                    className="block w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-[40px] pr-3 text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-shadow text-sm"
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm">
                    <span className="material-symbols-outlined text-outline">lock</span>
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
                    aria-label="Toggle password visibility"
                    className="absolute inset-y-0 right-0 flex items-center pr-sm text-outline hover:text-on-surface-variant focus:outline-none"
                    type="button"
                    onClick={handleTogglePassword}
                  >
                    <span className="material-symbols-outlined">
                      {passwordType === "password" ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                  />
                  <label className="ml-sm block text-on-surface-variant select-none cursor-pointer text-sm" htmlFor="remember-me">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a className="font-semibold text-primary hover:text-surface-tint transition-colors text-sm" href="#">
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Login Button */}
              <div>
                <button
                  className="flex w-full justify-center rounded-lg bg-primary-container py-3 text-on-primary shadow-sm hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm font-semibold"
                  type="submit"
                >
                  Login
                </button>
              </div>
            </form>

            {/* Register Link */}
            <div className="mt-lg text-center">
              <p className="text-on-surface-variant text-sm">
                Don't have an account?{" "}
                <Link className="font-semibold text-primary hover:text-surface-tint transition-colors" href="/register">
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