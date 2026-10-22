"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  School,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { scheduleFormSchema, ScheduleFormInput } from "@/lib/validators";
import { ScheduleItem, DayOfWeek } from "@/types";
import { useSchoolData } from "@/contexts/school-data-context";

interface ScheduleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleToEdit?: ScheduleItem | null;
  defaultClassId?: string;
}

const DAYS: { label: string; value: DayOfWeek }[] = [
  { label: "Senin", value: "SENIN" },
  { label: "Selasa", value: "SELASA" },
  { label: "Rabu", value: "RABU" },
  { label: "Kamis", value: "KAMIS" },
  { label: "Jumat", value: "JUMAT" },
  { label: "Sabtu", value: "SABTU" },
];

const ROOM_OPTIONS = [
  "R.101 (Lantai 1)",
  "R.102 (Lantai 1)",
  "R.103 (Lantai 1)",
  "R.201 (Lantai 2)",
  "R.202 (Lantai 2)",
  "R.301 (Lantai 3)",
  "Lab Komputer 1",
  "Lab Komputer 2",
  "Lab Fisika",
  "Lab Biologi / Kimia",
  "Perpustakaan",
  "Lapangan Olahraga",
];

export function ScheduleFormModal({
  open,
  onOpenChange,
  scheduleToEdit,
  defaultClassId,
}: ScheduleFormModalProps) {
  const { classes, subjects, teachers, addSchedule, updateSchedule, validateScheduleConflict } =
    useSchoolData();

  const isEditing = Boolean(scheduleToEdit);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleFormInput>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      classId: "",
      subjectId: "",
      teacherId: "",
      day: "SENIN",
      startTime: "07:30",
      endTime: "09:00",
      room: "R.101",
    },
  });

  const watchedValues = watch();

  // Reset values when opened
  React.useEffect(() => {
    if (scheduleToEdit) {
      reset({
        classId: scheduleToEdit.classId,
        subjectId: scheduleToEdit.subjectId,
        teacherId: scheduleToEdit.teacherId,
        day: scheduleToEdit.day,
        startTime: scheduleToEdit.startTime,
        endTime: scheduleToEdit.endTime,
        room: scheduleToEdit.room,
      });
    } else {
      reset({
        classId: defaultClassId || classes[0]?.id || "",
        subjectId: subjects[0]?.id || "",
        teacherId: teachers[0]?.id || "",
        day: "SENIN",
        startTime: "07:30",
        endTime: "09:00",
        room: classes[0]?.roomNumber ? classes[0].roomNumber.split(" ")[0] : "R.101",
      });
    }
  }, [scheduleToEdit, defaultClassId, classes, subjects, teachers, reset, open]);

  // Live client-side conflict check
  const conflictResult = React.useMemo(() => {
    if (
      !watchedValues.classId ||
      !watchedValues.subjectId ||
      !watchedValues.teacherId ||
      !watchedValues.day ||
      !watchedValues.startTime ||
      !watchedValues.endTime ||
      !watchedValues.room
    ) {
      return { hasConflict: false, conflicts: [] };
    }

    const cls = classes.find((c) => c.id === watchedValues.classId);
    const sbj = subjects.find((s) => s.id === watchedValues.subjectId);
    const tch = teachers.find((t) => t.id === watchedValues.teacherId);

    const candidate = {
      classId: watchedValues.classId,
      className: cls ? cls.name : "",
      subjectId: watchedValues.subjectId,
      subjectName: sbj ? sbj.name : "",
      teacherId: watchedValues.teacherId,
      teacherName: tch ? tch.fullName : "",
      day: watchedValues.day,
      startTime: watchedValues.startTime,
      endTime: watchedValues.endTime,
      room: watchedValues.room,
    };

    return validateScheduleConflict(
      candidate,
      isEditing && scheduleToEdit ? scheduleToEdit.id : undefined
    );
  }, [
    watchedValues,
    classes,
    subjects,
    teachers,
    validateScheduleConflict,
    isEditing,
    scheduleToEdit,
  ]);

  const onSubmit = async (data: ScheduleFormInput) => {
    if (isEditing && scheduleToEdit) {
      const res = await updateSchedule(scheduleToEdit.id, data);
      if (res.success) {
        onOpenChange(false);
      }
    } else {
      const res = await addSchedule(data);
      if (res.success) {
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <CalendarDays className="h-5 w-5" />
            <DialogTitle className="text-base font-bold">
              {isEditing ? "Edit Jadwal Pembelajaran" : "Tambah Jadwal Pembelajaran Baru"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Atur alokasi mata pelajaran, guru pengampu, hari, jam mengajar, dan ruangan presensi.
          </DialogDescription>
        </DialogHeader>

        {/* Frontend Conflict Validation Disclaimer Banner */}
        <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <span className="font-semibold">Validasi Benturan Waktu (Client-Side Mock Demo):</span>{" "}
            Sistem secara interaktif memeriksa tabrakan jadwal guru dan ruangan di level frontend.
            Pada implementasi produksi, validasi komprehensif tetap diverifikasi kembali di backend NestJS.
          </div>
        </div>

        {/* Active Conflict Warning Alert */}
        {conflictResult.hasConflict && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 p-3 text-xs text-rose-800 dark:text-rose-200 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Peringatan: Ditemukan Benturan Jadwal!</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              {conflictResult.conflicts.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
            <p className="text-[10px] text-rose-600 dark:text-rose-400 pt-1">
              Silakan ganti jam, hari, ruangan, atau pengampu untuk mencegah tumpang-tindih.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-1">
          {/* Rombel & Mapel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Rombel / Kelas <span className="text-destructive">*</span>
              </label>
              <Select
                value={watchedValues.classId}
                onValueChange={(val) => setValue("classId", val, { shouldValidate: true })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Pilih Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id} className="text-xs">
                      {cls.name} ({cls.academicYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classId && (
                <p className="text-[11px] text-destructive">{errors.classId.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Mata Pelajaran <span className="text-destructive">*</span>
              </label>
              <Select
                value={watchedValues.subjectId}
                onValueChange={(val) => {
                  setValue("subjectId", val, { shouldValidate: true });
                  // Auto-suggest first teacher of this subject if available
                  const sbj = subjects.find((s) => s.id === val);
                  if (sbj && sbj.teacherNames && sbj.teacherNames.length > 0) {
                    const matchTeacher = teachers.find(
                      (t) => t.fullName === sbj.teacherNames![0]
                    );
                    if (matchTeacher) {
                      setValue("teacherId", matchTeacher.id, { shouldValidate: true });
                    }
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Pilih Mata Pelajaran" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((sbj) => (
                    <SelectItem key={sbj.id} value={sbj.id} className="text-xs">
                      {sbj.name} ({sbj.code} • {sbj.creditHours} JP)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subjectId && (
                <p className="text-[11px] text-destructive">{errors.subjectId.message}</p>
              )}
            </div>
          </div>

          {/* Guru Pengampu */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Guru Pengampu <span className="text-destructive">*</span>
            </label>
            <Select
              value={watchedValues.teacherId}
              onValueChange={(val) => setValue("teacherId", val, { shouldValidate: true })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Pilih Guru Pengampu" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.fullName} (NIP: {t.nip})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.teacherId && (
              <p className="text-[11px] text-destructive">{errors.teacherId.message}</p>
            )}
          </div>

          {/* Hari & Ruangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Hari Pembelajaran <span className="text-destructive">*</span>
              </label>
              <Select
                value={watchedValues.day}
                onValueChange={(val: DayOfWeek) => setValue("day", val, { shouldValidate: true })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Pilih Hari" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value} className="text-xs">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Ruangan Belajar / Lab <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("room")}
                placeholder="R.101 atau Lab Komputer 1"
                className="h-8 text-xs"
              />
              {errors.room && (
                <p className="text-[11px] text-destructive">{errors.room.message}</p>
              )}
            </div>
          </div>

          {/* Jam Mulai & Selesai */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Jam Mulai (JJ:MM) <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("startTime")}
                placeholder="07:30"
                className="h-8 text-xs font-mono"
              />
              {errors.startTime && (
                <p className="text-[11px] text-destructive">
                  {errors.startTime.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Jam Selesai (JJ:MM) <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("endTime")}
                placeholder="09:00"
                className="h-8 text-xs font-mono"
              />
              {errors.endTime && (
                <p className="text-[11px] text-destructive">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              disabled={conflictResult.hasConflict}
            >
              {isEditing ? "Simpan Perubahan Jadwal" : "Tambahkan ke Kalender"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
