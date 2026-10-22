"use client";

import * as React from "react";
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  Plus,
  BookOpen,
  School,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { useDemoRole } from "@/contexts/demo-role-context";
import { toast } from "sonner";

export function StudentDashboardView() {
  const { currentUser } = useDemoRole();
  const [newPermRequested, setNewPermRequested] = React.useState(false);

  const handleApplyPermission = () => {
    setNewPermRequested(true);
    toast.success("Form pengajuan izin siswa dibuka. Silakan unggah surat keterangan.");
  };

  return (
    <div className="space-y-6">
      {/* Student Profile Card Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0F766E] via-[#115E59] to-[#14B8A6] p-6 text-white shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-0.5 text-xs font-semibold backdrop-blur-md border border-white/10">
              <CreditCard className="h-3.5 w-3.5 text-emerald-300" />
              <span>Kartu RFID Siswa: 73 A4 19 B2 (Aktif)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Halo, {currentUser.name}!
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100">
              NIS: {currentUser.identifier} &bull; Kelas X MIPA 1 &bull; SMA Pemberdayaan Bangsa Ngrayun
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="rounded-xl bg-white/10 p-3 backdrop-blur-md border border-white/10 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-200">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Status Hari Ini:</span>
              </div>
              <p className="font-bold text-white mt-0.5">
                Hadir Tepat Waktu (06:48 WIB)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Attendance Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Kehadiran Semester Ini"
          value="97.5%"
          subtitle="Total 41 Hari Efektif"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Hadir Tepat Waktu"
          value="39 Hari"
          subtitle="Kedatangan sebelum 07:00"
          icon={Clock}
          variant="primary"
        />
        <StatCard
          title="Terlambat"
          value="1 Hari"
          subtitle="Toleransi maksimal 3x/semester"
          icon={AlertCircle}
          variant="warning"
        />
        <StatCard
          title="Izin & Sakit Resmi"
          value="2 Hari"
          subtitle="Alpa: 0 Hari (Disiplin)"
          icon={FileCheck2}
          variant="neutral"
        />
      </div>

      {/* 2-Columns: Class Schedule Today & Permission Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Schedule Today */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  Jadwal Pelajaran Kelas X MIPA 1 Hari Ini
                </CardTitle>
                <CardDescription className="text-xs">
                  Kamis, 15 Oktober 2026 &bull; Ruang R.101
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-[10px]">
                3 Mata Pelajaran
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs">
              <div className="space-y-1">
                <span className="font-mono text-[11px] font-bold text-emerald-700">
                  07:30 - 09:00 WIB
                </span>
                <p className="font-bold text-foreground text-[13px]">
                  Matematika Wajib
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Guru: Siti Rahmawati, S.Pd. &bull; Ruang R.101
                </p>
              </div>
              <Badge variant="hadir" className="text-[10px]">
                Selesai
              </Badge>
            </div>

            <div className="flex items-start justify-between p-3 rounded-xl border border-primary/30 bg-primary/5 text-xs">
              <div className="space-y-1">
                <span className="font-mono text-[11px] font-bold text-primary">
                  09:15 - 10:45 WIB
                </span>
                <p className="font-bold text-foreground text-[13px]">
                  Informatika & Pemrograman Dasar
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Guru: Agus Santoso, S.Kom. &bull; Lab Komputer 1
                </p>
              </div>
              <Badge variant="navy" className="text-[10px] animate-pulse">
                Berlangsung
              </Badge>
            </div>

            <div className="flex items-start justify-between p-3 rounded-xl border border-border bg-muted/20 text-xs">
              <div className="space-y-1">
                <span className="font-mono text-[11px] font-bold text-muted-foreground">
                  11:00 - 12:30 WIB
                </span>
                <p className="font-bold text-foreground text-[13px]">
                  Fisika Peminatan
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Guru: Eko Prasetyo, S.Pd. &bull; Lab Fisika
                </p>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                Akan Datang
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* My Permission Requests Status */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">
                  Status Pengajuan Izin Milik Saya
                </CardTitle>
                <CardDescription className="text-xs">
                  Riwayat permohonan izin dan verifikasi surat dokter
                </CardDescription>
              </div>
              <Button
                size="sm"
                onClick={handleApplyPermission}
                className="text-xs h-8 gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Ajukan Izin</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Permission 1: Pending */}
            <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">
                  Izin Mengikuti Lomba OSN Matematika
                </span>
                <Badge variant="terlambat" className="text-[10px]">
                  Menunggu Verifikasi
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tanggal: 17 Oktober 2026 (1 Hari) &bull; Surat Tugas Sekolah terlampir
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-300 italic">
                *Sedang ditinjau oleh Wali Kelas (Siti Rahmawati, S.Pd.)
              </p>
            </div>

            {/* Permission 2: Approved */}
            <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">
                  Izin Sakit (Demam & Flu)
                </span>
                <Badge variant="hadir" className="text-[10px]">
                  Disetujui
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tanggal: 28 September 2026 (1 Hari) &bull; Surat Dokter Puskesmas Ngrayun
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                Disetujui oleh: Tim BK / Wali Kelas pada 28 Sep 2026 08:30 WIB
              </p>
            </div>

            {newPermRequested && (
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 text-xs text-primary animate-in fade-in">
                <p className="font-semibold">Formulir Baru Dibuka:</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Anda dapat melampirkan foto surat dokter atau surat izin orang tua di loket piket atau menghubungi wali kelas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RFID Log Tap 5 Days History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">
            Riwayat Log Presensi RFID Kartu Siswa (5 Hari Terakhir)
          </CardTitle>
          <CardDescription className="text-xs">
            Catatan jam tap masuk dan tap pulang di mesin Kiosk Gerbang Utama
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Hari / Tanggal</th>
                  <th className="py-2.5 px-3 font-semibold">Tap Masuk</th>
                  <th className="py-2.5 px-3 font-semibold">Tap Pulang</th>
                  <th className="py-2.5 px-3 font-semibold">Status Kehadiran</th>
                  <th className="py-2.5 px-3 font-semibold">Titik Mesin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                <tr className="hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-semibold text-foreground">Kamis, 15 Okt 2026</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">06:48:12 WIB</td>
                  <td className="py-2.5 px-3 font-mono text-muted-foreground">--:-- WIB</td>
                  <td className="py-2.5 px-3"><Badge variant="hadir" className="text-[9px]">Hadir Tepat Waktu</Badge></td>
                  <td className="py-2.5 px-3 text-muted-foreground">Gate Utama (RFID Kiosk 1)</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-semibold text-foreground">Rabu, 14 Okt 2026</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">06:50:45 WIB</td>
                  <td className="py-2.5 px-3 font-mono text-foreground font-semibold">14:32:10 WIB</td>
                  <td className="py-2.5 px-3"><Badge variant="hadir" className="text-[9px]">Hadir Tepat Waktu</Badge></td>
                  <td className="py-2.5 px-3 text-muted-foreground">Gate Utama (RFID Kiosk 1)</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-semibold text-foreground">Selasa, 13 Okt 2026</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">06:45:18 WIB</td>
                  <td className="py-2.5 px-3 font-mono text-foreground font-semibold">14:30:22 WIB</td>
                  <td className="py-2.5 px-3"><Badge variant="hadir" className="text-[9px]">Hadir Tepat Waktu</Badge></td>
                  <td className="py-2.5 px-3 text-muted-foreground">Gate Utama (RFID Kiosk 2)</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-semibold text-foreground">Senin, 12 Okt 2026</td>
                  <td className="py-2.5 px-3 font-mono text-amber-600 font-bold">07:08:44 WIB</td>
                  <td className="py-2.5 px-3 font-mono text-foreground font-semibold">14:35:10 WIB</td>
                  <td className="py-2.5 px-3"><Badge variant="terlambat" className="text-[9px]">Terlambat 8 Mnt</Badge></td>
                  <td className="py-2.5 px-3 text-muted-foreground">Pintu Barat (RFID Kiosk 3)</td>
                </tr>
                <tr className="hover:bg-muted/20">
                  <td className="py-2.5 px-3 font-semibold text-foreground">Jumat, 09 Okt 2026</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-600 font-bold">06:42:05 WIB</td>
                  <td className="py-2.5 px-3 font-mono text-foreground font-semibold">11:35:12 WIB</td>
                  <td className="py-2.5 px-3"><Badge variant="hadir" className="text-[9px]">Hadir Tepat Waktu</Badge></td>
                  <td className="py-2.5 px-3 text-muted-foreground">Gate Utama (RFID Kiosk 1)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
