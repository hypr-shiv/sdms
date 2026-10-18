import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | ScholarPulse",
    default: "ScholarPulse — AI-Powered Academic Intelligence Platform",
  },
  description:
    "ScholarPulse unifies institutional administration, course delivery, and student support with AI-driven insights, predictive analytics, and smart scheduling.",
  keywords: ["ScholarPulse", "student dashboard", "education", "AI", "analytics", "academic platform"],
};

import Providers from "@/components/Providers";
import CookieBanner from "@/components/CookieBanner";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
        <CookieBanner />
      </body>
    </html>
  );
}
