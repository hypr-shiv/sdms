import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thank You",
  description: "Thank you for requesting a demo with ScholarPulse. Our team will be in touch shortly.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
