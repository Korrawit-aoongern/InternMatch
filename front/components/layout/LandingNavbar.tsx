import React from "react";
import Link from "next/link";

export default function LandingNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md dark:bg-surface/70 border-b border-white/20 shadow-sm transition-transform duration-200">
      <div className="flex items-center justify-between px-lg py-md max-w-container-max mx-auto">
        <div className="font-h2 text-h2 font-bold text-primary">InternMatch</div>
        <div className="hidden md:flex items-center gap-lg font-body-lg text-body-lg">
          <a className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80" href="#features">Features</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80" href="#how-it-works">How It Works</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80" href="#testimonials">Testimonials</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors hover:opacity-80" href="#faq">FAQ</a>
        </div>
        <div className="flex items-center gap-md">
          <Link href="/auth/login" className="font-body-sm text-body-sm text-primary hover:opacity-80 transition-all px-4 py-2 rounded-lg font-medium border border-transparent flex items-center justify-center">Login</Link>
          <Link href="/auth/register" className="font-body-sm text-body-sm bg-primary-container text-white px-4 py-2 rounded-lg font-medium hover:bg-primary transition-colors active:scale-95 shadow-md flex items-center justify-center">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}
