"use client";

import * as React from "react";
import {
  GraduationCap,
  Mail,
  Phone,
  BookOpen,
  Plus,
  Eye,
  Edit,
  UserX,
  UserCheck,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { TeacherDetailModal } from "./teacher-detail-modal";
import { TeacherFormModal } from "./teacher-form-modal";
import { useSchoolData } from "@/contexts/school-data-context";
import { Teacher } from "@/types";

export function TeacherList() {
  const { teachers, toggleTeacherStatus } = useSchoolData();

  const [search, setSearch] = React.useState("");
  const [selectedRole, setSelectedRole] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [viewMode, setViewMode] = React.useState<"grid" | "table">("grid");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(9);

  // Modals
  const [selectedTeacher, setSelectedTeacher] = React.useState<Teacher | null>(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);

  const [formModalOpen, setFormModalOpen] = React.useState(false);
  const [teacherToEdit, setTeacherToEdit] = React.useState<Teacher | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [teacherToToggle, setTeacherToToggle] = React.useState<Teacher | null>(null);

  // Filter
  const filteredTeachers = React.useMemo(() => {
    return teachers.filter((t) => {
      const matchSearch =
        search === "" ||
        t.fullName.toLowerCase().includes(search.toLowerCase()) ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.nip.includes(search) ||
        (t.subjects && t.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase())));

      const matchRole =
        selectedRole === "ALL" || t.role === selectedRole;

      const matchStatus =
        selectedStatus === "ALL" || t.status === selectedStatus;

      return matchSearch && matchRole && matchStatus;
    });
  }, [teachers, search, selectedRole, selectedStatus]);

  React.useEffect(() => {
    setPage(1);
  }, [search, selectedRole, selectedStatus, pageSize]);

  const paginatedTeachers = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTeachers.slice(start, start + pageSize);
  }, [filteredTeachers, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / pageSize));

  const handleOpenDetail = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDetailModalOpen(true);
  };

  const handleOpenAdd = () => {
    setTeacherToEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setTeacherToEdit(teacher);
    setFormModalOpen(true);
  };

  const handleOpenToggleStatus = (teacher: Teacher) => {
    setTeacherToToggle(teacher);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggleStatus = () => {
    if (teacherToToggle) {
      toggleTeacherStatus(teacherToToggle.id);
      setConfirmModalOpen(false);
      setTeacherToToggle(null);
    }
  };

  const hasActiveFilters =
    search !== "" || selectedRole !== "ALL" || selectedStatus !== "ALL";

  const handleResetFilters = () => {
    setSearch("");
    setSelectedRole("ALL");
    setSelectedStatus("ALL");
  };

  return (
    <div className="space-y-4">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Direktori Dewan Guru & Tenaga Kependidikan
          </h2>
          <p className="text-xs text-muted-foreground">
            Kelola profil pendidik, penugasan rombel, mata pelajaran diampu, dan status kepegawaian
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("grid")}
              title="Tampilan Kartu"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("table")}
              title="Tampilan Tabel"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button size="sm" className="gap-1.5 text-xs" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5" />
            Tambah Guru Baru
          </Button>
        </div>
      </div>

      {/* Toolbar Filters */}
      <Card className="p-3">
        <TableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari nama guru, NIP, gelar, atau mapel..."
          classFilter={{
            value: selectedRole,
            onChange: setSelectedRole,
            options: [
              { label: "Semua Peran", value: "ALL" },
              { label: "Wali Kelas", value: "WALI_KELAS" },
              { label: "Guru Mapel", value: "GURU_MAPEL" },
              { label: "Petugas Piket", value: "PETUGAS_PIKET" },
              { label: "Kepala Sekolah", value: "KEPALA_SEKOLAH" },
              { label: "Tata Usaha", value: "TATA_USAHA" },
            ],
            placeholder: "Filter Peran",
          }}
          statusFilter={{
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
              { label: "Semua Status", value: "ALL" },
              { label: "Aktif Mengajar", value: "AKTIF" },
              { label: "Cuti", value: "CUTI" },
              { label: "Non-Aktif", value: "NON_AKTIF" },
            ],
            placeholder: "Filter Status",
          }}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      </Card>

      {/* Main Content: Grid or Table */}
      {filteredTeachers.length === 0 ? (
        <EmptyState
          title="Tidak Ada Tenaga Pendidik Ditemukan"
          description="Tidak ada guru yang sesuai dengan kriteria pencarian dan filter yang Anda tentukan."
          actionLabel="Reset Pencarian & Filter"
          onAction={handleResetFilters}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paginatedTeachers.map((teacher) => (
            <Card
              key={teacher.id}
              className="p-5 space-y-4 hover:border-primary/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border border-primary/20 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {teacher.fullName
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate" title={teacher.fullName}>
                      {teacher.fullName}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate" title={teacher.title}>
                      {teacher.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant="navy" className="text-[10px] px-1.5 py-0">
                        {teacher.role.replace("_", " ")}
                      </Badge>
                      {teacher.isHomeroom && (
                        <Badge variant="hadir" className="text-[10px] px-1.5 py-0">
                          {teacher.assignedClass}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          teacher.status === "AKTIF"
                            ? "hadir"
                            : teacher.status === "CUTI"
                            ? "izin"
                            : "alpa"
                        }
                        className="text-[10px] px-1.5 py-0"
                      >
                        {teacher.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      NIP: {teacher.nip}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-mono">{teacher.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span className="truncate">{teacher.subjects.join(", ")}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between border-t border-border pt-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 flex-1"
                  onClick={() => handleOpenDetail(teacher)}
                >
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  Detail Profil
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Edit Data Guru"
                  onClick={() => handleOpenEdit(teacher)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 ${
                    teacher.status === "AKTIF"
                      ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  }`}
                  title={
                    teacher.status === "AKTIF"
                      ? "Non-aktifkan Guru"
                      : "Aktifkan Guru"
                  }
                  onClick={() => handleOpenToggleStatus(teacher)}
                >
                  {teacher.status === "AKTIF" ? (
                    <UserX className="h-3.5 w-3.5" />
                  ) : (
                    <UserCheck className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-md border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-3.5 font-semibold">NIP / Kode</th>
                <th className="py-3 px-3 font-semibold">Nama Lengkap & Gelar</th>
                <th className="py-3 px-3 font-semibold">Peran</th>
                <th className="py-3 px-3 font-semibold">Mata Pelajaran Diampu</th>
                <th className="py-3 px-3 font-semibold">Wali Kelas</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {paginatedTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3.5 font-mono font-medium text-foreground data-tabular">
                    {teacher.nip}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-foreground">{teacher.fullName}</span>
                    <span className="block text-[10px] text-muted-foreground">{teacher.email}</span>
                  </td>
                  <td className="py-3 px-3">
                    <Badge variant="navy" className="text-[10px]">
                      {teacher.role.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground max-w-[200px] truncate">
                    {teacher.subjects.join(", ")}
                  </td>
                  <td className="py-3 px-3">
                    {teacher.isHomeroom ? (
                      <Badge variant="hadir" className="text-[10px]">
                        {teacher.assignedClass}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <Badge
                      variant={
                        teacher.status === "AKTIF"
                          ? "hadir"
                          : teacher.status === "CUTI"
                          ? "izin"
                          : "alpa"
                      }
                      className="text-[10px]"
                    >
                      {teacher.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-primary hover:text-primary-hover"
                        title="Lihat Detail Profil"
                        onClick={() => handleOpenDetail(teacher)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Edit Guru"
                        onClick={() => handleOpenEdit(teacher)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-7 w-7 ${
                          teacher.status === "AKTIF"
                            ? "text-rose-600 hover:text-rose-700"
                            : "text-emerald-600 hover:text-emerald-700"
                        }`}
                        title={teacher.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"}
                        onClick={() => handleOpenToggleStatus(teacher)}
                      >
                        {teacher.status === "AKTIF" ? (
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
      {filteredTeachers.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredTeachers.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      {/* Detail Modal */}
      <TeacherDetailModal
        teacher={selectedTeacher}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onEdit={handleOpenEdit}
      />

      {/* Add / Edit Form Modal */}
      <TeacherFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        teacherToEdit={teacherToEdit}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title={
          teacherToToggle?.status === "AKTIF"
            ? "Konfirmasi Penonaktifan Guru"
            : "Konfirmasi Pengaktifan Kembali Guru"
        }
        description={
          teacherToToggle?.status === "AKTIF"
            ? `Apakah Anda yakin ingin menonaktifkan akun pengajar ${teacherToToggle?.fullName}? Guru bersangkutan tidak akan dapat membuka sesi presensi kelas.`
            : `Aktifkan kembali akun mengajar untuk ${teacherToToggle?.fullName}.`
        }
        confirmLabel={
          teacherToToggle?.status === "AKTIF" ? "Ya, Nonaktifkan" : "Ya, Aktifkan"
        }
        cancelLabel="Batal"
        variant={teacherToToggle?.status === "AKTIF" ? "danger" : "primary"}
        onConfirm={handleConfirmToggleStatus}
      />
    </div>
  );
}
