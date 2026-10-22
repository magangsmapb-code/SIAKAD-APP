"use client";

import * as React from "react";
import Link from "next/link";
import {
  School,
  Users,
  UserCheck,
  ArrowRight,
  Plus,
  Eye,
  Edit,
  Archive,
  ArchiveRestore,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { ClassDetailModal } from "./class-detail-modal";
import { ClassFormModal } from "./class-form-modal";
import { useSchoolData } from "@/contexts/school-data-context";
import { SchoolClass } from "@/types";

export function ClassGrid() {
  const { classes, students, archiveClass } = useSchoolData();

  const [search, setSearch] = React.useState("");
  const [selectedLevel, setSelectedLevel] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ACTIVE");

  // Modals
  const [selectedClass, setSelectedClass] = React.useState<SchoolClass | null>(null);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);

  const [formModalOpen, setFormModalOpen] = React.useState(false);
  const [classToEdit, setClassToEdit] = React.useState<SchoolClass | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [classToArchive, setClassToArchive] = React.useState<SchoolClass | null>(null);

  // Filter
  const filteredClasses = React.useMemo(() => {
    return classes.filter((cls) => {
      const matchSearch =
        search === "" ||
        cls.name.toLowerCase().includes(search.toLowerCase()) ||
        cls.homeroomTeacherName.toLowerCase().includes(search.toLowerCase()) ||
        cls.roomNumber.toLowerCase().includes(search.toLowerCase());

      const matchLevel =
        selectedLevel === "ALL" || cls.level === selectedLevel;

      const isArchived = Boolean(cls.isArchived);
      const matchStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "ACTIVE" && !isArchived) ||
        (selectedStatus === "ARCHIVED" && isArchived);

      return matchSearch && matchLevel && matchStatus;
    });
  }, [classes, search, selectedLevel, selectedStatus]);

  const handleOpenDetail = (cls: SchoolClass) => {
    setSelectedClass(cls);
    setDetailModalOpen(true);
  };

  const handleOpenAdd = () => {
    setClassToEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (cls: SchoolClass) => {
    setClassToEdit(cls);
    setFormModalOpen(true);
  };

  const handleOpenArchive = (cls: SchoolClass) => {
    setClassToArchive(cls);
    setConfirmModalOpen(true);
  };

  const handleConfirmArchive = () => {
    if (classToArchive) {
      archiveClass(classToArchive.id);
      setConfirmModalOpen(false);
      setClassToArchive(null);
    }
  };

  const hasActiveFilters =
    search !== "" || selectedLevel !== "ALL" || selectedStatus !== "ACTIVE";

  const handleResetFilters = () => {
    setSearch("");
    setSelectedLevel("ALL");
    setSelectedStatus("ACTIVE");
  };

  return (
    <div className="space-y-4">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Rombongan Belajar (Rombel) SMA PB Ngrayun
          </h2>
          <p className="text-xs text-muted-foreground">
            Daftar kelas aktif, wali kelas, kapasitas ruangan, daftar anggota siswa, dan arsip rombel
          </p>
        </div>
        <Button size="sm" className="gap-1.5 self-start sm:self-auto text-xs" onClick={handleOpenAdd}>
          <Plus className="h-3.5 w-3.5" />
          Buat Rombel Baru
        </Button>
      </div>

      {/* Toolbar Filters */}
      <Card className="p-3">
        <TableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari nama rombel, wali kelas, atau ruang..."
          classFilter={{
            value: selectedLevel,
            onChange: setSelectedLevel,
            options: [
              { label: "Semua Tingkat", value: "ALL" },
              { label: "Kelas X (Sepuluh)", value: "X" },
              { label: "Kelas XI (Sebelas)", value: "XI" },
              { label: "Kelas XII (Duabelas)", value: "XII" },
            ],
            placeholder: "Filter Jenjang",
          }}
          statusFilter={{
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
              { label: "Rombel Aktif", value: "ACTIVE" },
              { label: "Rombel Diarsipkan", value: "ARCHIVED" },
              { label: "Semua Status", value: "ALL" },
            ],
            placeholder: "Status Arsip",
          }}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      </Card>

      {/* Class Cards Grid */}
      {filteredClasses.length === 0 ? (
        <EmptyState
          title="Tidak Ada Rombongan Belajar Ditemukan"
          description="Tidak ada rombel yang sesuai dengan kata kunci pencarian atau filter yang ditentukan."
          actionLabel="Reset Pencarian & Filter"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((cls) => {
            const actualStudentCount = students.filter(
              (s) => s.classId === cls.id || s.className === cls.name
            ).length;

            return (
              <Card
                key={cls.id}
                className={`p-5 space-y-4 hover:border-primary/40 transition-colors flex flex-col justify-between ${
                  cls.isArchived ? "opacity-75 bg-muted/20 border-dashed" : ""
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-navy-900 dark:text-white">
                          {cls.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {cls.major}
                        </Badge>
                        {cls.isArchived && (
                          <Badge variant="alpa" className="text-[9px]">
                            Diarsipkan
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-amber-500" />
                        {cls.roomNumber}
                      </p>
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      <School className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-2 border border-border">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Wali Kelas:</span>
                      <span className="font-semibold text-foreground truncate max-w-[170px]" title={cls.homeroomTeacherName}>
                        {cls.homeroomTeacherName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Jumlah Siswa:</span>
                      <span className="font-mono font-bold text-foreground">
                        {actualStudentCount} Siswa
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tahun Ajaran:</span>
                      <span className="font-medium text-foreground">{cls.academicYear}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 flex-1"
                      onClick={() => handleOpenDetail(cls)}
                    >
                      <Eye className="h-3.5 w-3.5 text-primary" />
                      Detail & Siswa
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Edit Rombel"
                      onClick={() => handleOpenEdit(cls)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${
                        cls.isArchived
                          ? "text-blue-600 hover:text-blue-700"
                          : "text-amber-600 hover:text-amber-700"
                      }`}
                      title={cls.isArchived ? "Buka Arsip Kelas" : "Arsipkan Kelas"}
                      onClick={() => handleOpenArchive(cls)}
                    >
                      {cls.isArchived ? (
                        <ArchiveRestore className="h-3.5 w-3.5" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs gap-1.5 h-8 font-medium"
                    asChild
                  >
                    <Link href={`/attendance`}>
                      <Users className="h-3.5 w-3.5 text-primary" />
                      Presensi Kelas Ini
                      <ArrowRight className="h-3 w-3 ml-auto text-muted-foreground" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Class Detail Modal */}
      <ClassDetailModal
        schoolClass={selectedClass}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onEdit={handleOpenEdit}
      />

      {/* Class Form Modal */}
      <ClassFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        classToEdit={classToEdit}
      />

      {/* Archive Confirmation Modal */}
      <ConfirmationModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title={
          classToArchive?.isArchived
            ? "Buka Arsip Rombel"
            : "Konfirmasi Arsip Rombel"
        }
        description={
          classToArchive?.isArchived
            ? `Kembalikan rombel ${classToArchive?.name} ke status aktif untuk tahun ajaran ${classToArchive?.academicYear}?`
            : `Apakah Anda yakin ingin mengarsipkan rombel ${classToArchive?.name}? Kelas yang diarsipkan tidak akan muncul dalam pilihan presensi harian.`
        }
        confirmLabel={
          classToArchive?.isArchived ? "Ya, Aktifkan" : "Ya, Arsipkan Rombel"
        }
        cancelLabel="Batal"
        variant={classToArchive?.isArchived ? "primary" : "warning"}
        onConfirm={handleConfirmArchive}
      />
    </div>
  );
}
