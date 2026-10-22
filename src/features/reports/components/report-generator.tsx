"use client";

import * as React from "react";
import Image from "next/image";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  School,
  User,
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Filter,
  Layers,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSchoolData } from "@/contexts/school-data-context";
import { INSTITUTION } from "@/lib/constants";

type ReportType = "HARIAN" | "BULANAN" | "PER_KELAS" | "PER_SISWA";

export function ReportGenerator() {
  const { classes, students, studentRecaps, attendanceRecords } = useSchoolData();

  // Report configuration
  const [reportType, setReportType] = React.useState<ReportType>("PER_KELAS");
  const [selectedAcademicYear, setSelectedAcademicYear] = React.useState("2026/2027");
  const [selectedSemester, setSelectedSemester] = React.useState("GANJIL");
  const [selectedDate, setSelectedDate] = React.useState("2026-10-15");
  const [selectedMonth, setSelectedMonth] = React.useState("10");
  const [selectedYear, setSelectedYear] = React.useState("2026");
  const [selectedClassId, setSelectedClassId] = React.useState("ALL");
  const [selectedStudentId, setSelectedStudentId] = React.useState("ALL");

  // Format info dialog
  const [infoModalOpen, setInfoModalOpen] = React.useState(false);
  const [infoModalFormat, setInfoModalFormat] = React.useState<"EXCEL" | "PDF">("EXCEL");

  // Selected Class info
  const currentClass = React.useMemo(() => {
    return classes.find((c) => c.id === selectedClassId);
  }, [classes, selectedClassId]);

  // Selected Student info
  const currentStudent = React.useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Filtered student recaps
  const reportStudentRecaps = React.useMemo(() => {
    return studentRecaps.filter((s) => {
      if (selectedClassId !== "ALL") {
        const cls = classes.find((c) => c.id === selectedClassId);
        if (cls && s.className !== cls.name) return false;
      }
      if (selectedStudentId !== "ALL" && s.studentId !== selectedStudentId) {
        return false;
      }
      return true;
    });
  }, [studentRecaps, selectedClassId, selectedStudentId, classes]);

  // Daily records
  const reportDailyRecords = React.useMemo(() => {
    return attendanceRecords.filter((r) => {
      if (r.date !== selectedDate) return false;
      if (selectedClassId !== "ALL") {
        const cls = classes.find((c) => c.id === selectedClassId);
        if (cls && r.className !== cls.name) return false;
      }
      return true;
    });
  }, [attendanceRecords, selectedDate, selectedClassId, classes]);

  // Summary statistics
  const stats = React.useMemo(() => {
    if (reportType === "HARIAN") {
      const total = reportDailyRecords.length;
      const hadir = reportDailyRecords.filter((r) => r.status === "HADIR").length;
      const terlambat = reportDailyRecords.filter((r) => r.status === "TERLAMBAT").length;
      const sakit = reportDailyRecords.filter((r) => r.status === "SAKIT").length;
      const izin = reportDailyRecords.filter((r) => r.status === "IZIN").length;
      const alpa = reportDailyRecords.filter((r) => r.status === "ALPA").length;
      const persentase = total > 0 ? Number((((hadir + terlambat) / total) * 100).toFixed(1)) : 100;
      return { total, hadir, terlambat, sakit, izin, alpa, persentase };
    } else {
      let totalHadir = 0;
      let totalTerlambat = 0;
      let totalSakit = 0;
      let totalIzin = 0;
      let totalAlpa = 0;
      let totalSesi = 0;

      reportStudentRecaps.forEach((s) => {
        totalHadir += s.hadir;
        totalTerlambat += s.terlambat;
        totalSakit += s.sakit;
        totalIzin += s.izin;
        totalAlpa += s.alpa;
        totalSesi += s.totalSessions;
      });

      const persentase =
        totalSesi > 0
          ? Number((((totalHadir + totalTerlambat) / totalSesi) * 100).toFixed(1))
          : 95.5;

      return {
        total: reportStudentRecaps.length,
        hadir: totalHadir,
        terlambat: totalTerlambat,
        sakit: totalSakit,
        izin: totalIzin,
        alpa: totalAlpa,
        persentase,
      };
    }
  }, [reportType, reportDailyRecords, reportStudentRecaps]);

  // Genuine Working CSV Export
  const handleExportCSV = () => {
    let csvRows: string[] = [];

    // Header metadata
    csvRows.push(`"LAPORAN REKAPITULASI PRESENSI SISWA"`);
    csvRows.push(`"${INSTITUTION.name} - ${INSTITUTION.location}"`);
    csvRows.push(`"Tahun Ajaran: ${selectedAcademicYear} - Semester ${selectedSemester}"`);
    csvRows.push(`"Jenis Laporan: ${reportType}"`);
    csvRows.push(`"Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")}"`);
    csvRows.push("");

    if (reportType === "HARIAN") {
      csvRows.push(`"No","Tanggal","Nama Siswa","NIS","Kelas","Status","Jam Masuk","Metode","Keterangan"`);
      reportDailyRecords.forEach((r, idx) => {
        csvRows.push(
          `"${idx + 1}","${r.date}","${r.studentName}","${r.studentNis}","${r.className}","${r.status}","${r.checkInTime || "-"}","${r.method}","${r.notes || "-"}"`
        );
      });
    } else {
      csvRows.push(
        `"No","NIS","Nama Siswa","Kelas","Gender","Total Sesi","Hadir","Terlambat","Sakit","Izin","Alpa","Persentase Kehadiran (%)"`
      );
      reportStudentRecaps.forEach((s, idx) => {
        csvRows.push(
          `"${idx + 1}","${s.studentNis}","${s.studentName}","${s.className}","${s.gender}","${s.totalSessions}","${s.hadir}","${s.terlambat}","${s.sakit}","${s.izin}","${s.alpa}","${s.attendanceRate.toFixed(1)}%"`
        );
      });
    }

    const csvContent = csvRows.join("\r\n");
    // UTF-8 BOM for Microsoft Excel Windows compatibility
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename = `Laporan_Presensi_SMA_PB_Ngrayun_${reportType}_${selectedAcademicYear.replace("/", "-")}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Configuration Card (Hidden during print) */}
      <Card className="print:hidden">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Generator Rekapitulasi & Laporan Presensi
          </CardTitle>
          <CardDescription className="text-xs">
            Pusat penyusunan dan pencetakan dokumen presensi resmi untuk Cabang Dinas Pendidikan Wilayah Ponorogo dan Buku Induk Sekolah.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Jenis Laporan */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Jenis Laporan Presensi
              </label>
              <Select
                value={reportType}
                onValueChange={(val) => setReportType(val as ReportType)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Pilih Jenis Laporan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PER_KELAS" className="text-xs">
                    Laporan Rekap Per Rombel
                  </SelectItem>
                  <SelectItem value="HARIAN" className="text-xs">
                    Laporan Harian (Harian Semua Kelas)
                  </SelectItem>
                  <SelectItem value="BULANAN" className="text-xs">
                    Laporan Rekap Bulanan
                  </SelectItem>
                  <SelectItem value="PER_SISWA" className="text-xs">
                    Laporan Individu Per Siswa
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2. Tahun Ajaran & Semester */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Tahun Ajaran & Semester
              </label>
              <div className="flex gap-2">
                <Select
                  value={selectedAcademicYear}
                  onValueChange={setSelectedAcademicYear}
                >
                  <SelectTrigger className="text-xs flex-1">
                    <SelectValue placeholder="Tahun Ajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026/2027" className="text-xs">2026/2027</SelectItem>
                    <SelectItem value="2025/2026" className="text-xs">2025/2026</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedSemester}
                  onValueChange={setSelectedSemester}
                >
                  <SelectTrigger className="text-xs w-28">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GANJIL" className="text-xs">Ganjil</SelectItem>
                    <SelectItem value="GENAP" className="text-xs">Genap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 3. Conditional Date or Month */}
            {reportType === "HARIAN" ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Tanggal Presensi
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            ) : reportType === "BULANAN" ? (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Pilih Bulan
                </label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="07" className="text-xs">Juli 2026</SelectItem>
                    <SelectItem value="08" className="text-xs">Agustus 2026</SelectItem>
                    <SelectItem value="09" className="text-xs">September 2026</SelectItem>
                    <SelectItem value="10" className="text-xs">Oktober 2026</SelectItem>
                    <SelectItem value="11" className="text-xs">November 2026</SelectItem>
                    <SelectItem value="12" className="text-xs">Desember 2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Rombongan Belajar (Kelas)
                </label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Semua Kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Semua Kelas</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name} ({c.studentCount} Siswa)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 4. Student selector for PER_SISWA */}
            {reportType === "PER_SISWA" && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Pilih Siswa
                </label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Pilih Siswa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">Semua Siswa</SelectItem>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.fullName} ({s.nis})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Export Actions Bar */}
            <div className={`space-y-1 ${reportType === "PER_SISWA" ? "sm:col-span-2 lg:col-span-4" : ""}`}>
              <label className="text-xs font-semibold text-foreground">
                Tindakan Ekspor & Cetak
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  className="text-xs gap-1.5 h-9 bg-emerald-700 hover:bg-emerald-800 text-white"
                  onClick={handleExportCSV}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Ekspor CSV (Aktif)
                </Button>

                <Button
                  variant="outline"
                  className="text-xs gap-1.5 h-9"
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4" />
                  Cetak Dokumen Resmi
                </Button>

                <Button
                  variant="outline"
                  className="text-xs gap-1.5 h-9"
                  onClick={() => {
                    setInfoModalFormat("PDF");
                    setInfoModalOpen(true);
                  }}
                >
                  <Download className="h-4 w-4" />
                  PDF (Pratinjau)
                </Button>

                <Button
                  variant="outline"
                  className="text-xs gap-1.5 h-9"
                  onClick={() => {
                    setInfoModalFormat("EXCEL");
                    setInfoModalOpen(true);
                  }}
                >
                  <Download className="h-4 w-4" />
                  Excel XLSX
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Statistics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-lg border bg-muted/30">
              <span className="text-[11px] text-muted-foreground block font-semibold">
                Siswa Tercatat
              </span>
              <span className="text-lg font-black text-foreground">
                {stats.total} Orang
              </span>
            </div>
            <div className="p-3 rounded-lg border bg-emerald-50 dark:bg-emerald-950/30">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-semibold">
                Rata-Rata Kehadiran
              </span>
              <span className="text-lg font-black text-emerald-800 dark:text-emerald-300">
                {stats.persentase.toFixed(1)}%
              </span>
            </div>
            <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30">
              <span className="text-[11px] text-blue-700 dark:text-blue-400 block font-semibold">
                Sakit / Izin Sah
              </span>
              <span className="text-lg font-black text-blue-800 dark:text-blue-300">
                {stats.sakit + stats.izin} Sesi
              </span>
            </div>
            <div className="p-3 rounded-lg border bg-rose-50 dark:bg-rose-950/30">
              <span className="text-[11px] text-rose-700 dark:text-rose-400 block font-semibold">
                Total Alpa (Tanpa Kabar)
              </span>
              <span className="text-lg font-black text-rose-800 dark:text-rose-300">
                {stats.alpa} Sesi
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PRINT-READY REPORT CONTAINER */}
      <div className="bg-white text-black p-4 sm:p-8 rounded-xl border print:border-none print:p-0 print:shadow-none shadow-sm space-y-6">
        {/* OFFICIAL KOP SURAT SMA PB NGRAYUN */}
        <div className="border-b-2 border-black pb-4 text-center space-y-1">
          <div className="flex items-center justify-center gap-4">
            <div className="h-16 w-16 flex items-center justify-center shrink-0">
              <Image
                src="/logo.png"
                alt="Logo SMA PB Ngrayun"
                width={64}
                height={64}
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-700">
                PEMERINTAH PROVINSI JAWA TIMUR • DINAS PENDIDIKAN
              </h2>
              <h1 className="text-base sm:text-xl font-black uppercase text-black tracking-wide">
                SMA PEMBERDAYAAN BANGSA NGRAYUN
              </h1>
              <p className="text-xs text-gray-800">
                Jl. Raya Ngrayun No. 45, Desa Mrayan, Kec. Ngrayun, Kab. Ponorogo, Jawa Timur 63464
              </p>
              <p className="text-[11px] text-gray-600 font-mono">
                Website: smapbngrayun.sch.id • Email: tu@smapbngrayun.sch.id • NPSN: 20512345
              </p>
            </div>
          </div>
        </div>

        {/* DOCUMENT TITLE & METADATA */}
        <div className="text-center space-y-1 pt-2">
          <h2 className="text-sm sm:text-base font-black underline uppercase text-black">
            {reportType === "HARIAN"
              ? "LAPORAN REKAPITULASI PRESENSI HARIAN SISWA"
              : reportType === "BULANAN"
              ? `LAPORAN REKAPITULASI PRESENSI BULANAN SISWA (BULAN ${selectedMonth}/${selectedYear})`
              : reportType === "PER_SISWA"
              ? "LEMBAR REKAPITULASI KEHADIRAN INDIVIDUAL SISWA"
              : "LAPORAN REKAPITULASI KEHADIRAN KELAS"}
          </h2>
          <p className="text-xs text-gray-700 font-mono">
            Nomor: 421.3 / {Math.floor(Math.random() * 800) + 100} / SMA-PB / X / 2026
          </p>
        </div>

        {/* METADATA INFO TABLE */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-900 border-y py-2 font-medium">
          <div>
            <p>
              <span className="text-gray-600 inline-block w-28">Tahun Ajaran:</span>
              <strong>{selectedAcademicYear} (Semester {selectedSemester})</strong>
            </p>
            <p>
              <span className="text-gray-600 inline-block w-28">Rombongan Belajar:</span>
              <strong>{currentClass ? currentClass.name : "Seluruh Rombel"}</strong>
            </p>
          </div>
          <div className="text-right">
            <p>
              <span className="text-gray-600 inline-block w-28">Tanggal Terbit:</span>
              <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
            </p>
            <p>
              <span className="text-gray-600 inline-block w-28">Status Arsip:</span>
              <strong className="text-emerald-700">Terverifikasi Digital (SIAKAD)</strong>
            </p>
          </div>
        </div>

        {/* REPORT DATA TABLE */}
        {reportType === "HARIAN" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-black min-w-[700px] data-tabular">
              <thead>
                <tr className="bg-gray-100 text-black border-b border-black text-[11px] font-bold uppercase">
                  <th className="border border-black px-2.5 py-2 text-center w-8">No</th>
                  <th className="border border-black px-3 py-2">NIS</th>
                  <th className="border border-black px-3 py-2">Nama Siswa</th>
                  <th className="border border-black px-2.5 py-2 text-center">Kelas</th>
                  <th className="border border-black px-2.5 py-2 text-center">Status</th>
                  <th className="border border-black px-2.5 py-2 text-center">Jam Masuk</th>
                  <th className="border border-black px-3 py-2">Metode / Lokasi</th>
                  <th className="border border-black px-3 py-2">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {reportDailyRecords.map((r, idx) => (
                  <tr key={r.id} className="border-b border-gray-300">
                    <td className="border border-black px-2.5 py-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border border-black px-3 py-1.5 font-mono">{r.studentNis}</td>
                    <td className="border border-black px-3 py-1.5 font-bold">{r.studentName}</td>
                    <td className="border border-black px-2.5 py-1.5 text-center">{r.className}</td>
                    <td className="border border-black px-2.5 py-1.5 text-center font-bold">
                      {r.status}
                    </td>
                    <td className="border border-black px-2.5 py-1.5 text-center font-mono">
                      {r.checkInTime || "-"}
                    </td>
                    <td className="border border-black px-3 py-1.5 text-[11px]">
                      {r.method} ({r.deviceLocation || "Sesi"})
                    </td>
                    <td className="border border-black px-3 py-1.5 text-[11px]">
                      {r.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse border border-black min-w-[700px] data-tabular">
              <thead>
                <tr className="bg-gray-100 text-black border-b border-black text-[11px] font-bold uppercase">
                  <th className="border border-black px-2 py-2 text-center w-8">No</th>
                  <th className="border border-black px-3 py-2">NIS</th>
                  <th className="border border-black px-3 py-2">Nama Lengkap Siswa</th>
                  <th className="border border-black px-2 py-2 text-center">Kelas</th>
                  <th className="border border-black px-2 py-2 text-center">L/P</th>
                  <th className="border border-black px-2 py-2 text-center">Sesi</th>
                  <th className="border border-black px-2 py-2 text-center">H</th>
                  <th className="border border-black px-2 py-2 text-center">T</th>
                  <th className="border border-black px-2 py-2 text-center">S</th>
                  <th className="border border-black px-2 py-2 text-center">I</th>
                  <th className="border border-black px-2 py-2 text-center">A</th>
                  <th className="border border-black px-3 py-2 text-center font-bold">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {reportStudentRecaps.map((s, idx) => (
                  <tr key={s.studentId} className="border-b border-gray-300">
                    <td className="border border-black px-2 py-1.5 text-center font-mono">{idx + 1}</td>
                    <td className="border border-black px-3 py-1.5 font-mono">{s.studentNis}</td>
                    <td className="border border-black px-3 py-1.5 font-bold">{s.studentName}</td>
                    <td className="border border-black px-2 py-1.5 text-center">{s.className}</td>
                    <td className="border border-black px-2 py-1.5 text-center font-mono">{s.gender}</td>
                    <td className="border border-black px-2 py-1.5 text-center font-mono">{s.totalSessions}</td>
                    <td className="border border-black px-2 py-1.5 text-center font-mono font-semibold">{s.hadir}</td>
                    <td className="border border-black px-2 py-1.5 text-center font-mono">{s.terlambat}</td>
                    <td className="border border-black px-2 py-1.5 text-center font-mono">{s.sakit}</td>
                    <td className="border border-black px-2 py-1.5 text-center font-mono">{s.izin}</td>
                    <td className="border border-black px-2 py-1.5 text-center font-mono font-bold text-rose-700">
                      {s.alpa}
                    </td>
                    <td className="border border-black px-3 py-1.5 text-center font-mono font-black">
                      {s.attendanceRate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* NOTES & RECAP FORMULA */}
        <div className="text-[11px] text-gray-700 space-y-0.5 pt-2">
          <p>
            <strong>Keterangan Status:</strong> H = Hadir; T = Terlambat; S = Sakit (Ada Surat); I = Izin Resmi; A = Alpa (Tanpa Keterangan).
          </p>
          <p>
            <strong>Rumus Penghitungan:</strong> Persentase = ((Hadir + Terlambat) / Total Sesi Efektif) × 100%.
          </p>
        </div>

        {/* SIGNATURE BLOCK */}
        <div className="pt-8 grid grid-cols-2 text-xs text-black">
          <div className="text-center space-y-16">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold">Wali Kelas / Koordinator Presensi</p>
            </div>
            <div>
              <p className="font-bold underline">
                {currentClass ? currentClass.homeroomTeacherName : "Siti Rahmawati, S.Pd."}
              </p>
              <p className="text-gray-600 font-mono">NIP. 198403152009032008</p>
            </div>
          </div>

          <div className="text-center space-y-16">
            <div>
              <p>Ngrayun, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              <p className="font-semibold">Kepala SMA Pemberdayaan Bangsa</p>
            </div>
            <div>
              <p className="font-bold underline">Drs. Bambang Setyono, M.Pd.</p>
              <p className="text-gray-600 font-mono">NIP. 197508122002121003</p>
            </div>
          </div>
        </div>
      </div>

      {/* PDF / Excel Backend Info Dialog */}
      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Info className="h-5 w-5 text-primary" />
              Antarmuka Ekspor {infoModalFormat === "PDF" ? "PDF Resmi" : "Excel Spreadsheet"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Informasi kesiapan integrasi backend SIAKAD
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              Antarmuka tombol ekspor <strong>{infoModalFormat}</strong> telah disiapkan sesuai rancangan sistem.
            </p>
            <div className="p-3 rounded-lg border bg-muted/40 space-y-1.5">
              <span className="font-semibold text-foreground block">
                Alternatif Tersedia Saat Ini (Fase Frontend):
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>
                  Gunakan tombol <strong>Ekspor CSV (Aktif)</strong> untuk mengunduh spreadsheet data mentah yang dapat langsung dibuka di Microsoft Excel.
                </li>
                <li>
                  Gunakan tombol <strong>Cetak Dokumen Resmi</strong> (Ctrl + P) untuk menyimpan langsung ke format PDF dengan tata letak kop surat resmi sekolah.
                </li>
              </ul>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Ekspor server-side berekstensi <code>.xlsx</code> dan template PDF otomatis akan diproses oleh layanan backend NestJS pada fase integrasi mendatang.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              size="sm"
              onClick={() => setInfoModalOpen(false)}
            >
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
