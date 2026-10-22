import { TeacherList } from "@/features/teachers/components/teacher-list";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Data Guru & Staf",
  description: `Direktori tenaga pendidik dan wali kelas ${INSTITUTION.name}`,
};

export default function TeachersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Data Guru & Tenaga Kependidikan
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Daftar pengajar, wali kelas, petugas piket, dan staf tata usaha SMA Pemberdayaan Bangsa Ngrayun.
        </p>
      </div>

      <TeacherList />
    </div>
  );
}
