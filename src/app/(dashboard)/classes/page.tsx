import { ClassGrid } from "@/features/classes/components/class-grid";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Rombel & Kelas",
  description: `Daftar kelas dan rombongan belajar ${INSTITUTION.name}`,
};

export default function ClassesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Rombongan Belajar (Kelas)
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Struktur kelas, alokasi ruang belajar, dan penugasan wali kelas semester aktif.
        </p>
      </div>

      <ClassGrid />
    </div>
  );
}
