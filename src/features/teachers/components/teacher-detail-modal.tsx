"use client";

import * as React from "react";
import {
  GraduationCap,
  Mail,
  Phone,
  BookOpen,
  CalendarDays,
  Clock,
  MapPin,
  Edit,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Teacher } from "@/types";
import { useSchoolData } from "@/contexts/school-data-context";

interface TeacherDetailModalProps {
  teacher: Teacher | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (teacher: Teacher) => void;
}

export function TeacherDetailModal({
  teacher,
  open,
  onOpenChange,
  onEdit,
}: TeacherDetailModalProps) {
  const { schedules } = useSchoolData();

  if (!teacher) return null;

  // Find all teaching schedules for this teacher
  const teacherSchedules = schedules.filter(
    (s) => s.teacherId === teacher.id || s.teacherName === teacher.fullName
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border border-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {teacher.fullName
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <DialogTitle className="text-base font-bold text-foreground truncate">
                {teacher.fullName}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                NIP: {teacher.nip} • {teacher.title}
              </DialogDescription>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="navy" className="text-[10px]">
                  {teacher.role.replace("_", " ")}
                </Badge>
                {teacher.isHomeroom && (
                  <Badge variant="hadir" className="text-[10px]">
                    Wali Kelas {teacher.assignedClass}
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
                  className="text-[10px]"
                >
                  {teacher.status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Identity & Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3 text-primary" />
                Email Sekolah:
              </span>
              <p className="font-semibold text-foreground truncate">{teacher.email}</p>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3 text-emerald-600" />
                Nomor Telepon / WhatsApp:
              </span>
              <p className="font-semibold font-mono text-primary">{teacher.phone}</p>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-1">
              <span className="text-muted-foreground">NUPTK:</span>
              <p className="font-mono font-semibold text-foreground">
                {teacher.nuptk || "Belum Terdaftar"}
              </p>
            </div>

            <div className="rounded-lg border border-border p-3 space-y-1">
              <span className="text-muted-foreground">Status Wali Kelas:</span>
              <p className="font-semibold text-foreground">
                {teacher.isHomeroom
                  ? `Aktif di Rombel ${teacher.assignedClass}`
                  : "Tidak Ditugaskan"}
              </p>
            </div>
          </div>

          {/* Subjects Taught */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <span className="text-muted-foreground flex items-center gap-1 font-semibold">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
              Mata Pelajaran yang Diampu:
            </span>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {teacher.subjects && teacher.subjects.length > 0 ? (
                teacher.subjects.map((subj) => (
                  <Badge key={subj} variant="secondary" className="text-[11px]">
                    {subj}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">Belum ada mapel terdaftar</span>
              )}
            </div>
          </div>

          {/* Teaching Schedule List */}
          <div className="rounded-lg border border-border p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5 font-semibold">
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                Jadwal Mengajar Mingguan ({teacherSchedules.length} Sesi Terjadwal):
              </span>
            </div>

            {teacherSchedules.length === 0 ? (
              <p className="text-[11px] text-muted-foreground py-2 text-center bg-muted/30 rounded-md">
                Belum ada jadwal mengajar yang terplot pada kalender akademik aktif.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-border/60">
                {teacherSchedules.map((sch) => (
                  <div
                    key={sch.id}
                    className="pt-2 first:pt-0 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">
                          {sch.subjectName}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {sch.className}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="h-2.5 w-2.5 text-primary" />
                          {sch.day}, {sch.startTime} - {sch.endTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5 text-amber-500" />
                          {sch.room}
                        </span>
                      </div>
                    </div>

                    <Badge variant="hadir" className="text-[9px]">
                      Terplot
                    </Badge>
                  </div>
                ))}
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
                onEdit(teacher);
              }}
            >
              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              Edit Data Guru
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
