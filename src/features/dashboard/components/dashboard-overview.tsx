"use client";

import * as React from "react";
import { Sparkles, Calendar, Shield, GraduationCap, School, UserCheck } from "lucide-react";
import { AdminDashboardView } from "./admin-dashboard-view";
import { TeacherDashboardView } from "./teacher-dashboard-view";
import { PrincipalDashboardView } from "./principal-dashboard-view";
import { StudentDashboardView } from "./student-dashboard-view";
import { useDemoRole } from "@/contexts/demo-role-context";
import { DemoRoleType, DEMO_USERS, INSTITUTION } from "@/lib/constants";
import { formatIndonesianDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function DashboardOverview() {
  const { role, setRole, currentUser, academicYear } = useDemoRole();
  const [todayStr, setTodayStr] = React.useState<string>("Kamis, 15 Oktober 2026");

  React.useEffect(() => {
    setTodayStr(formatIndonesianDate(new Date()));
  }, []);

  const handleRoleSelect = (r: DemoRoleType) => {
    setRole(r);
    toast.success(`Beralih ke tampilan demo: ${DEMO_USERS[r].roleLabel}`);
  };

  return (
    <div className="space-y-6">
      {/* Interactive Role Switcher Banner */}
      <div className="rounded-2xl border border-primary/20 bg-card p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">
                Simulasi Dashboard Berdasarkan Peran (Role-Based Demo)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Pilih profil pengguna di bawah untuk melihat pengalaman antarmuka yang disesuaikan:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] bg-muted/30">
              Tahun Ajaran: {academicYear}
            </Badge>
            <span className="text-[10px] text-muted-foreground hidden md:inline">
              &bull; {todayStr}
            </span>
          </div>
        </div>

        {/* 4 Interactive Role Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {/* Admin / Tata Usaha */}
          <button
            onClick={() => handleRoleSelect("ADMIN")}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
              role === "ADMIN"
                ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary"
                : "border-border/80 bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
              role === "ADMIN" ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-muted-foreground"
            }`}>
              🛡️
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">Admin / Tata Usaha</p>
              <p className="text-[10px] text-muted-foreground truncate">Pusat Kendali Sistem</p>
            </div>
          </button>

          {/* Guru */}
          <button
            onClick={() => handleRoleSelect("GURU")}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
              role === "GURU"
                ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary"
                : "border-border/80 bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
              role === "GURU" ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-muted-foreground"
            }`}>
              👨‍🏫
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">Guru & Wali Kelas</p>
              <p className="text-[10px] text-muted-foreground truncate">Jadwal & Rekap Rombel</p>
            </div>
          </button>

          {/* Kepala Sekolah */}
          <button
            onClick={() => handleRoleSelect("KEPALA_SEKOLAH")}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
              role === "KEPALA_SEKOLAH"
                ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary"
                : "border-border/80 bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
              role === "KEPALA_SEKOLAH" ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-muted-foreground"
            }`}>
              🏫
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">Kepala Sekolah</p>
              <p className="text-[10px] text-muted-foreground truncate">Statistik & Mutu Agregat</p>
            </div>
          </button>

          {/* Siswa */}
          <button
            onClick={() => handleRoleSelect("SISWA")}
            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
              role === "SISWA"
                ? "border-primary bg-primary/10 text-foreground shadow-sm ring-1 ring-primary"
                : "border-border/80 bg-background hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
              role === "SISWA" ? "bg-primary text-primary-foreground font-bold" : "bg-muted text-muted-foreground"
            }`}>
              🎒
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">Siswa</p>
              <p className="text-[10px] text-muted-foreground truncate">Presensi & Izin Mandiri</p>
            </div>
          </button>
        </div>
      </div>

      {/* Render the role-appropriate dashboard view */}
      {role === "ADMIN" && <AdminDashboardView />}
      {role === "GURU" && <TeacherDashboardView />}
      {role === "KEPALA_SEKOLAH" && <PrincipalDashboardView />}
      {role === "SISWA" && <StudentDashboardView />}
    </div>
  );
}
