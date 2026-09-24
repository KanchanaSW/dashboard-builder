import DashboardApp from "@/components/dashboard/DashboardApp";
import { DashboardProvider } from "@/lib/dashboardStore";

export const metadata = {
  title: "PulseAnalytics — Executive Dashboard Builder",
  description: "High-performance executive KPI and analytics dashboard builder",
};

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardApp />
    </DashboardProvider>
  );
}
