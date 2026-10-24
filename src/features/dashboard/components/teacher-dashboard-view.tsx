"use client";

import * as React from "react";
import {
  CalendarDays,
  Clock,
  BookOpen,
  School,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Users,
  Send,
  FileSpreadsheet,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { useDemoRole } from "@/contexts/demo-role-context";
import { toast } from "sonner";
import { TeacherAttendanceCard } from "./teacher-attendance-card";

export function TeacherDashboardView() {
  const { currentUser } = useDemoRole();
  const [absenDone, setAbsenDone] = React.useState(false);

  const handleQuickAttendance = () => {
    setAbsenDone(true);
    toast.success("Presensi kelas XI MIPA 1 (Sesi Jam 3-4) berhasil dicatat dan disinkronkan.");
  };

  return (
    <div className="space-y-6">
      {/* Teacher Profile Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-4 sm:p-6 text-white shadow-sm border border-blue-700/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs font-medium backdrop-blur-md border border-white/10">
              <BookOpen className="h-3.5 w-3.5 text-blue-200" />
              <span>Portal Guru Pengampu & Wali Kelas</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Selamat Bertugas, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-200">
              NIP: {currentUser.identifier} &bull; Guru Matematika &bull; Wali Kelas XI MIPA 1
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Mengunduh jurnal mengajar format Excel...")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Jurnal Mengajar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Teacher Daily Attendance Card */}
      <TeacherAttendanceCard />

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Sesi Mengajar Hari Ini"
          value="3 Sesi"
          subtitle="Total 6 Jam Pembelajaran"
          icon={CalendarDays}
          variant="primary"
        />
        <StatCard
          title="Kelas Perlu Diabsen"
          value={absenDone ? "0 Sesi" : "1 Sesi"}
          subtitle={absenDone ? "Semua sesi diabsen" : "XI MIPA 1 belum diabsen"}
          icon={AlertCircle}
          variant={absenDone ? "success" : "warning"}
        />
        <StatCard
          title="Kehadiran Kelas Perwalian"
          value="94.1%"
          subtitle="Kelas XI MIPA 1 (31/34 Hadir)"
          icon={UserCheck}
          variant="success"
        />
        <StatCard
          title="Izin Kelas Perwalian"
          value="3 Siswa"
          subtitle="2 Izin, 1 Sakit"
          icon={Users}
          variant="neutral"
        />
      </div>

      {/* Urgent Alert: Class Needs Attendance */}
      {!absenDone && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-4 sm:p-5 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-200 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Kelas yang Perlu Diabsen Saat Ini</h3>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
                Sesi Jam 3-4 (09:15 - 10:45 WIB) &bull; <strong>Matematika Peminatan</strong> di <strong>Ruang R.201 (Kelas XI MIPA 1)</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:self-center shrink-0">
            <Button
              onClick={handleQuickAttendance}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 px-4 shadow"
            >
              Catat Kehadiran Sekarang
            </Button>
          </div>
        </div>
      )}

      {/* 2-Columns: Teaching Schedules Today & Homeroom Advisory Recap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teaching Schedules Today */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  Jadwal Mengajar Hari Ini (Kamis)
                </CardTitle>
                <CardDescription className="text-xs">
                  Daftar kelas dan alokasi jam mengajar aktif
                </CardDescription>
              </div>
              <Link
                href="/schedules"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Lihat Lengkap</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Session 1 */}
            <div className="flex items-start justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-background">
                    Jam 1-2 &bull; 07:30 - 09:00
                  </Badge>
                  <span className="font-bold text-foreground">X MIPA 1</span>
                </div>
                <p className="font-medium text-foreground text-[13px]">
                  Matematika Wajib (Aljabar & Persamaan)
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <School className="h-3 w-3" />
                  Ruang R.101 &bull; 32 Siswa
                </p>
              </div>
              <Badge variant="hadir" className="text-[10px]">
                Selesai Diabsen
              </Badge>
            </div>

            {/* Session 2 */}
            <div
              className={`flex items-start justify-between p-3 rounded-xl border text-xs transition-colors ${
                absenDone
                  ? "border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20"
                  : "border-amber-300 bg-amber-50/50 dark:bg-amber-950/30"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-background">
                    Jam 3-4 &bull; 09:15 - 10:45
                  </Badge>
                  <span className="font-bold text-foreground">XI MIPA 1</span>
                </div>
                <p className="font-medium text-foreground text-[13px]">
                  Matematika Peminatan (Trigonometri Analitik)
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <School className="h-3 w-3" />
                  Ruang R.201 &bull; 34 Siswa
                </p>
              </div>
              {absenDone ? (
                <Badge variant="hadir" className="text-[10px]">
                  Selesai Diabsen
                </Badge>
              ) : (
                <Badge variant="terlambat" className="text-[10px] animate-pulse">
                  Perlu Diabsen
                </Badge>
              )}
            </div>

            {/* Session 3 */}
            <div className="flex items-start justify-between p-3 rounded-xl border border-border bg-muted/20 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] bg-background">
                    Jam 5-6 &bull; 11:00 - 12:30
                  </Badge>
                  <span className="font-bold text-foreground">XII MIPA 1</span>
                </div>
                <p className="font-medium text-foreground text-[13px]">
                  Matematika Peminatan (Kalkulus Integral)
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <School className="h-3 w-3" />
                  Ruang R.301 &bull; 33 Siswa
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                Akan Datang
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Homeroom Class Recap (Kelas Perwalian XI MIPA 1) */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold">
                    Rekap Kelas Perwalian (XI MIPA 1)
                  </CardTitle>
                  <Badge variant="navy" className="text-[10px]">
                    Wali Kelas
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Monitoring kehadiran siswa binaan hari ini
                </CardDescription>
              </div>
              <Link
                href="/classes"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Buku Rombel</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 4 Mini Stats for Homeroom */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2 border border-emerald-200">
                <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">Hadir</span>
                <p className="text-base font-bold text-emerald-700 font-mono mt-0.5">31</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-2 border border-amber-200">
                <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300">Terlambat</span>
                <p className="text-base font-bold text-amber-700 font-mono mt-0.5">1</p>
              </div>
              <div className="rounded-lg bg-sky-50 dark:bg-sky-950/40 p-2 border border-sky-200">
                <span className="text-[10px] font-semibold text-sky-800 dark:text-sky-300">Izin/Sakit</span>
                <p className="text-base font-bold text-sky-700 font-mono mt-0.5">3</p>
              </div>
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-2 border border-rose-200">
                <span className="text-[10px] font-semibold text-rose-800 dark:text-rose-300">Alpa</span>
                <p className="text-base font-bold text-rose-700 font-mono mt-0.5">0</p>
              </div>
            </div>

            {/* List of absent / special note students in homeroom */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Siswa Berhalangan / Membutuhkan Perhatian (3 Siswa):
              </p>

              <div className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-foreground">Rendi Saputra</p>
                  <p className="text-[11px] text-muted-foreground">Izin: Mewakili lomba pidato bahasa daerah</p>
                </div>
                <Badge variant="izin" className="text-[9px]">IZIN</Badge>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-foreground">Anisa Rahmawati</p>
                  <p className="text-[11px] text-muted-foreground">Izin: Kepentingan keluarga mendesak</p>
                </div>
                <Badge variant="izin" className="text-[9px]">IZIN</Badge>
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-muted/20 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-foreground">Fajar Hidayat</p>
                  <p className="text-[11px] text-muted-foreground">Sakit: Demam tinggi (Surat dokter terlampir)</p>
                </div>
                <Badge variant="sakit" className="text-[9px]">SAKIT</Badge>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success("Notifikasi pesan konfirmasi telah dikirim ke wali murid kelas XI MIPA 1.")}
                className="text-xs gap-1.5 h-8"
              >
                <Send className="h-3.5 w-3.5 text-primary" />
                <span>Kirim Broadcast ke Wali Murid</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
