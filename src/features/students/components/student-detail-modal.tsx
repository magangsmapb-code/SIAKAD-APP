"use client";

import * as React from "react";
import {
  CreditCard,
  Phone,
  MapPin,
  ShieldCheck,
  History,
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
import { Student } from "@/types";

export interface StudentDetailModalProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (student: Student) => void;
}

export function StudentDetailModal({
  student,
  open,
  onOpenChange,
  onEdit,
}: StudentDetailModalProps) {
  if (!student) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "AKTIF":
        return "hadir";
      case "NON_AKTIF":
        return "alpa";
      case "MUTASI":
        return "izin";
      case "LULUS":
        return "terlambat";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base">
              {student.fullName
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-base font-bold">{student.fullName}</DialogTitle>
              <DialogDescription className="text-xs">
                NIS: {student.nis} • NISN: {student.nisn} • {student.className}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Status & RFID Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/50 p-3 border border-border">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Status Keaktifan:</span>
              <Badge variant={getStatusBadgeVariant(student.status)} className="text-[10px]">
                {student.status.replace("_", " ")}
              </Badge>
              {student.academicYear && (
                <Badge variant="outline" className="text-[10px]">
                  T.A. {student.academicYear}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span>UID: {student.rfidCardUid || "Belum Terdaftar"}</span>
            </div>
          </div>

          {/* Academic & Personal Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border p-3 space-y-1">
              <span className="text-muted-foreground">Jenis Kelamin:</span>
              <p className="font-semibold text-foreground">
                {student.gender === "L" ? "Laki-laki (L)" : "Perempuan (P)"}
              </p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <span className="text-muted-foreground">Rombongan Belajar:</span>
              <p className="font-semibold text-foreground">{student.className}</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <span className="text-muted-foreground">Orang Tua / Wali:</span>
              <p className="font-semibold text-foreground">{student.parentName}</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <span className="text-muted-foreground">No. Telepon Orang Tua:</span>
              <p className="font-semibold font-mono text-primary flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {student.parentPhone}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="rounded-lg border border-border p-3 space-y-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Alamat Domisili Siswa:
            </span>
            <p className="font-medium text-foreground">{student.address}</p>
          </div>

          {/* Class History / Riwayat Kelas */}
          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
              <History className="h-3.5 w-3.5 text-primary" />
              <span>Riwayat Kelas & Penempatan:</span>
            </div>
            {student.classHistory && student.classHistory.length > 0 ? (
              <div className="space-y-1.5 divide-y divide-border/60">
                {student.classHistory.map((hist, idx) => (
                  <div key={idx} className="pt-1.5 first:pt-0 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-foreground">{hist.className}</span>
                      {hist.note && (
                        <span className="block text-[10px] text-muted-foreground">
                          {hist.note}
                        </span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {hist.year}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                Siswa baru terdaftar di rombel {student.className} (Tahun Ajaran {student.academicYear || "2026/2027"}).
              </p>
            )}
          </div>

          {/* RFID Status Note */}
          <div className="flex items-center gap-2 text-muted-foreground bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-md text-[11px] border border-blue-200/50">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>
              Data kesiswaan telah tersinkronisasi dengan terminal presensi RFID SMA PB Ngrayun.
            </span>
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
                onEdit(student);
              }}
            >
              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              Edit Data
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
