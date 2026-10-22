import { AttendanceHub } from "@/features/attendance/components/attendance-hub";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Presensi & Absensi Siswa",
  description: `Sistem Informasi Absensi Kehadiran Siswa ${INSTITUTION.name}`,
};

export default function AttendancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Presensi & Absensi Siswa
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Pusat manajemen presensi kelas, pengisian absensi guru, monitoring gerbang RFID, dan analisis rekapitulasi kehadiran {INSTITUTION.name}.
        </p>
      </div>

      <AttendanceHub />
    </div>
  );
}
