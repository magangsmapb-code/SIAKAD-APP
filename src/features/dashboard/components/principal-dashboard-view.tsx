"use client";

import * as React from "react";
import {
  Award,
  TrendingUp,
  FileCheck2,
  FileText,
  Printer,
  Download,
  Users,
  GraduationCap,
  School,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { AttendanceChart } from "./attendance-chart";
import { useDemoRole } from "@/contexts/demo-role-context";
import { INSTITUTION } from "@/lib/constants";
import { toast } from "sonner";

export function PrincipalDashboardView() {
  const { academicYear } = useDemoRole();

  const handleExportPDF = () => {
    toast.success("Mempersiapkan dokumen Laporan Eksekutif Mutu Presensi (PDF)...");
  };

  const handleSendReport = () => {
    toast.info("Laporan ringkas kehadiran resmi dikirim ke Cabang Dinas Pendidikan Ponorogo.");
  };

  return (
    <div className="space-y-6">
      {/* Principal Executive Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#042F2E] via-[#0F766E] to-[#115E59] p-6 text-white shadow-card border border-teal-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 text-amber-300 px-3 py-0.5 text-xs font-semibold backdrop-blur-md border border-amber-400/30">
              <Award className="h-3.5 w-3.5" />
              <span>Laporan Ringkasan Eksekutif Kepala Sekolah</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Dashboard Mutu Kehadiran & Tata Kelola Sekolah
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Pemantauan agregat kehadiran 192 siswa dan 14 tenaga pendidik {INSTITUTION.name} Tahun Ajaran {academicYear}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span>Unduh Rekap Eksekutif</span>
            </Button>
            <Button
              size="sm"
              onClick={handleSendReport}
              className="bg-primary hover:bg-primary-hover text-white text-xs gap-1.5 shadow"
            >
              <Printer className="h-4 w-4" />
              <span>Kirim ke Cabdin</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Aggregate Executive KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Kehadiran Siswa Sekolah"
          value="96.4%"
          subtitle="Target Mutu Sekolah: 95%"
          icon={TrendingUp}
          variant="success"
          trend={{ value: "+1.4% di atas target", isPositive: true }}
        />
        <StatCard
          title="Kedisiplinan Guru & Staf"
          value="100%"
          subtitle="14 dari 14 Hadir Tepat Waktu"
          icon={GraduationCap}
          variant="success"
          trend={{ value: "Nol keterlambatan", isPositive: true }}
        />
        <StatCard
          title="Ketepatan Waktu Siswa"
          value="94.6%"
          subtitle="Siswa hadir sebelum 07:00 WIB"
          icon={ShieldCheck}
          variant="primary"
        />
        <StatCard
          title="Perizinan Terverifikasi"
          value="10 Siswa"
          subtitle="6 Izin, 4 Sakit Berkas Lengkap"
          icon={FileCheck2}
          variant="neutral"
        />
      </div>

      {/* Charts & Grade-Level Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceChart />
        </div>

        {/* Grade-Level Breakdown Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              Kinerja Kehadiran per Tingkat
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi kepatuhan presensi kelas X, XI, dan XII
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Level X */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Kelas X (3 Rombel)</span>
                <span className="font-bold font-mono text-emerald-600">96.8%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "96.8%" }} />
              </div>
              <p className="text-[10px] text-muted-foreground">94 dari 97 siswa hadir tepat waktu</p>
            </div>

            {/* Level XI */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Kelas XI (2 Rombel)</span>
                <span className="font-bold font-mono text-blue-600">95.4%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "95.4%" }} />
              </div>
              <p className="text-[10px] text-muted-foreground">62 dari 65 siswa hadir tepat waktu</p>
            </div>

            {/* Level XII */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">Kelas XII (1 Rombel)</span>
                <span className="font-bold font-mono text-emerald-600">97.0%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "97%" }} />
              </div>
              <p className="text-[10px] text-muted-foreground">32 dari 33 siswa hadir tepat waktu</p>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Seluruh tingkat kelas melampaui indikator mutu minimal (95%).</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Early Warning / BK Assistance Table & Permissions Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Early Warning: Students Needing Attention */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Siswa Membutuhkan Bimbingan Konseling</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Siswa dengan akumulasi alpa atau keterlambatan berulang
                </CardDescription>
              </div>
              <Link
                href="/students"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Data Siswa</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Dimas Prasetyo</p>
                <p className="text-[11px] text-muted-foreground">NIS: 20241012 &bull; Kelas X IPS 1</p>
                <span className="text-[10px] text-rose-600 font-medium">3 Hari Alpa Bulan Ini</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Disposisi diteruskan ke Koordinator BK.")}
                className="text-xs h-7 px-2.5"
              >
                Disposisi BK
              </Button>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20 flex items-center justify-between">
              <div>
                <p className="font-bold text-foreground">Galih Firmansyah</p>
                <p className="text-[11px] text-muted-foreground">NIS: 20241018 &bull; Kelas XI IPS 1</p>
                <span className="text-[10px] text-amber-600 font-medium">4x Terlambat Berturut-turut</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info("Pemberitahuan panggilan ortu disiapkan.")}
                className="text-xs h-7 px-2.5"
              >
                Surat Panggilan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Executive Action Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">
              Kepatuhan & Verifikasi Presensi
            </CardTitle>
            <CardDescription className="text-xs">
              Audit sistem RFID dan rekap kehadiran resmi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Status Gerbang RFID Kiosk:</span>
                <Badge variant="hadir" className="text-[10px]">Normal & Terhubung</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Persentase Tap RFID Masuk:</span>
                <span className="font-bold font-mono text-foreground">98.2% (189/192)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Verifikasi Manual oleh Guru Piket:</span>
                <span className="font-bold font-mono text-foreground">3 Siswa</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-muted-foreground">Tingkat Akurasi Sinkronisasi:</span>
                <span className="font-bold font-mono text-emerald-600">100% (Nol Duplikasi)</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/reports">
                <Button className="w-full text-xs h-9 gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Buka Lembar Rekapitulasi Laporan Lengkap</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
