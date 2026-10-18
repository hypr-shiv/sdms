import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Evaluations",
  description: "Access and manage Evaluations on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
