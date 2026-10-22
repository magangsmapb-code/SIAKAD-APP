"use client";

import * as React from "react";
import {
  Users,
  GraduationCap,
  School,
  UserCheck,
  ClockAlert,
  AlertOctagon,
  Calendar,
  Filter,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  FileCheck2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/shared/stat-card";
import { AttendanceChart } from "./attendance-chart";
import { ClassSummaryTable } from "./class-summary-table";
import { QuickActions } from "./quick-actions";
import { ManualAttendanceModal } from "@/features/attendance/components/manual-attendance-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSchoolData } from "@/contexts/school-data-context";
import { apiClient } from "@/lib/api-client";
import { PermissionRequest } from "@/types";
import { useDemoRole } from "@/contexts/demo-role-context";
import { toast } from "sonner";

interface DashboardSummaryData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayAttendancePercentage: number;
  hadirCount: number;
  sakitCount: number;
  izinCount: number;
  alpaCount: number;
  terlambatCount: number;
  pendingPermissionsCount: number;
}

export function AdminDashboardView() {
  const { academicYear } = useDemoRole();
  const { classes, students, teachers, attendanceRecords, permissions, refreshData } = useSchoolData();
  const [summary, setSummary] = React.useState<DashboardSummaryData | null>(null);
  const [manualModalOpen, setManualModalOpen] = React.useState(false);
  const [selectedClass, setSelectedClass] = React.useState("ALL");
  const [dateFilter, setDateFilter] = React.useState("TODAY");
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState("07:18:42 WIB");

  const fetchSummary = React.useCallback(async () => {
    try {
      const res = await apiClient.get<DashboardSummaryData>("/dashboard/summary");
      if (res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error("Gagal memuat summary dashboard:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refreshData(), fetchSummary()]);
      const now = new Date();
      setLastUpdated(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " WIB"
      );
      toast.success("Data presensi RFID berhasil disinkronkan.");
    } catch {
      toast.error("Gagal menyinkronkan data presensi.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered attendance stats based on selected class
  const stats = React.useMemo(() => {
    if (selectedClass === "ALL") {
      return {
        totalStudents: summary?.totalStudents ?? students.length,
        totalTeachers: summary?.totalTeachers ?? teachers.length,
        totalClasses: summary?.totalClasses ?? classes.length,
        presentCount: summary?.hadirCount ?? attendanceRecords.filter((r) => r.status === "HADIR").length,
        lateCount: summary?.terlambatCount ?? attendanceRecords.filter((r) => r.status === "TERLAMBAT").length,
        permissionCount: summary?.izinCount ?? attendanceRecords.filter((r) => r.status === "IZIN").length,
        sickCount: summary?.sakitCount ?? attendanceRecords.filter((r) => r.status === "SAKIT").length,
        absentCount: summary?.alpaCount ?? attendanceRecords.filter((r) => r.status === "ALPA").length,
        attendanceRate: summary?.todayAttendancePercentage ?? 95.5,
        punctualityRate: 96.5,
      };
    }
    const cls = classes.find((c) => c.name === selectedClass);
    const clsStudents = students.filter((s) => s.classId === cls?.id);
    const total = clsStudents.length || cls?.studentCount || 0;
    const clsRecords = attendanceRecords.filter((r) => r.className === selectedClass);
    const hadir = clsRecords.filter((r) => r.status === "HADIR").length;
    const terlambat = clsRecords.filter((r) => r.status === "TERLAMBAT").length;
    const izin = clsRecords.filter((r) => r.status === "IZIN").length;
    const sakit = clsRecords.filter((r) => r.status === "SAKIT").length;
    const alpa = clsRecords.filter((r) => r.status === "ALPA").length;
    return {
      totalStudents: total,
      totalTeachers: teachers.length,
      totalClasses: 1,
      presentCount: hadir,
      lateCount: terlambat,
      permissionCount: izin,
      sickCount: sakit,
      absentCount: alpa,
      attendanceRate: total > 0 ? Number((((hadir + terlambat) / total) * 100).toFixed(1)) : 100,
      punctualityRate: 96.5,
    };
  }, [selectedClass, summary, students, teachers, classes, attendanceRecords]);

  // Latest 5 attendance logs
  const latestLogs = React.useMemo(() => {
    let list = attendanceRecords;
    if (selectedClass !== "ALL") {
      list = list.filter((r) => r.className === selectedClass);
    }
    return list.slice(0, 5);
  }, [attendanceRecords, selectedClass]);

  const pendingPermissions = React.useMemo(() => {
    return permissions.filter((p) => p.status === "MENUNGGU");
  }, [permissions]);

  return (
    <div className="space-y-6">
      {/* Filters Bar & Sync Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
            <Filter className="h-3.5 w-3.5 text-primary" />
            <span>Filter Data:</span>
          </div>

          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
              <SelectValue placeholder="Pilih Waktu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAY" className="text-xs">Hari Ini (15 Okt)</SelectItem>
              <SelectItem value="YESTERDAY" className="text-xs">Kemarin (14 Okt)</SelectItem>
              <SelectItem value="THIS_WEEK" className="text-xs">Minggu Ini</SelectItem>
            </SelectContent>
          </Select>

          {/* Class Filter */}
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="h-8 text-xs w-[150px] bg-background">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Semua Rombel ({classes.length})</SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.name} className="text-xs">
                  Kelas {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sync Info & Manual Refresh */}
        <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span>Pembaruan: <strong className="text-foreground font-mono">{lastUpdated}</strong></span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="h-8 text-xs px-2.5 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Sinkronkan</span>
          </Button>
        </div>
      </div>

      {/* 4 Main Core Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Siswa Aktif"
          value={stats.totalStudents}
          subtitle={selectedClass === "ALL" ? "6 Rombel terdaftar" : `Rombel ${selectedClass}`}
          icon={Users}
          variant="primary"
          trend={{ value: "+2 siswa baru", isPositive: true }}
        />
        <StatCard
          title="Guru & Tenaga Kependidikan"
          value="14"
          subtitle="100% hadir bertugas"
          icon={GraduationCap}
          variant="success"
        />
        <StatCard
          title="Rombongan Belajar"
          value={selectedClass === "ALL" ? "6" : "1"}
          subtitle={`TA ${academicYear}`}
          icon={School}
          variant="neutral"
        />
        <StatCard
          title="Kehadiran Hari Ini"
          value={`${stats.attendanceRate}%`}
          subtitle="Target kehadiran >= 95%"
          icon={UserCheck}
          variant="success"
          trend={{ value: "+1.2% dari kemarin", isPositive: true }}
        />
      </div>

      {/* Breakdown Status Hadir, Sakit, Izin, Alpa */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 p-3 sm:p-4 text-center">
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
            Hadir Tepat Waktu
          </span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 font-mono">
            {stats.presentCount}
          </p>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">sebelum 07:00 WIB</span>
        </div>

        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 p-3 sm:p-4 text-center">
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            Terlambat
          </span>
          <p className="text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1 font-mono">
            {stats.lateCount}
          </p>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">07:01 - 07:15 WIB</span>
        </div>

        <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/40 p-3 sm:p-4 text-center">
          <span className="text-[11px] font-semibold text-sky-800 dark:text-sky-300">
            Izin Resmi
          </span>
          <p className="text-xl sm:text-2xl font-bold text-sky-700 dark:text-sky-400 mt-1 font-mono">
            {stats.permissionCount}
          </p>
          <span className="text-[10px] text-sky-600 dark:text-sky-400">disetujui wali kelas</span>
        </div>

        <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/40 p-3 sm:p-4 text-center">
          <span className="text-[11px] font-semibold text-purple-800 dark:text-purple-300">
            Sakit
          </span>
          <p className="text-xl sm:text-2xl font-bold text-purple-700 dark:text-purple-400 mt-1 font-mono">
            {stats.sickCount}
          </p>
          <span className="text-[10px] text-purple-600 dark:text-purple-400">dengan surat dokter</span>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/40 p-3 sm:p-4 text-center">
          <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">
            Alpa / Tanpa Ket.
          </span>
          <p className="text-xl sm:text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1 font-mono">
            {stats.absentCount}
          </p>
          <span className="text-[10px] text-rose-600 dark:text-rose-400">notifikasi ortu terkirim</span>
        </div>
      </div>

      {/* Main Charts & Quick Action row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AttendanceChart />
        </div>
        <div>
          <QuickActions onOpenManualModal={() => setManualModalOpen(true)} />
        </div>
      </div>

      {/* Class Statistics Summary Table */}
      <div>
        <ClassSummaryTable />
      </div>

      {/* Bottom Grid: Latest Attendance Feed & Pending Permissions Review */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Live Attendance Log */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Presensi Terbaru Masuk Gerbang
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Log real-time tap kartu RFID dan kiosk wajah
              </p>
            </div>
            <Link
              href="/attendance"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Semua Log</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            {latestLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-navy-100 dark:bg-navy-900 text-navy-800 dark:text-navy-200 flex items-center justify-center font-bold text-xs shrink-0">
                    {log.studentName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground truncate max-w-[160px] sm:max-w-xs">
                      {log.studentName}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      NIS: {log.studentNis} &bull; Kelas {log.className}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-foreground block">
                    {log.checkInTime || "--:--"} WIB
                  </span>
                  <Badge
                    variant={
                      log.status === "HADIR"
                        ? "hadir"
                        : log.status === "TERLAMBAT"
                        ? "terlambat"
                        : "default"
                    }
                    className="text-[9px] px-1.5 py-0 mt-0.5"
                  >
                    {log.status === "HADIR" ? "Tepat Waktu" : log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Permission Review Queue */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Pengajuan Izin Menunggu Verifikasi
                </h3>
                <Badge variant="navy" className="text-[10px] px-1.5 py-0">
                  {pendingPermissions.length} Menunggu
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Surat izin & sakit yang perlu validasi wali kelas / BK
              </p>
            </div>
            <Link
              href="/permissions"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Buka Menu Izin</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {pendingPermissions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Tidak ada pengajuan izin yang menunggu verifikasi.</p>
            ) : (
              pendingPermissions.slice(0, 3).map((perm: PermissionRequest) => (
                <div
                  key={perm.id}
                  className="p-3 rounded-lg border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        {perm.studentName}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        {perm.className}
                      </Badge>
                    </div>
                  <Badge
                    className={`text-[10px] px-1.5 py-0 ${
                      perm.type === "SAKIT"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                        : "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300"
                    }`}
                  >
                    {perm.type} ({perm.totalDays} hari)
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 italic">
                  &ldquo;{perm.reason}&rdquo;
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                  <span>Tanggal: {perm.startDate} s.d. {perm.endDate}</span>
                  <Link
                    href="/permissions"
                    className="text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    Periksa Surat <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>

      <ManualAttendanceModal
        open={manualModalOpen}
        onOpenChange={setManualModalOpen}
      />
    </div>
  );
}
