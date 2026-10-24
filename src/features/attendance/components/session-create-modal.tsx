"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Calendar, Clock, BookOpen, User, School, Sparkles } from "lucide-react";
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
import {
  attendanceSessionFormSchema,
  AttendanceSessionFormInput,
} from "@/lib/validators";
import { useSchoolData } from "@/contexts/school-data-context";
import { AttendanceSessionItem } from "@/types";

interface SessionCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (session: AttendanceSessionItem) => void;
}

export function SessionCreateModal({
  open,
  onOpenChange,
  onCreated,
}: SessionCreateModalProps) {
  const { classes, subjects, teachers, schedules, createSession } = useSchoolData();
  const [selectedScheduleId, setSelectedScheduleId] = React.useState<string>("");

  const activeClasses = React.useMemo(() => classes.filter((c) => !c.isArchived), [classes]);
  const activeTeachers = React.useMemo(() => teachers.filter((t) => t.status === "AKTIF"), [teachers]);
  const activeSubjects = React.useMemo(() => subjects.filter((s) => s.isActive !== false), [subjects]);

  const todayStr = React.useMemo(() => new Date().toISOString().split("T")[0], []);

  const form = useForm<AttendanceSessionFormInput>({
    resolver: zodResolver(attendanceSessionFormSchema),
    defaultValues: {
      classId: "",
      subjectId: "",
      teacherId: "",
      date: todayStr,
      startTime: "07:30",
      endTime: "09:00",
      room: "R.101",
      notes: "",
      radiusMeters: 100,
      token: Math.floor(100000 + Math.random() * 900000).toString(),
    },
  });

  // Handle template from active schedules
  const handleScheduleSelect = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    if (!scheduleId) return;

    const sched = schedules.find((s) => s.id === scheduleId);
    if (sched) {
      form.setValue("classId", sched.classId);
      form.setValue("subjectId", sched.subjectId);
      form.setValue("teacherId", sched.teacherId);
      form.setValue("startTime", sched.startTime);
      form.setValue("endTime", sched.endTime);
      form.setValue("room", sched.room);
    }
  };

  const onSubmit = async (data: AttendanceSessionFormInput) => {
    try {
      const newSession = await createSession(data);
      form.reset({
        classId: "",
        subjectId: "",
        teacherId: "",
        date: todayStr,
        startTime: "07:30",
        endTime: "09:00",
        room: "R.101",
        notes: "",
      });
      setSelectedScheduleId("");
      onOpenChange(false);
      if (onCreated) {
        onCreated(newSession);
      }
    } catch (err) {
      console.error("Gagal membuat sesi:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                Buka Sesi Presensi Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Inisialisasi sesi absensi mata pelajaran untuk rombel SMA PB Ngrayun.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Quick Schedule Selector */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Gunakan Jadwal Pembelajaran Terdaftar (Opsional)
            </span>
            {selectedScheduleId && (
              <button
                type="button"
                onClick={() => setSelectedScheduleId("")}
                className="text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                Reset Pilihan
              </button>
            )}
          </div>
          <Select value={selectedScheduleId} onValueChange={handleScheduleSelect}>
            <SelectTrigger className="text-xs h-8 bg-background">
              <SelectValue placeholder="Pilih dari jadwal pelajaran yang ada..." />
            </SelectTrigger>
            <SelectContent>
              {schedules.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  {s.day} • {s.className} - {s.subjectName} ({s.teacherName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5 pt-1">
          {/* Class & Subject */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold flex items-center gap-1">
                <School className="h-3.5 w-3.5 text-muted-foreground" />
                Rombongan Belajar (Kelas) <span className="text-destructive">*</span>
              </label>
              <Select
                value={form.watch("classId")}
                onValueChange={(val) => form.setValue("classId", val, { shouldValidate: true })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Pilih Rombel" />
                </SelectTrigger>
                <SelectContent>
                  {activeClasses.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name} ({c.studentCount} Siswa)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.classId && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.classId.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                Mata Pelajaran <span className="text-destructive">*</span>
              </label>
              <Select
                value={form.watch("subjectId")}
                onValueChange={(val) => form.setValue("subjectId", val, { shouldValidate: true })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Pilih Mapel" />
                </SelectTrigger>
                <SelectContent>
                  {activeSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name} ({s.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.subjectId && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.subjectId.message}
                </p>
              )}
            </div>
          </div>

          {/* Teacher */}
          <div className="space-y-1">
            <label className="text-xs font-semibold flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Guru Pengampu Sesi <span className="text-destructive">*</span>
            </label>
            <Select
              value={form.watch("teacherId")}
              onValueChange={(val) => form.setValue("teacherId", val, { shouldValidate: true })}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Pilih Guru Pengampu" />
              </SelectTrigger>
              <SelectContent>
                {activeTeachers.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.fullName} ({t.title})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.teacherId && (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.teacherId.message}
              </p>
            )}
          </div>

          {/* Date, Time & Room */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Tanggal Sesi <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                className="text-xs h-9"
                {...form.register("date")}
              />
              {form.formState.errors.date && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.date.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Jam Pembelajaran <span className="text-destructive">*</span>
              </label>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  placeholder="07:30"
                  className="text-xs h-9 px-2 text-center"
                  {...form.register("startTime")}
                />
                <span className="text-xs text-muted-foreground">-</span>
                <Input
                  type="text"
                  placeholder="09:00"
                  className="text-xs h-9 px-2 text-center"
                  {...form.register("endTime")}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">
                Ruang Kelas <span className="text-destructive">*</span>
              </label>
              <Input
                type="text"
                placeholder="R.101"
                className="text-xs h-9"
                {...form.register("room")}
              />
              {form.formState.errors.room && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.room.message}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold">
              Catatan / Pokok Bahasan (Opsional)
            </label>
            <Textarea
              rows={2}
              placeholder="Contoh: Pertemuan ke-4, Pembahasan Bab 3 Eksponen..."
              className="text-xs resize-none"
              {...form.register("notes")}
            />
          </div>

          {/* Token & Radius Geofence */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
            <div className="space-y-1">
              <label className="text-xs font-semibold flex items-center justify-between">
                <span>Batas Radius GPS</span>
                <span className="text-[10px] text-muted-foreground font-normal">Geofence</span>
              </label>
              <Select
                value={form.watch("radiusMeters")?.toString() || "100"}
                onValueChange={(val) => form.setValue("radiusMeters", parseInt(val, 10))}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Pilih Radius" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 Meter (Dalam Kelas)</SelectItem>
                  <SelectItem value="50">50 Meter (Blok Kelas)</SelectItem>
                  <SelectItem value="100">100 Meter (Area Sekolah)</SelectItem>
                  <SelectItem value="250">250 Meter (Kampus Luas)</SelectItem>
                  <SelectItem value="0">Bebas (Tanpa Batas Radius)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold flex items-center justify-between">
                <span>Token Presensi 6-Digit</span>
                <button
                  type="button"
                  onClick={() => {
                    const newToken = Math.floor(100000 + Math.random() * 900000).toString();
                    form.setValue("token", newToken);
                  }}
                  className="text-[10px] text-primary hover:underline font-normal"
                >
                  Acak Ulang
                </button>
              </label>
              <Input
                type="text"
                maxLength={6}
                placeholder="6-digit token..."
                className="text-xs h-9 font-mono tracking-widest text-center font-bold"
                {...form.register("token")}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" className="gap-1.5">
              <PlusCircle className="h-4 w-4" />
              Buka Sesi Presensi
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
