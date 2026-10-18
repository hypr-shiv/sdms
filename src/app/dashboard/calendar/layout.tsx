import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar",
  description: "Access and manage Calendar on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
