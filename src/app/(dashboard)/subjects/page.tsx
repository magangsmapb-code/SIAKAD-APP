import { SubjectList } from "@/features/subjects/components/subject-list";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Mata Pelajaran",
  description: `Mata pelajaran kurikulum ${INSTITUTION.name}`,
};

export default function SubjectsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Mata Pelajaran
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Daftar mata pelajaran wajib, peminatan MIPA/IPS, muatan lokal, dan alokasi jam pembelajaran mingguan.
        </p>
      </div>

      <SubjectList />
    </div>
  );
}
