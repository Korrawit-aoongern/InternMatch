"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle, HelpCircle, X } from "lucide-react";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
}

interface ModalState extends ConfirmOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

interface AppModalContextValue {
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>;
}

const AppModalContext = createContext<AppModalContextValue | null>(null);

export function useAppModal() {
  const ctx = useContext(AppModalContext);
  if (!ctx) throw new Error("useAppModal must be used within AppModalProvider");
  return ctx;
}

export function AppModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ModalState>({ open: false, message: "" });

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    const options: ConfirmOptions = typeof opts === "string" ? { message: opts } : opts;
    return new Promise<boolean>((resolve) => {
      setState({
        open: true,
        title: options.title || "ยืนยันการทำรายการ?",
        message: options.message,
        confirmText: options.confirmText || "ยืนยัน",
        cancelText: options.cancelText || "ยกเลิก",
        variant: options.variant || "default",
        resolve,
      });
    });
  }, []);

  const handleClose = (result: boolean) => {
    state.resolve?.(result);
    setState((prev) => ({ ...prev, open: false, resolve: undefined }));
  };

  const variantStyles = {
    default: "bg-blue-600 hover:bg-blue-700 text-white",
    danger: "bg-rose-600 hover:bg-rose-700 text-white",
    warning: "bg-amber-500 hover:bg-amber-600 text-white",
  };

  const Icon = state.variant === "danger" ? AlertTriangle : HelpCircle;
  const iconBg =
    state.variant === "danger"
      ? "bg-rose-100 text-rose-600"
      : state.variant === "warning"
      ? "bg-amber-100 text-amber-600"
      : "bg-blue-100 text-blue-600";

  return (
    <AppModalContext.Provider value={{ confirm }}>
      {children}
      {state.open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-100 p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-800">{state.title}</h3>
                <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">{state.message}</p>
              </div>
              <button
                onClick={() => handleClose(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => handleClose(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {state.cancelText}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`px-5 py-2 text-sm font-bold rounded-xl transition-colors shadow-sm cursor-pointer ${variantStyles[state.variant || "default"]}`}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppModalContext.Provider>
  );
}
