import { PermissionTable } from "@/features/permissions/components/permission-table";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Perizinan & Surat Sakit",
  description: `Pengelolaan dispensasi dan perizinan siswa ${INSTITUTION.name}`,
};

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Verifikasi Perizinan & Surat Sakit
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Persetujuan digital permohonan izin, surat dokter, dan dispensasi siswa SMA Pemberdayaan Bangsa Ngrayun.
        </p>
      </div>

      <PermissionTable />
    </div>
  );
}
