import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resources",
  description: "Access and manage Resources on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
