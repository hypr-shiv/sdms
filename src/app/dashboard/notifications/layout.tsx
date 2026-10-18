import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Access and manage Notifications on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
