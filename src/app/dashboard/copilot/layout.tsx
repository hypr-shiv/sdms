import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copilot",
  description: "Access and manage Copilot on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
