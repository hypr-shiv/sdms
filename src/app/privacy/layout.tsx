import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read the privacy policy of ScholarPulse to understand how your academic and personal data is securely handled and processed.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
