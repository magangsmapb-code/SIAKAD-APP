"use client";

import * as React from "react";
import {
  School,
  Users,
  UserCheck,
  MapPin,
  Calendar,
  CreditCard,
  Phone,
  Edit,
  GraduationCap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SchoolClass, Student } from "@/types";
import { useSchoolData } from "@/contexts/school-data-context";

interface ClassDetailModalProps {
  schoolClass: SchoolClass | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (schoolClass: SchoolClass) => void;
}

export function ClassDetailModal({
  schoolClass,
  open,
  onOpenChange,
  onEdit,
}: ClassDetailModalProps) {
  const { students } = useSchoolData();

  if (!schoolClass) return null;

  // Filter students belonging to this class
  const classStudents = students.filter(
    (s) => s.classId === schoolClass.id || s.className === schoolClass.name
  );

  const maleCount = classStudents.filter((s) => s.gender === "L").length;
  const femaleCount = classStudents.filter((s) => s.gender === "P").length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base">
                <School className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Rombel {schoolClass.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Tingkat {schoolClass.level} • Jurusan {schoolClass.major} • Tahun Ajaran {schoolClass.academicYear}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant={schoolClass.isArchived ? "alpa" : "hadir"}
              className="text-[10px]"
            >
              {schoolClass.isArchived ? "Diarsipkan" : "Aktif Berjalan"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Key Metrics & Homeroom Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 space-y-1">
              <span className="text-muted-foreground">Wali Kelas:</span>
              <p className="font-semibold text-foreground truncate">
                {schoolClass.homeroomTeacherName}
              </p>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-1">
              <span className="text-muted-foreground">Ruangan Kelas:</span>
              <p className="font-semibold text-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3 text-amber-500" />
                {schoolClass.roomNumber}
              </p>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-1">
              <span className="text-muted-foreground">Total Siswa Terdaftar:</span>
              <p className="font-bold text-foreground flex items-center gap-2">
                <span className="font-mono text-sm">{classStudents.length} Siswa</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  ({maleCount} L / {femaleCount} P)
                </span>
              </p>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <Users className="h-3.5 w-3.5 text-primary" />
                Daftar Anggota Kelas (Presensi Siswa)
              </h4>
              <span className="text-[11px] text-muted-foreground">
                {classStudents.length} siswa terhubung
              </span>
            </div>

            {classStudents.length === 0 ? (
              <div className="p-6 text-center rounded-lg border border-border bg-muted/20 text-muted-foreground space-y-1">
                <p className="font-medium text-xs">Belum ada siswa di rombel ini.</p>
                <p className="text-[11px]">
                  Daftarkan siswa baru atau ubah penempatan rombel pada menu Data Siswa.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">No</th>
                      <th className="py-2.5 px-3 font-semibold">NIS</th>
                      <th className="py-2.5 px-3 font-semibold">Nama Siswa</th>
                      <th className="py-2.5 px-3 font-semibold">L/P</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold">Orang Tua / Wali</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {classStudents.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="py-2 px-3 text-muted-foreground font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-mono font-medium text-foreground">
                          {s.nis}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-foreground">{s.fullName}</span>
                        </td>
                        <td className="py-2 px-3 font-bold">{s.gender}</td>
                        <td className="py-2 px-3">
                          <Badge
                            variant={s.status === "AKTIF" ? "hadir" : "alpa"}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {s.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-muted-foreground">
                          {s.parentName} ({s.parentPhone})
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          {onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => {
                onOpenChange(false);
                onEdit(schoolClass);
              }}
            >
              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              Edit Data Rombel
            </Button>
          )}
          <div className="ml-auto">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Tutup Informasi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
