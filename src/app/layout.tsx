import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { AnimatedBackground } from "@/components/animated-background";

const interSans = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuickCash — Earn Real KES Completing Tasks & Surveys",
  description: "Complete tasks and surveys. Earn real KES instantly. Withdraw to M-Pesa. Trusted by 12,000+ Kenyans.",
  keywords: ["quickcash", "earn money", "tasks", "surveys", "M-Pesa", "Kenya", "KES"],
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${interSans.variable} ${jakarta.variable} antialiased relative`}>
        <AuthProvider>
          <AnimatedBackground />
          <div className="relative z-10 min-h-screen flex flex-col">
            {children}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
