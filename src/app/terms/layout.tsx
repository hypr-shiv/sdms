import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | ScholarPulse",
  description: "Review the Terms and Conditions of ScholarPulse governing platform access, academic integrity, user accounts, and AI learning tools.",
  openGraph: {
    title: "Terms and Conditions | ScholarPulse",
    description: "Review the Terms and Conditions of ScholarPulse governing platform access, academic integrity, user accounts, and AI learning tools.",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
