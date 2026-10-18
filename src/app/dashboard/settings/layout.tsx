import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Access and manage Settings on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
