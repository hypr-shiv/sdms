import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to ScholarPulse securely to access your academic dashboard and AI Copilot.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
