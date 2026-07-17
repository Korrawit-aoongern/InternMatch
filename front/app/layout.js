import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "InternMatch - AI Career Portal",
  description: "AI Career Portal สำหรับนักศึกษาและบริษัทชั้นนำ",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-on-background font-body-lg">{children}</body>
    </html>
  );
}
