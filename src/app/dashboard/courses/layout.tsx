import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description: "Access and manage Courses on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
