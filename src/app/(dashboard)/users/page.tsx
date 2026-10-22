import { UserManagement } from "@/features/users/components/user-management";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Manajemen Pengguna",
  description: `Kelola data akun pengguna sistem presensi ${INSTITUTION.name}`,
};

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          Manajemen Akun Pengguna
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Daftar pengguna terdaftar, pengaturan hak akses peran (Admin, Guru, Kepala Sekolah, Siswa), dan status aktivasi.
        </p>
      </div>

      <UserManagement />
    </div>
  );
}
