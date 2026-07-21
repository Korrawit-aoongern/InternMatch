import React from "react";

export default function LandingFooter() {
  return (
    <footer className="w-full py-2xl bg-surface-container-low dark:bg-surface-dim border-t border-outline-variant">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-lg px-lg max-w-container-max mx-auto">
        <div className="space-y-md">
          <div className="font-h2 text-h2 font-bold text-primary">InternMatch</div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            AI Career Portal สำหรับนักศึกษา and บริษัทชั้นนำ
          </p>
          <div className="font-body-sm text-body-sm text-on-surface-variant mt-xl opacity-100">
            © 2024 InternMatch AI. All rights reserved.
          </div>
        </div>
        <div className="space-y-sm">
          <h4 className="font-body-lg text-body-lg font-bold text-on-background mb-sm">Platform</h4>
          <ul className="space-y-2 font-body-sm text-body-sm">
            <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Features</a></li>
            <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">How It Works</a></li>
            <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Pricing</a></li>
          </ul>
        </div>
        <div className="space-y-sm">
          <h4 className="font-body-lg text-body-lg font-bold text-on-background mb-sm">Legal</h4>
          <ul className="space-y-2 font-body-sm text-body-sm">
            <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Privacy Policy</a></li>
            <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Terms of Service</a></li>
            <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Cookie Policy</a></li>
          </ul>
        </div>
        <div className="space-y-sm">
          <h4 className="font-body-lg text-body-lg font-bold text-on-background mb-sm">Support</h4>
          <ul className="space-y-2 font-body-sm text-body-sm">
            <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Contact Us</a></li>
            <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">Help Center</a></li>
            <li className=""><a className="text-on-surface-variant hover:text-primary transition-all hover:underline" href="#">FAQ</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
