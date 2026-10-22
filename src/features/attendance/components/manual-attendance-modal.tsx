"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { manualAttendanceSchema, ManualAttendanceInput } from "@/lib/validators";
import { useSchoolData } from "@/contexts/school-data-context";
import { AttendanceStatus } from "@/types";
import { toast } from "sonner";

export interface ManualAttendanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitSuccess?: (data: ManualAttendanceInput) => void;
}

export function ManualAttendanceModal({
  open,
  onOpenChange,
  onSubmitSuccess,
}: ManualAttendanceModalProps) {
  const { classes, students } = useSchoolData();
  const [selectedClass, setSelectedClass] = React.useState<string>(classes[0]?.id || "");
  const [selectedStudent, setSelectedStudent] = React.useState<string>("");
  const [selectedStatus, setSelectedStatus] = React.useState<AttendanceStatus>("HADIR");
  const [notes, setNotes] = React.useState<string>("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!selectedClass && classes.length > 0) {
      setSelectedClass(classes[0].id);
    }
  }, [classes, selectedClass]);

  const filteredStudents = React.useMemo(() => {
    return students.filter((s) => s.classId === selectedClass);
  }, [students, selectedClass]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) {
      toast.error("Silakan pilih rombongan belajar (kelas) terlebih dahulu.");
      return;
    }
    if (!selectedStudent) {
      toast.error("Silakan pilih nama siswa yang akan diinputkan presensinya.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onOpenChange(false);
      const studentObj = students.find((s) => s.id === selectedStudent);
      toast.success(
        `Presensi manual ${studentObj?.fullName || "siswa"} (${selectedStatus}) berhasil disimpan.`
      );
      if (onSubmitSuccess) {
        onSubmitSuccess({
          studentId: selectedStudent,
          classId: selectedClass,
          status: selectedStatus,
          notes,
        });
      }
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <UserCheck className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold text-foreground">
              Input Presensi Manual
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            Gunakan formulir ini untuk mencatat presensi khusus guru piket atau kendala teknis mesin RFID.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Kelas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Pilih Rombongan Belajar (Kelas)</span>
              <span className="text-destructive">*</span>
            </label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id} className="text-xs">
                    {cls.name} ({cls.homeroomTeacherName || "Wali Kelas"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Siswa */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Pilih Nama Siswa</span>
              <span className="text-destructive">*</span>
            </label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Pilih Siswa" />
              </SelectTrigger>
              <SelectContent>
                {filteredStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.nis} - {s.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Status Presensi</span>
              <span className="text-destructive">*</span>
            </label>
            <Select
              value={selectedStatus}
              onValueChange={(val) => setSelectedStatus(val as AttendanceStatus)}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HADIR" className="text-xs">Hadir Tepat Waktu</SelectItem>
                <SelectItem value="TERLAMBAT" className="text-xs">Terlambat</SelectItem>
                <SelectItem value="IZIN" className="text-xs">Izin</SelectItem>
                <SelectItem value="SAKIT" className="text-xs">Sakit</SelectItem>
                <SelectItem value="ALPA" className="text-xs">Alpa (Tanpa Keterangan)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Catatan / Keterangan */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Catatan / Keterangan (Opsional)
            </label>
            <Textarea
              placeholder="Contoh: Kendala cuaca buruk di Desa Selur, diantar orang tua pukul 07:20 WIB"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-xs"
              rows={3}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Simpan Presensi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
