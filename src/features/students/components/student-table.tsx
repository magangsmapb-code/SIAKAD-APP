"use client";

import * as React from "react";
import {
  Users,
  Search,
  Filter,
  Eye,
  Plus,
  CreditCard,
  Phone,
  Edit,
  UserX,
  UserCheck,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { StudentDetailModal } from "./student-detail-modal";
import { StudentFormModal } from "./student-form-modal";
import { useSchoolData } from "@/contexts/school-data-context";
import { Student } from "@/types";
import { toast } from "sonner";

export function StudentTable() {
  const { students, classes, toggleStudentStatus } = useSchoolData();

  const [search, setSearch] = React.useState("");
  const [selectedClass, setSelectedClass] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [selectedYear, setSelectedYear] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Modal states
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);

  const [formModalOpen, setFormModalOpen] = React.useState(false);
  const [studentToEdit, setStudentToEdit] = React.useState<Student | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [studentToToggle, setStudentToToggle] = React.useState<Student | null>(null);

  // Filter students
  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        search === "" ||
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.nis.includes(search) ||
        s.nisn.includes(search) ||
        s.address.toLowerCase().includes(search.toLowerCase()) ||
        s.parentName.toLowerCase().includes(search.toLowerCase());

      const matchClass =
        selectedClass === "ALL" || s.className === selectedClass || s.classId === selectedClass;

      const matchStatus =
        selectedStatus === "ALL" || s.status === selectedStatus;

      const matchYear =
        selectedYear === "ALL" || s.academicYear === selectedYear;

      return matchSearch && matchClass && matchStatus && matchYear;
    });
  }, [students, search, selectedClass, selectedStatus, selectedYear]);

  // Reset to page 1 on search or filter change
  React.useEffect(() => {
    setPage(1);
  }, [search, selectedClass, selectedStatus, selectedYear, pageSize]);

  const paginatedStudents = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));

  const handleOpenDetail = (student: Student) => {
    setSelectedStudent(student);
    setDetailModalOpen(true);
  };

  const handleOpenAdd = () => {
    setStudentToEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setStudentToEdit(student);
    setFormModalOpen(true);
  };

  const handleOpenToggleStatus = (student: Student) => {
    setStudentToToggle(student);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggleStatus = () => {
    if (studentToToggle) {
      toggleStudentStatus(studentToToggle.id);
      setConfirmModalOpen(false);
      setStudentToToggle(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AKTIF":
        return <Badge variant="hadir" className="text-[10px]">Aktif</Badge>;
      case "NON_AKTIF":
        return <Badge variant="alpa" className="text-[10px]">Non-Aktif</Badge>;
      case "MUTASI":
        return <Badge variant="izin" className="text-[10px]">Mutasi</Badge>;
      case "LULUS":
        return <Badge variant="navy" className="text-[10px]">Lulus</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const hasActiveFilters =
    search !== "" ||
    selectedClass !== "ALL" ||
    selectedStatus !== "ALL" ||
    selectedYear !== "ALL";

  const handleResetFilters = () => {
    setSearch("");
    setSelectedClass("ALL");
    setSelectedStatus("ALL");
    setSelectedYear("ALL");
  };

  const handleExportData = () => {
    toast.success("Ekspor Data Siswa", {
      description: `Format CSV dengan ${filteredStudents.length} data siswa disiapkan untuk diunduh.`,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Data Induk Siswa & Kartu RFID Presensi
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Total {students.length} siswa terdaftar di SMA Pemberdayaan Bangsa Ngrayun ({filteredStudents.length} ditampilkan)
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="gap-1.5 self-start sm:self-auto text-xs"
            onClick={handleOpenAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Siswa Baru
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Toolbar: Search, Filters & Export */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <TableToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Cari nama siswa, NIS, NISN, atau alamat..."
            classFilter={{
              value: selectedClass,
              onChange: setSelectedClass,
              options: [
                { label: "Semua Kelas", value: "ALL" },
                ...classes.map((c) => ({ label: c.name, value: c.name })),
              ],
              placeholder: "Pilih Kelas",
            }}
            statusFilter={{
              value: selectedStatus,
              onChange: setSelectedStatus,
              options: [
                { label: "Semua Status", value: "ALL" },
                { label: "Aktif", value: "AKTIF" },
                { label: "Non-Aktif", value: "NON_AKTIF" },
                { label: "Mutasi", value: "MUTASI" },
                { label: "Lulus", value: "LULUS" },
              ],
              placeholder: "Pilih Status",
            }}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            onExport={handleExportData}
            exportLabel="Ekspor CSV"
            extraActions={
              <div className="w-36">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Tahun Ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">
                      Semua Tahun
                    </SelectItem>
                    <SelectItem value="2026/2027" className="text-xs">
                      T.A. 2026/2027
                    </SelectItem>
                    <SelectItem value="2025/2026" className="text-xs">
                      T.A. 2025/2026
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            }
          />
        </div>

        {/* Data Table or Empty State */}
        {filteredStudents.length === 0 ? (
          <EmptyState
            title="Tidak Ada Siswa Ditemukan"
            description="Tidak ada data siswa yang cocok dengan kriteria pencarian atau filter yang dipilih."
            actionLabel="Reset Pencarian & Filter"
            onAction={handleResetFilters}
          />
        ) : (
          <>
            {/* Mobile Card List View (< md) */}
            <div className="block md:hidden divide-y divide-border/60 rounded-lg border border-border bg-card">
              {paginatedStudents.map((s) => (
                <div key={s.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-foreground block">{s.fullName}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        NIS: {s.nis} • NISN: {s.nisn}
                      </span>
                    </div>
                    {getStatusBadge(s.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="font-medium text-xs">
                      {s.className}
                    </Badge>
                    <span
                      className={`inline-flex items-center justify-center font-bold text-xs h-6 w-6 rounded-md ${
                        s.gender === "L"
                          ? "bg-sky-100 text-[#075985]"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {s.gender}
                    </span>
                    <div className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground ml-auto">
                      <CreditCard className="h-3 w-3 text-primary shrink-0" />
                      <span>{s.rfidCardUid || "Tanpa RFID"}</span>
                    </div>
                  </div>

                  {s.parentName && (
                    <div className="text-xs text-muted-foreground flex items-center justify-between pt-1">
                      <span>Wali: {s.parentName}</span>
                      {s.parentPhone && (
                        <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-600">
                          <Phone className="h-3 w-3" />
                          {s.parentPhone}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Mobile Action Buttons (min 44px tap targets) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-11 min-h-[44px] text-xs gap-1.5 text-primary hover:bg-primary/10 border-primary/20 touch-target font-semibold"
                      onClick={() => handleOpenDetail(s)}
                    >
                      <Eye className="h-4 w-4" />
                      <span>Detail</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-11 min-h-[44px] text-xs gap-1.5 text-muted-foreground hover:text-foreground touch-target font-semibold"
                      onClick={() => handleOpenEdit(s)}
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-11 min-h-[44px] px-3.5 text-xs gap-1.5 touch-target font-semibold ${
                        s.status === "AKTIF"
                          ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                          : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                      }`}
                      onClick={() => handleOpenToggleStatus(s)}
                    >
                      {s.status === "AKTIF" ? (
                        <>
                          <UserX className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only">Nonaktifkan</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          <span className="sr-only sm:not-sr-only">Aktifkan</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 font-semibold">NIS / NISN</th>
                    <th className="py-3 px-3 font-semibold">Nama Siswa</th>
                    <th className="py-3 px-3 font-semibold">Kelas</th>
                    <th className="py-3 px-3 font-semibold">L/P</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-3 font-semibold">RFID Tag</th>
                    <th className="py-3 px-3 font-semibold">Orang Tua / Wali</th>
                    <th className="py-3 px-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      {/* NIS / NISN */}
                      <td className="py-3 px-3.5 font-mono data-tabular">
                        <span className="font-semibold text-foreground">{s.nis}</span>
                        <span className="block text-[10px] text-muted-foreground">{s.nisn}</span>
                      </td>

                      {/* Nama Siswa */}
                      <td className="py-3 px-3">
                        <span className="font-semibold text-foreground">{s.fullName}</span>
                        <span className="block text-[10px] text-muted-foreground truncate max-w-[180px]">
                          {s.address}
                        </span>
                      </td>

                      {/* Kelas */}
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="font-medium text-xs">
                          {s.className}
                        </Badge>
                        {s.academicYear && (
                          <span className="block text-[10px] text-muted-foreground mt-0.5">
                            {s.academicYear}
                          </span>
                        )}
                      </td>

                      {/* Gender */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center justify-center font-bold text-xs h-6 w-6 rounded-md ${
                            s.gender === "L"
                              ? "bg-sky-100 text-[#075985]"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {s.gender}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {getStatusBadge(s.status)}
                      </td>

                      {/* RFID Tag */}
                      <td className="py-3 px-3 font-mono text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate max-w-[110px]">
                            {s.rfidCardUid || "Belum Ada"}
                          </span>
                        </div>
                      </td>

                      {/* Orang Tua */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-foreground">{s.parentName}</span>
                        <span className="flex items-center gap-0.5 font-mono text-[10px] text-muted-foreground mt-0.5">
                          <Phone className="h-2.5 w-2.5 text-emerald-600" />
                          {s.parentPhone}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Detail */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary hover:text-primary-hover hover:bg-primary/10"
                            title="Lihat Detail Siswa"
                            onClick={() => handleOpenDetail(s)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Edit */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Edit Data Siswa"
                            onClick={() => handleOpenEdit(s)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Toggle Status with Confirmation */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              s.status === "AKTIF"
                                ? "text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            }`}
                            title={
                              s.status === "AKTIF"
                                ? "Non-aktifkan Siswa"
                                : "Aktifkan Kembali Siswa"
                            }
                            onClick={() => handleOpenToggleStatus(s)}
                          >
                            {s.status === "AKTIF" ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {filteredStudents.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredStudents.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </CardContent>

      {/* Modal Detail */}
      <StudentDetailModal
        student={selectedStudent}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onEdit={handleOpenEdit}
      />

      {/* Modal Tambah / Edit */}
      <StudentFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        studentToEdit={studentToEdit}
      />

      {/* Modal Konfirmasi Non-aktifkan / Aktifkan */}
      <ConfirmationModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title={
          studentToToggle?.status === "AKTIF"
            ? "Konfirmasi Penonaktifan Siswa"
            : "Konfirmasi Pengaktifan Siswa"
        }
        description={
          studentToToggle?.status === "AKTIF"
            ? `Apakah Anda yakin ingin menonaktifkan status ${studentToToggle?.fullName} (NIS: ${studentToToggle?.nis})? Kartu RFID siswa tidak akan dapat digunakan untuk presensi gerbang otomatis.`
            : `Aktifkan kembali status kesiswaan ${studentToToggle?.fullName} (NIS: ${studentToToggle?.nis}) untuk mengizinkan pencatatan presensi.`
        }
        confirmLabel={
          studentToToggle?.status === "AKTIF" ? "Ya, Nonaktifkan" : "Ya, Aktifkan"
        }
        cancelLabel="Batal"
        variant={studentToToggle?.status === "AKTIF" ? "danger" : "primary"}
        onConfirm={handleConfirmToggleStatus}
      />
    </Card>
  );
}
