import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Dashboard Utama",
  description: `Ringkasan statistik presensi kehadiran ${INSTITUTION.name}`,
};

export default function DashboardIndexPage() {
  return <DashboardOverview />;
}
