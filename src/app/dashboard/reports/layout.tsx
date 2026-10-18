import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
  description: "Access and manage Reports on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
