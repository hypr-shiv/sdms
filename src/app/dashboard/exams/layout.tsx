import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exams",
  description: "Access and manage Exams on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
