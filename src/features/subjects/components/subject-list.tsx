"use client";

import * as React from "react";
import { BookOpen, Clock, Users, Plus, Edit, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { SubjectFormModal } from "./subject-form-modal";
import { useSchoolData } from "@/contexts/school-data-context";
import { Subject } from "@/types";

export function SubjectList() {
  const { subjects, toggleSubjectStatus } = useSchoolData();

  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");

  // Modals
  const [formModalOpen, setFormModalOpen] = React.useState(false);
  const [subjectToEdit, setSubjectToEdit] = React.useState<Subject | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [subjectToToggle, setSubjectToToggle] = React.useState<Subject | null>(null);

  // Filter
  const filteredSubjects = React.useMemo(() => {
    return subjects.filter((item) => {
      const matchSearch =
        search === "" ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.teacherNames &&
          item.teacherNames.some((t) =>
            t.toLowerCase().includes(search.toLowerCase())
          ));

      const matchCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;

      const isItemActive = item.isActive !== false;
      const matchStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "ACTIVE" && isItemActive) ||
        (selectedStatus === "INACTIVE" && !isItemActive);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [subjects, search, selectedCategory, selectedStatus]);

  const handleOpenAdd = () => {
    setSubjectToEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (subject: Subject) => {
    setSubjectToEdit(subject);
    setFormModalOpen(true);
  };

  const handleOpenToggleStatus = (subject: Subject) => {
    setSubjectToToggle(subject);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggleStatus = () => {
    if (subjectToToggle) {
      toggleSubjectStatus(subjectToToggle.id);
      setConfirmModalOpen(false);
      setSubjectToToggle(null);
    }
  };

  const hasActiveFilters =
    search !== "" || selectedCategory !== "ALL" || selectedStatus !== "ALL";

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("ALL");
    setSelectedStatus("ALL");
  };

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 gap-3">
        <div>
          <CardTitle className="text-base font-bold text-foreground">
            Mata Pelajaran Kurikulum Merdeka
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Daftar mapel wajib, peminatan, muatan lokal, alokasi jam presensi pembelajaran, dan guru pengampu
          </CardDescription>
        </div>
        <Button size="sm" className="text-xs gap-1 self-start sm:self-auto" onClick={handleOpenAdd}>
          <Plus className="h-3.5 w-3.5" />
          Tambah Mapel
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Toolbar */}
        <TableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari nama mapel, kode, atau guru pengampu..."
          classFilter={{
            value: selectedCategory,
            onChange: setSelectedCategory,
            options: [
              { label: "Semua Kategori", value: "ALL" },
              { label: "Wajib (Umum)", value: "WAJIB" },
              { label: "Peminatan", value: "PEMINATAN" },
              { label: "Muatan Lokal", value: "MUATAN_LOKAL" },
            ],
            placeholder: "Filter Kategori",
          }}
          statusFilter={{
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
              { label: "Semua Status", value: "ALL" },
              { label: "Aktif", value: "ACTIVE" },
              { label: "Non-Aktif", value: "INACTIVE" },
            ],
            placeholder: "Filter Status",
          }}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />

        {filteredSubjects.length === 0 ? (
          <EmptyState
            title="Mata Pelajaran Tidak Ditemukan"
            description="Tidak ada mata pelajaran yang cocok dengan filter atau kata kunci pencarian Anda."
            actionLabel="Reset Pencarian & Filter"
            onAction={handleResetFilters}
          />
        ) : (
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 font-semibold">Kode Mapel</th>
                  <th className="py-3 px-3 font-semibold">Nama Mata Pelajaran</th>
                  <th className="py-3 px-3 font-semibold">Kategori</th>
                  <th className="py-3 px-3 font-semibold">Alokasi Jam (JP)</th>
                  <th className="py-3 px-3 font-semibold">Guru Pengampu</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSubjects.map((item) => {
                  const isActive = item.isActive !== false;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-semibold text-primary">
                        {item.code}
                      </td>
                      <td className="py-3 px-3 font-semibold text-foreground">
                        {item.name}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            item.category === "WAJIB"
                              ? "default"
                              : item.category === "PEMINATAN"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {item.category.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold">{item.creditHours} JP</span> / minggu
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        {item.teacherNames && item.teacherNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {item.teacherNames.map((name, i) => (
                              <Badge key={i} variant="outline" className="text-[10px]">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span>{item.teacherCount} Guru Terdaftar</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={isActive ? "hadir" : "alpa"}
                          className="text-[10px]"
                        >
                          {isActive ? "Aktif" : "Non-Aktif"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Edit Mapel"
                            onClick={() => handleOpenEdit(item)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 ${
                              isActive
                                ? "text-amber-600 hover:text-amber-700"
                                : "text-emerald-600 hover:text-emerald-700"
                            }`}
                            title={isActive ? "Non-aktifkan Mapel" : "Aktifkan Mapel"}
                            onClick={() => handleOpenToggleStatus(item)}
                          >
                            {isActive ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Form Modal */}
      <SubjectFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        subjectToEdit={subjectToEdit}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title={
          subjectToToggle?.isActive !== false
            ? "Konfirmasi Penonaktifan Mapel"
            : "Konfirmasi Pengaktifan Mapel"
        }
        description={
          subjectToToggle?.isActive !== false
            ? `Apakah Anda yakin ingin menonaktifkan mata pelajaran ${subjectToToggle?.name} (${subjectToToggle?.code})? Mapel yang dinonaktifkan tidak akan dapat dipilih saat pembuatan jadwal baru.`
            : `Aktifkan kembali mata pelajaran ${subjectToToggle?.name} (${subjectToToggle?.code}) ke dalam kurikulum pembelajaran aktif.`
        }
        confirmLabel={
          subjectToToggle?.isActive !== false
            ? "Ya, Nonaktifkan"
            : "Ya, Aktifkan"
        }
        cancelLabel="Batal"
        variant={subjectToToggle?.isActive !== false ? "warning" : "primary"}
        onConfirm={handleConfirmToggleStatus}
      />
    </Card>
  );
}
