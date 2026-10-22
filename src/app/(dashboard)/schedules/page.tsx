import { ScheduleView } from "@/features/schedules/components/schedule-view";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Jadwal Pelajaran",
  description: `Jadwal pelajaran dan jam mengajar ${INSTITUTION.name}`,
};

export default function SchedulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Jadwal Pelajaran & Sesi Jam Mengajar
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Penjadwalan mata pelajaran, ruang kelas, dan integrasi presensi per jam mengajar guru.
        </p>
      </div>

      <ScheduleView />
    </div>
  );
}
