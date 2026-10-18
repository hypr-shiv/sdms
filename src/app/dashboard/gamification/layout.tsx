import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gamification",
  description: "Access and manage Gamification on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
