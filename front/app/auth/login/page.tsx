"use client";

import { Mail, Lock, AlertCircle } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { checkUserExists } from "@/lib/actions/auth";
import FormInput from "@/components/ui/FormInput";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [identityError, setIdentityError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [loginError, setLoginError] = useState("");

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (identityError || isChecking) return;

    setLoginError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: email, password: password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setLoginError(result.message || "Invalid password or login failed.");
        return;
      }

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
              {loginError && (
                <div className="p-sm bg-error/10 border border-error/20 text-error rounded-lg text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {loginError}
                </div>
              )}

              <FormInput
                label="Email or Username"
                id="email"
                name="email"
                type="text"
                placeholder="you@example.com or username"
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
