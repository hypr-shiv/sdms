import { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Config",
  description: "Access and manage System Config on ScholarPulse - the AI-powered academic intelligence platform.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
