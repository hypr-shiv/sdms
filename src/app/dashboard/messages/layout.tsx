import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
  description: "Access and manage Messages on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
