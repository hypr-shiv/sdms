import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance",
  description: "Access and manage Attendance on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
