"use client";

import * as React from "react";
import {
  Calendar,
  School,
  User,
  Filter,
  Search,
  Download,
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Info,
  ChevronDown,
  Layers,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileDataCard } from "@/components/shared/mobile-data-list";
import { useSchoolData } from "@/contexts/school-data-context";
import { apiClient } from "@/lib/api-client";
import { AttendanceRecord, AttendanceStatus, StudentRecapSummary } from "@/types";

export function AttendanceHistoryRecap() {
  const { attendanceRecords, studentRecaps, classes, students } = useSchoolData();

  // Filters
  const [startDate, setStartDate] = React.useState<string>("2026-10-12");
  const [endDate, setEndDate] = React.useState<string>("2026-10-15");
  const [selectedClass, setSelectedClass] = React.useState<string>("ALL");
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Sub-tab selection: 'log', 'student-recap', 'class-recap', 'charts'
  const [activeTab, setActiveTab] = React.useState<string>("log");
  const [weeklyTrend, setWeeklyTrend] = React.useState<Array<{
    day: string;
    date: string;
    hadir: number;
    terlambat: number;
    izin: number;
    sakit: number;
    alpa: number;
    persentase: number;
  }>>([]);

  React.useEffect(() => {
    const fetchTrends = async () => {
      try {
        const res = await apiClient.get<Array<{
          date: string;
          hadir: number;
          sakit: number;
          izin: number;
          alpa: number;
          terlambat: number;
          total: number;
          percentage: number;
        }>>("/dashboard/attendance-trends?days=5");

        if (res.data && Array.isArray(res.data)) {
          const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
          const formatted = res.data.map((item) => {
            const d = new Date(item.date);
            const dayName = daysMap[d.getDay()];
            const dateLabel = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
            return {
              day: dayName,
              date: dateLabel,
              hadir: item.hadir,
              terlambat: item.terlambat,
              izin: item.izin,
              sakit: item.sakit,
              alpa: item.alpa,
              persentase: item.percentage,
            };
          });
          setWeeklyTrend(formatted);
        }
      } catch (err) {
        console.error("Gagal memuat tren mingguan:", err);
      }
    };
    fetchTrends();
  }, []);

  // Filtered History Records
  const filteredRecords = React.useMemo(() => {
    return attendanceRecords.filter((record) => {
      // Date range filter
      if (startDate && record.date < startDate) return false;
      if (endDate && record.date > endDate) return false;

      // Class filter
      if (selectedClass !== "ALL") {
        const cls = classes.find((c) => c.id === selectedClass);
        if (cls && record.className !== cls.name) return false;
      }

      // Student filter
      if (selectedStudentId !== "ALL" && record.studentId !== selectedStudentId) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "ALL" && record.status !== selectedStatus) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchName = record.studentName.toLowerCase().includes(query);
        const matchNis = record.studentNis.includes(query);
        const matchClass = record.className.toLowerCase().includes(query);
        if (!matchName && !matchNis && !matchClass) return false;
      }

      return true;
    });
  }, [
    attendanceRecords,
    startDate,
    endDate,
    selectedClass,
    selectedStudentId,
    selectedStatus,
    searchQuery,
    classes,
  ]);

  // Filtered Student Recaps
  const filteredStudentRecaps = React.useMemo(() => {
    return studentRecaps.filter((recap) => {
      if (selectedClass !== "ALL") {
        const cls = classes.find((c) => c.id === selectedClass);
        if (cls && recap.className !== cls.name) return false;
      }

      if (selectedStudentId !== "ALL" && recap.studentId !== selectedStudentId) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !recap.studentName.toLowerCase().includes(query) &&
          !recap.studentNis.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [studentRecaps, selectedClass, selectedStudentId, searchQuery, classes]);

  // Filtered Class Summaries
  const filteredClassSummaries = React.useMemo(() => {
    const list = classes.map((c) => {
      const classStudents = students.filter((s) => s.classId === c.id);
      const totalStudents = classStudents.length || c.studentCount || 0;
      const classRecaps = studentRecaps.filter((sr) => sr.className === c.name);
      const hadir = classRecaps.reduce((acc, curr) => acc + curr.hadir, 0);
      const terlambat = classRecaps.reduce((acc, curr) => acc + curr.terlambat, 0);
      const sakit = classRecaps.reduce((acc, curr) => acc + curr.sakit, 0);
      const izin = classRecaps.reduce((acc, curr) => acc + curr.izin, 0);
      const alpa = classRecaps.reduce((acc, curr) => acc + curr.alpa, 0);
      const total = hadir + terlambat + sakit + izin + alpa;
      const persentase = total > 0 ? ((hadir + terlambat) / total) * 100 : 100;
      return {
        classId: c.id,
        className: c.name,
        totalStudents,
        hadir,
        terlambat,
        sakit,
        izin,
        alpa,
        persentase,
      };
    });

    if (selectedClass === "ALL") return list;
    return list.filter((c) => c.classId === selectedClass);
  }, [classes, students, studentRecaps, selectedClass]);

  // Status Badge Helper
  const getRecordStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "HADIR":
        return <Badge variant="hadir">Hadir</Badge>;
      case "TERLAMBAT":
        return <Badge variant="terlambat">Terlambat</Badge>;
      case "SAKIT":
        return <Badge variant="sakit">Sakit</Badge>;
      case "IZIN":
        return <Badge variant="izin">Izin</Badge>;
      case "ALPA":
        return <Badge variant="alpa">Alpa</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Method formatter
  const formatMethod = (method: string) => {
    switch (method) {
      case "RFID_CARD":
        return "Kartu RFID";
      case "FACE_RECOGNITION":
        return "Face Cam Kiosk";
      case "FINGERPRINT":
        return "Fingerprint Piket";
      case "MANUAL_TEACHER":
        return "Manual Guru";
      case "QR_CODE":
        return "QR Code Mobile";
      default:
        return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy Explanation Banner: Denominator & Attendance Rate Formula */}
      <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 p-4 space-y-2">
        <div className="flex items-start gap-2.5">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-blue-950 dark:text-blue-200">
              Kebijakan Perhitungan Persentase Kehadiran Siswa SMA Pemberdayaan Bangsa Ngrayun
            </h4>
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              Persentase dihitung dengan rumus baku Kementerian Pendidikan:
            </p>
            <div className="inline-block bg-background px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 font-mono text-xs text-foreground font-semibold">
              Persentase Kehadiran = ((Hadir + Terlambat) / Total Hari Efektif / Pertemuan Sesi) × 100%
            </div>
            <p className="text-[11px] text-blue-700 dark:text-blue-400">
              * Sakit dan Izin dicatat sebagai dispensasi resmi namun tidak dihitung sebagai kehadiran fisik di ruang kelas. Alpa (tanpa keterangan) secara langsung mengurangi persentase kehadiran dan memicu pemanggilan wali murid jika &ge; 3 kali.
            </p>
          </div>
        </div>
      </div>

      {/* Main Filter Section */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">
                Riwayat & Rekapitulasi Presensi
              </CardTitle>
              <CardDescription className="text-xs">
                Filter transaksi kehadiran siswa, rekapitulasi rombel, dan analisis statistik kehadiran.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Start Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Tanggal Mulai
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Tanggal Akhir
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            {/* Class */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <School className="h-3 w-3" /> Rombel / Kelas
              </label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Kelas</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Pilih Siswa
              </label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Semua Siswa" />
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

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> Status Kehadiran
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                  <SelectItem value="HADIR" className="text-xs">Hadir</SelectItem>
                  <SelectItem value="TERLAMBAT" className="text-xs">Terlambat</SelectItem>
                  <SelectItem value="SAKIT" className="text-xs">Sakit</SelectItem>
                  <SelectItem value="IZIN" className="text-xs">Izin</SelectItem>
                  <SelectItem value="ALPA" className="text-xs">Alpa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama, NIS, atau rombel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs h-8 pl-8"
              />
            </div>

            {(startDate !== "2026-10-12" ||
              endDate !== "2026-10-15" ||
              selectedClass !== "ALL" ||
              selectedStudentId !== "ALL" ||
              selectedStatus !== "ALL" ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate("2026-10-12");
                  setEndDate("2026-10-15");
                  setSelectedClass("ALL");
                  setSelectedStudentId("ALL");
                  setSelectedStatus("ALL");
                  setSearchQuery("");
                }}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                Reset Filter
              </Button>
            )}
          </div>

          {/* Sub Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-muted/60">
              <TabsTrigger value="log" className="text-xs py-2">
                Log Transaksi ({filteredRecords.length})
              </TabsTrigger>
              <TabsTrigger value="student-recap" className="text-xs py-2">
                Rekap Siswa ({filteredStudentRecaps.length})
              </TabsTrigger>
              <TabsTrigger value="class-recap" className="text-xs py-2">
                Rekap Kelas ({filteredClassSummaries.length})
              </TabsTrigger>
              <TabsTrigger value="charts" className="text-xs py-2">
                Grafik Tren Kehadiran
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Log Transaksi Detail */}
            <TabsContent value="log" className="pt-4">
              {filteredRecords.length === 0 ? (
                <div className="p-10 text-center border rounded-xl bg-muted/10 space-y-2">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                  <p className="text-xs font-semibold text-foreground">
                    Tidak ada catatan presensi yang sesuai filter
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Sesuaikan rentang tanggal atau bersihkan filter pencarian.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Cards (md:hidden) */}
                  <div className="md:hidden space-y-3">
                    {filteredRecords.map((record) => (
                      <MobileDataCard
                        key={record.id}
                        title={record.studentName}
                        subtitle={
                          <span className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-primary">{record.className}</span>
                            <span>•</span>
                            <span className="font-mono text-muted-foreground">NIS: {record.studentNis}</span>
                          </span>
                        }
                        badge={getRecordStatusBadge(record.status)}
                        fields={[
                          {
                            label: "Tanggal & Jam",
                            value: (
                              <div className="flex items-center gap-1 font-mono text-xs">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>{record.date} {record.checkInTime || "--:--"}</span>
                              </div>
                            ),
                          },
                          {
                            label: "Metode Presensi",
                            value: formatMethod(record.method),
                          },
                          {
                            label: "Lokasi / Catatan",
                            value: record.deviceLocation || record.notes || "-",
                          },
                        ]}
                      />
                    ))}
                  </div>

                  {/* Desktop Table View (hidden md:block) */}
                  <div className="hidden md:block rounded-xl border overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 border-b font-semibold text-muted-foreground uppercase text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Tanggal & Jam</th>
                          <th className="px-4 py-3">Nama Siswa</th>
                          <th className="px-4 py-3">NIS</th>
                          <th className="px-4 py-3">Rombel</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3">Metode & Perangkat</th>
                          <th className="px-4 py-3">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap font-mono">
                              <span className="font-semibold text-foreground">{record.date}</span>
                              <span className="block text-[11px] text-muted-foreground">
                                {record.checkInTime || "--:--:--"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-bold text-foreground">
                              {record.studentName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-mono text-muted-foreground">
                              {record.studentNis}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Badge variant="outline" className="text-[11px]">
                                {record.className}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              {getRecordStatusBadge(record.status)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="font-medium text-foreground block">
                                {formatMethod(record.method)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {record.deviceLocation || "Sesi Pembelajaran"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[11px] text-muted-foreground max-w-xs truncate">
                              {record.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </TabsContent>

            {/* TAB 2: Rekap Per Siswa */}
            <TabsContent value="student-recap" className="pt-4">
              {/* Mobile Cards View (md:hidden) */}
              <div className="md:hidden space-y-3">
                {filteredStudentRecaps.map((recap) => {
                  const isGood = recap.attendanceRate >= 90;
                  const isWarning = recap.attendanceRate < 85;

                  return (
                    <MobileDataCard
                      key={recap.studentId}
                      title={recap.studentName}
                      subtitle={
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-primary">{recap.className}</span>
                          <span>•</span>
                          <span className="font-mono text-muted-foreground">NIS: {recap.studentNis}</span>
                        </span>
                      }
                      badge={
                        <Badge
                          variant={isGood ? "hadir" : isWarning ? "alpa" : "terlambat"}
                          className="font-mono text-[10px]"
                        >
                          {recap.attendanceRate.toFixed(1)}%
                        </Badge>
                      }
                      fields={[
                        {
                          label: "Total Sesi",
                          value: <span className="font-bold font-mono">{recap.totalSessions} Sesi</span>,
                        },
                        {
                          label: "Hadir / Terlambat",
                          value: (
                            <span className="font-mono font-semibold">
                              <span className="text-emerald-600">{recap.hadir} H</span> /{" "}
                              <span className="text-amber-600">{recap.terlambat} T</span>
                            </span>
                          ),
                        },
                        {
                          label: "Sakit / Izin",
                          value: (
                            <span className="font-mono font-semibold">
                              <span className="text-blue-600">{recap.sakit} S</span> /{" "}
                              <span className="text-purple-600">{recap.izin} I</span>
                            </span>
                          ),
                        },
                        {
                          label: "Alpa (Tanpa Ket.)",
                          value: (
                            <span className="font-mono font-bold text-rose-600">
                              {recap.alpa} Hari
                            </span>
                          ),
                        },
                      ]}
                    />
                  );
                })}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block rounded-xl border overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b font-semibold text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Siswa</th>
                      <th className="px-4 py-3">NIS</th>
                      <th className="px-4 py-3">Rombel</th>
                      <th className="px-3 py-3 text-center">Total Sesi</th>
                      <th className="px-3 py-3 text-center text-emerald-700">Hadir</th>
                      <th className="px-3 py-3 text-center text-amber-700">Terlambat</th>
                      <th className="px-3 py-3 text-center text-blue-700">Sakit</th>
                      <th className="px-3 py-3 text-center text-purple-700">Izin</th>
                      <th className="px-3 py-3 text-center text-rose-700">Alpa</th>
                      <th className="px-4 py-3 text-center">Persentase</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudentRecaps.map((recap) => {
                      const isGood = recap.attendanceRate >= 90;
                      const isWarning = recap.attendanceRate < 85;

                      return (
                        <tr key={recap.studentId} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-foreground whitespace-nowrap">
                            {recap.studentName}
                          </td>
                          <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                            {recap.studentNis}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge variant="outline" className="text-[11px]">
                              {recap.className}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 text-center font-bold font-mono">
                            {recap.totalSessions}
                          </td>
                          <td className="px-3 py-3 text-center font-bold font-mono text-emerald-600">
                            {recap.hadir}
                          </td>
                          <td className="px-3 py-3 text-center font-bold font-mono text-amber-600">
                            {recap.terlambat}
                          </td>
                          <td className="px-3 py-3 text-center font-bold font-mono text-blue-600">
                            {recap.sakit}
                          </td>
                          <td className="px-3 py-3 text-center font-bold font-mono text-purple-600">
                            {recap.izin}
                          </td>
                          <td className="px-3 py-3 text-center font-bold font-mono text-rose-600">
                            {recap.alpa}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className={`font-mono font-bold ${
                                  isGood
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : isWarning
                                    ? "text-rose-700 dark:text-rose-400"
                                    : "text-amber-700 dark:text-amber-400"
                                }`}
                              >
                                {recap.attendanceRate.toFixed(1)}%
                              </span>
                              <div className="w-12 bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isGood
                                      ? "bg-emerald-600"
                                      : isWarning
                                      ? "bg-rose-600"
                                      : "bg-amber-600"
                                  }`}
                                  style={{ width: `${recap.attendanceRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* TAB 3: Rekap Per Kelas */}
            <TabsContent value="class-recap" className="pt-4">
              {/* Mobile Cards View (md:hidden) */}
              <div className="md:hidden space-y-3">
                {filteredClassSummaries.map((cls) => (
                  <MobileDataCard
                    key={cls.classId}
                    title={cls.className}
                    subtitle={`${cls.totalStudents} Siswa Terdaftar`}
                    badge={
                      <Badge
                        variant={cls.persentase >= 90 ? "hadir" : cls.persentase < 85 ? "alpa" : "terlambat"}
                        className="font-mono text-[10px]"
                      >
                        {cls.persentase.toFixed(1)}%
                      </Badge>
                    }
                    fields={[
                      {
                        label: "Hadir / Terlambat",
                        value: (
                          <span className="font-mono font-semibold">
                            <span className="text-emerald-600">{cls.hadir} H</span> /{" "}
                            <span className="text-amber-600">{cls.terlambat} T</span>
                          </span>
                        ),
                      },
                      {
                        label: "Sakit / Izin",
                        value: (
                          <span className="font-mono font-semibold">
                            <span className="text-blue-600">{cls.sakit} S</span> /{" "}
                            <span className="text-purple-600">{cls.izin} I</span>
                          </span>
                        ),
                      },
                      {
                        label: "Alpa (Tanpa Ket.)",
                        value: (
                          <span className="font-mono font-bold text-rose-600">
                            {cls.alpa} Siswa
                          </span>
                        ),
                      },
                      {
                        label: "Tingkat Kehadiran",
                        value: (
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {cls.persentase.toFixed(1)}%
                          </span>
                        ),
                      },
                    ]}
                  />
                ))}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block rounded-xl border overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b font-semibold text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Rombongan Belajar</th>
                      <th className="px-3 py-3 text-center">Total Siswa</th>
                      <th className="px-3 py-3 text-center text-emerald-700">Hadir</th>
                      <th className="px-3 py-3 text-center text-amber-700">Terlambat</th>
                      <th className="px-3 py-3 text-center text-blue-700">Sakit</th>
                      <th className="px-3 py-3 text-center text-purple-700">Izin</th>
                      <th className="px-3 py-3 text-center text-rose-700">Alpa</th>
                      <th className="px-4 py-3 text-center">Tingkat Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredClassSummaries.map((cls) => (
                      <tr key={cls.classId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-bold text-foreground">
                          {cls.className}
                        </td>
                        <td className="px-3 py-3 text-center font-bold font-mono">
                          {cls.totalStudents}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-emerald-600">
                          {cls.hadir}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-amber-600">
                          {cls.terlambat}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-blue-600">
                          {cls.sakit}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-purple-600">
                          {cls.izin}
                        </td>
                        <td className="px-3 py-3 text-center font-mono font-bold text-rose-600">
                          {cls.alpa}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {cls.persentase.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* TAB 4: Visual Charts (Recharts) */}
            <TabsContent value="charts" className="pt-4 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution Bar Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Komposisi Kehadiran Harian (Senin - Jumat)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Perbandingan jumlah siswa hadir, terlambat, sakit, izin, dan alpa
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={weeklyTrend}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "8px",
                              fontSize: "12px",
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                          <Bar dataKey="hadir" name="Hadir" fill="#059669" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="terlambat" name="Terlambat" fill="#d97706" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="sakit" name="Sakit" fill="#2563eb" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="izin" name="Izin" fill="#9333ea" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="alpa" name="Alpa" fill="#e11d48" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Trend Composed Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                      Tren Persentase Kehadiran Sekolah
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Fluktuasi persentase kehadiran agregat SMA PB Ngrayun
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={weeklyTrend}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                          <YAxis
                            domain={[85, 100]}
                            tick={{ fontSize: 11 }}
                            unit="%"
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "8px",
                              fontSize: "12px",
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                          <Line
                            type="monotone"
                            dataKey="persentase"
                            name="Persentase Kehadiran (%)"
                            stroke="#059669"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                            activeDot={{ r: 7 }}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
