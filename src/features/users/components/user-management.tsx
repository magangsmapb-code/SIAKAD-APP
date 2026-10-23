"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Users,
  UserPlus,
  Shield,
  Key,
  CheckCircle2,
  XCircle,
  Mail,
  Search,
  Filter,
  UserCheck,
  Edit,
  UserX,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { UserProfile, UserRole } from "@/types";
import { userAccountSchema, UserAccountInput } from "@/lib/validators";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export interface SystemUser extends UserProfile {
  status: "AKTIF" | "NONAKTIF";
  roleLabel: string;
}

export function UserManagement() {
  const [users, setUsers] = React.useState<SystemUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("ALL");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 6;

  // Add & Edit Modal State
  const [modalOpen, setModalOpen] = React.useState(false);
  const [userToEdit, setUserToEdit] = React.useState<SystemUser | null>(null);

  // Confirmation Modal State
  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [userToToggle, setUserToToggle] = React.useState<SystemUser | null>(null);

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case "ADMIN":
        return "Administrator Sistem";
      case "TATA_USAHA":
        return "Staf Tata Usaha";
      case "KEPALA_SEKOLAH":
        return "Kepala Sekolah";
      case "GURU":
        return "Guru Pengajar";
      case "SISWA":
        return "Siswa Terdaftar";
      default:
        return "Pengguna";
    }
  };

  const toFrontendRole = (role: string): UserRole => {
    switch (role) {
      case "SUPER_ADMIN":
      case "ADMIN":
        return "ADMIN";
      case "SCHOOL_ADMIN":
        return "TATA_USAHA";
      case "PRINCIPAL":
        return "KEPALA_SEKOLAH";
      case "TEACHER":
        return "GURU";
      case "STUDENT":
      default:
        return "SISWA";
    }
  };

  const toBackendRole = (role: UserRole): string => {
    switch (role) {
      case "ADMIN":
        return "ADMIN";
      case "TATA_USAHA":
        return "SCHOOL_ADMIN";
      case "KEPALA_SEKOLAH":
        return "PRINCIPAL";
      case "GURU":
        return "TEACHER";
      case "SISWA":
      default:
        return "STUDENT";
    }
  };

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any[]>("/users");
      if (res.data && Array.isArray(res.data)) {
        const mapped: SystemUser[] = res.data.map((u: any) => {
          const role = toFrontendRole(u.role);
          return {
            id: u.id,
            username: u.username,
            fullName: u.teacher?.fullName || u.student?.fullName || u.fullName || u.username,
            email: u.email || `${u.username}@smapbngrayun.sch.id`,
            role,
            roleLabel: getRoleLabel(role),
            institution: "SMA PB Ngrayun",
            status: u.isActive !== false ? "AKTIF" : "NONAKTIF",
            lastLogin: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("id-ID") : "Belum pernah login",
          };
        });
        setUsers(mapped);
      }
    } catch (err) {
      console.error("Gagal memuat daftar pengguna:", err);
      toast.error("Gagal memuat pengguna dari server.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserAccountInput>({
    resolver: zodResolver(userAccountSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      role: "GURU",
      status: "AKTIF",
      institution: "SMA PB Ngrayun",
    },
  });

  const selectedRole = watch("role");
  const selectedStatus = watch("status");

  // Sync form on open
  React.useEffect(() => {
    if (userToEdit) {
      reset({
        username: userToEdit.username,
        fullName: userToEdit.fullName,
        email: userToEdit.email,
        role: userToEdit.role,
        status: userToEdit.status,
        institution: userToEdit.institution || "SMA PB Ngrayun",
      });
    } else {
      reset({
        username: "",
        fullName: "",
        email: "",
        role: "GURU",
        status: "AKTIF",
        institution: "SMA PB Ngrayun",
      });
    }
  }, [userToEdit, reset, modalOpen]);

  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        search === "" ||
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.username.includes(search) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.roleLabel.toLowerCase().includes(search.toLowerCase());

      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchStatus = statusFilter === "ALL" || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  React.useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const paginatedUsers = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const handleOpenAdd = () => {
    setUserToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user: SystemUser) => {
    setUserToEdit(user);
    setModalOpen(true);
  };

  const onSubmitForm = async (data: UserAccountInput) => {
    try {
      if (userToEdit) {
        await apiClient.patch(`/users/${userToEdit.id}`, {
          email: data.email || undefined,
          role: toBackendRole(data.role),
          isActive: data.status === "AKTIF",
        });
        await fetchUsers();
        toast.success("Akun Pengguna Diperbarui", {
          description: `Informasi akun ${data.fullName} berhasil disimpan.`,
        });
      } else {
        await apiClient.post("/users", {
          username: data.username,
          password: "password123",
          email: data.email || undefined,
          role: toBackendRole(data.role),
        });
        await fetchUsers();
        toast.success("Akun Pengguna Berhasil Dibuat", {
          description: `Akun ${data.fullName} dengan peran ${getRoleLabel(data.role)} telah aktif. Password default: password123`,
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan akun pengguna.");
    }
  };

  const handleOpenToggleStatus = (user: SystemUser) => {
    setUserToToggle(user);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (userToToggle) {
      try {
        const nextIsActive = userToToggle.status !== "AKTIF";
        await apiClient.patch(`/users/${userToToggle.id}`, { isActive: nextIsActive });
        await fetchUsers();
        const nextState = userToToggle.status === "AKTIF" ? "dinonaktifkan" : "diaktifkan";
        toast.info(`Akun ${userToToggle.fullName} telah ${nextState}.`);
      } catch (err: any) {
        toast.error(err.message || "Gagal mengubah status akun.");
      } finally {
        setConfirmModalOpen(false);
        setUserToToggle(null);
      }
    }
  };

  const handleResetPassword = (user: SystemUser) => {
    toast.success("Simulasi Reset Kata Sandi", {
      description: `Tautan instruksi pemulihan kredensial telah dikirim ke email ${user.email} (Tidak menyimpan password asli pada mock).`,
    });
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case "ADMIN":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300";
      case "TATA_USAHA":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300";
      case "KEPALA_SEKOLAH":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300";
      case "GURU":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300";
      case "SISWA":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Disclaimer Security Note */}
      <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <span className="font-semibold">Keamanan & Privasi Akun:</span> Manajemen akun pengguna ini adalah simulasi antarmuka frontend dengan mock data. Sistem tidak pernah menyimpan password asli atau membuat autentikasi palsu. Otentikasi produksi menggunakan JWT HttpOnly cookies dan hashing Argon2/Bcrypt di backend NestJS.
        </div>
      </div>

      {/* Top Action & Search Bar */}
      <Card className="p-3">
        <TableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari nama, NIP/NIS, atau email pengguna..."
          classFilter={{
            value: roleFilter,
            onChange: setRoleFilter,
            options: [
              { label: "Semua Peran", value: "ALL" },
              { label: "Admin Sistem", value: "ADMIN" },
              { label: "Tata Usaha", value: "TATA_USAHA" },
              { label: "Kepala Sekolah", value: "KEPALA_SEKOLAH" },
              { label: "Guru Pengajar", value: "GURU" },
              { label: "Siswa", value: "SISWA" },
            ],
            placeholder: "Filter Peran",
          }}
          statusFilter={{
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "Semua Status", value: "ALL" },
              { label: "Aktif", value: "AKTIF" },
              { label: "Non-Aktif", value: "NONAKTIF" },
            ],
            placeholder: "Filter Status",
          }}
          hasActiveFilters={search !== "" || roleFilter !== "ALL" || statusFilter !== "ALL"}
          onResetFilters={() => {
            setSearch("");
            setRoleFilter("ALL");
            setStatusFilter("ALL");
          }}
          extraActions={
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="h-9 text-xs gap-1.5 font-semibold shrink-0"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Tambah Akun Pengguna</span>
            </Button>
          }
        />
      </Card>

      {/* Users Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Daftar Akun Pengguna Sistem ({filteredUsers.length} Akun)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Pengelolaan hak akses role-based access control (RBAC) SMA PB Ngrayun
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Total {users.length} Akun Terdaftar
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Memuat data akun pengguna dari backend...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={Users}
                title="Pengguna Tidak Ditemukan"
                description="Tidak ada akun pengguna yang sesuai dengan kriteria pencarian atau filter yang dipilih."
                actionLabel="Reset Filter"
                onAction={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[700px] data-tabular">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Nama & Email</th>
                    <th className="py-3 px-4 font-semibold">NIP / NIS</th>
                    <th className="py-3 px-4 font-semibold">Hak Akses / Peran</th>
                    <th className="py-3 px-4 font-semibold">Status Akun</th>
                    <th className="py-3 px-4 font-semibold">Login Terakhir</th>
                    <th className="py-3 px-4 font-semibold text-right">Aksi Pengelolaan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{u.fullName}</p>
                            <p className="text-[11px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-foreground">
                        {u.username}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getRoleBadgeVariant(
                            u.role
                          )}`}
                        >
                          {u.roleLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={u.status === "AKTIF" ? "hadir" : "alpa"}
                          className="text-[10px] px-2 py-0.5"
                        >
                          {u.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-[11px]">
                        {u.lastLogin || "Belum Login"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(u)}
                            className="h-7 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                            title="Simulasi Reset Kata Sandi"
                          >
                            <Key className="h-3 w-3" />
                            <span className="hidden sm:inline">Reset</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(u)}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit Data Pengguna"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenToggleStatus(u)}
                            className={`h-7 w-7 ${
                              u.status === "AKTIF"
                                ? "text-rose-600 hover:text-rose-700"
                                : "text-emerald-600 hover:text-emerald-700"
                            }`}
                            title={u.status === "AKTIF" ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                          >
                            {u.status === "AKTIF" ? (
                              <UserX className="h-3.5 w-3.5" />
                            ) : (
                              <UserCheck className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="border-t border-border p-3">
              <Pagination
                currentPage={page}
                totalPages={totalPages || 1}
                totalItems={filteredUsers.length}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit User Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit(onSubmitForm)}>
            <DialogHeader>
              <div className="flex items-center gap-2 text-primary">
                <Shield className="h-5 w-5" />
                <DialogTitle className="text-base font-bold">
                  {userToEdit ? "Edit Akun Pengguna" : "Tambah Akun Pengguna Baru"}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                {userToEdit
                  ? `Perbarui informasi role dan status untuk ${userToEdit.fullName}`
                  : "Buat identitas akun untuk staf, guru, atau kesiswaan."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">
                  Nama Lengkap & Gelar <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("fullName")}
                  placeholder="Contoh: Nurul Hidayati, S.Pd."
                  className="h-8 text-xs"
                />
                {errors.fullName && (
                  <p className="text-[11px] text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">
                  NIP / NIS / Username <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("username")}
                  placeholder="18 digit NIP atau 8 digit NIS"
                  className="h-8 text-xs font-mono"
                />
                {errors.username && (
                  <p className="text-[11px] text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">
                  Alamat Email Resmi <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="nama@smapbngrayun.sch.id"
                  className="h-8 text-xs font-mono"
                />
                {errors.email && (
                  <p className="text-[11px] text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Peran / Hak Akses <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedRole}
                    onValueChange={(v: UserRole) => setValue("role", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Pilih Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN" className="text-xs">
                        Administrator
                      </SelectItem>
                      <SelectItem value="TATA_USAHA" className="text-xs">
                        Tata Usaha
                      </SelectItem>
                      <SelectItem value="KEPALA_SEKOLAH" className="text-xs">
                        Kepala Sekolah
                      </SelectItem>
                      <SelectItem value="GURU" className="text-xs">
                        Guru Pengajar
                      </SelectItem>
                      <SelectItem value="SISWA" className="text-xs">
                        Siswa
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Status Akun <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(v: "AKTIF" | "NONAKTIF") => setValue("status", v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AKTIF" className="text-xs">
                        Aktif
                      </SelectItem>
                      <SelectItem value="NONAKTIF" className="text-xs">
                        Non-Aktif
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting}>
                {userToEdit ? "Simpan Perubahan" : "Simpan Pengguna"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title={
          userToToggle?.status === "AKTIF"
            ? "Konfirmasi Penonaktifan Akun"
            : "Konfirmasi Pengaktifan Akun"
        }
        description={
          userToToggle?.status === "AKTIF"
            ? `Apakah Anda yakin ingin menonaktifkan akun ${userToToggle?.fullName} (${userToToggle?.username})? Pengguna tidak akan dapat mengakses SIAKAD.`
            : `Aktifkan kembali akses akun untuk ${userToToggle?.fullName} (${userToToggle?.username}).`
        }
        confirmLabel={
          userToToggle?.status === "AKTIF" ? "Ya, Nonaktifkan" : "Ya, Aktifkan"
        }
        cancelLabel="Batal"
        variant={userToToggle?.status === "AKTIF" ? "danger" : "primary"}
        onConfirm={handleConfirmToggleStatus}
      />
    </div>
  );
}
