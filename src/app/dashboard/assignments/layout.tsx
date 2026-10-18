import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assignments",
  description: "Access and manage Assignments on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
