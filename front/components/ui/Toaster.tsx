"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToasterContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToasterContext = createContext<ToasterContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToasterContext);
  if (!ctx) throw new Error("useToast must be used within ToasterProvider");
  return ctx;
}

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 3800);
    },
    [remove]
  );

  const value: ToasterContextValue = {
    toast,
    success: (m) => toast(m, "success"),
    error: (m) => toast(m, "error"),
    warning: (m) => toast(m, "warning"),
    info: (m) => toast(m, "info"),
  };

  return (
    <ToasterContext.Provider value={value}>
      {children}
      {/* Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[90vw] sm:max-w-[380px]">
        {toasts.map((t) => {
          const styles: Record<ToastType, string> = {
            success: "bg-white border-emerald-200 text-emerald-800",
            error: "bg-white border-rose-200 text-rose-700",
            warning: "bg-white border-amber-200 text-amber-800",
            info: "bg-white border-blue-200 text-slate-800",
          };
          const Icon =
            t.type === "success"
              ? CheckCircle2
              : t.type === "error"
              ? XCircle
              : t.type === "warning"
              ? AlertTriangle
              : Info;
          const iconColor =
            t.type === "success"
              ? "text-emerald-500"
              : t.type === "error"
              ? "text-rose-500"
              : t.type === "warning"
              ? "text-amber-500"
              : "text-blue-500";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm animate-in slide-in-from-top-2 ${styles[t.type]}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
              <p className="text-sm font-semibold leading-snug flex-1 whitespace-pre-wrap break-words">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToasterContext.Provider>
  );
}
