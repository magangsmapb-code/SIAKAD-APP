import { ReportGenerator } from "@/features/reports/components/report-generator";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Rekap & Laporan Presensi",
  description: `Laporan rekapitulasi kehadiran siswa ${INSTITUTION.name}`,
};

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Rekapitulasi & Laporan Presensi
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Unduh dan cetak rekapitulasi presensi harian, bulanan, atau semester untuk arsip sekolah dan dinas pendidikan.
        </p>
      </div>

      <ReportGenerator />
    </div>
  );
}
