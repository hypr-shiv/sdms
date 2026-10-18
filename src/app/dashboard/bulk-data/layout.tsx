import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bulk Data",
  description: "Access and manage Bulk Data on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
