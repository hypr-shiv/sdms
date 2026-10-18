import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Audit",
  description: "Access and manage Audit on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
