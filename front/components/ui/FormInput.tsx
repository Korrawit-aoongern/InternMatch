"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  error?: string;
  isChecking?: boolean;
}

export default function FormInput({
  label,
  icon: Icon,
  error,
  isChecking,
  type = "text",
  className = "",
  ...props
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full">
      <label className="block text-on-surface mb-sm text-sm font-semibold" htmlFor={props.id || props.name}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-sm">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <input
          type={inputType}
          className={`block w-full rounded-lg border bg-white py-2.5 text-on-surface focus:ring-2 focus:ring-primary/20 focus:outline-none transition-shadow text-sm ${
            Icon ? "pl-[40px]" : "px-3"
          } ${isPassword ? "pr-[40px]" : "pr-3"} ${
            error ? "border-error focus:border-error" : "border-outline-variant focus:border-primary"
          } ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-sm text-outline hover:text-on-surface-variant focus:outline-none"
          >
            {showPassword ? (
              <Eye className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
            ) : (
              <EyeOff className="w-5 h-5 text-slate-400 hover:text-slate-600 transition-colors" />
            )}
          </button>
        )}
      </div>
      {isChecking && <p className="text-xs text-on-surface-variant mt-1">Checking...</p>}
      {error && <p className="text-error text-xs mt-1 font-medium">{error}</p>}
    </div>
  );
}
