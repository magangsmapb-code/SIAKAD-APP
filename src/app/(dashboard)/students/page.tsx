import { StudentTable } from "@/features/students/components/student-table";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Data Siswa",
  description: `Direktori siswa aktif ${INSTITUTION.name}`,
};

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Direktori Data Siswa
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Kelola data kesiswaan, NIS, NISN, rombel, nomor darurat orang tua, dan penugasan kartu RFID presensi.
        </p>
      </div>

      <StudentTable />
    </div>
  );
}
