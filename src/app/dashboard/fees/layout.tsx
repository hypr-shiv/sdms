import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fees",
  description: "Access and manage Fees on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
