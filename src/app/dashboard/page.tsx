import { Metadata } from "next";
import DashboardClient from "./DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "View your personalized ScholarPulse dashboard, track academic progress, view schedules, and access AI-driven insights.",
};

export default function Page() {
  return <DashboardClient />;
}
