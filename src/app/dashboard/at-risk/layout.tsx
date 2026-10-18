import { Metadata } from "next";

export const metadata: Metadata = {
  title: "At Risk",
  description: "Access and manage At Risk on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
