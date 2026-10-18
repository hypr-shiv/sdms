import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Schedule",
  description: "Access and manage Schedule on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
