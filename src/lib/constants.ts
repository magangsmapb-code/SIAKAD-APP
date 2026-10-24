import {
  LayoutDashboard,
  QrCode,
  Users,
  GraduationCap,
  School,
  BookOpen,
  CalendarDays,
  FileCheck2,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  UserCog,
  Terminal,
} from "lucide-react";
import { AttendanceStatus, PermissionStatus } from "@/types";

export const INSTITUTION = {
  name: "SMA Pemberdayaan Bangsa Ngrayun",
  shortName: "SMA PB Ngrayun",
  location: "Kec. Ngrayun, Kab. Ponorogo, Jawa Timur 63464",
  systemName: "SIAKAD",
  tagline: "Sistem Informasi Absensi Kehadiran Akurat Digital",
  academicYear: "2026/2027",
  semester: "Ganjil",
  workingHours: {
    entryThreshold: "07:00",
    lateLimit: "07:15",
    exitTimeRegular: "14:30",
    exitTimeFriday: "11:30",
  },
};

export const ACADEMIC_YEARS = [
  { id: "2026/2027-ganjil", label: "2026/2027 Ganjil", year: "2026/2027", semester: "Ganjil", isCurrent: true },
  { id: "2026/2027-genap", label: "2026/2027 Genap", year: "2026/2027", semester: "Genap", isCurrent: false },
  { id: "2025/2026-genap", label: "2025/2026 Genap", year: "2025/2026", semester: "Genap", isCurrent: false },
];

export type DemoRoleType = "ADMIN" | "GURU" | "KEPALA_SEKOLAH" | "SISWA" | "DEVELOPER";

export interface DemoUser {
  id: string;
  role: DemoRoleType;
  roleLabel: string;
  name: string;
  identifier: string; // NIP or NIS // 
  email: string;
  title: string;
  avatarFallback: string;
  assignedClass?: string;
}

export const DEMO_USERS: Record<DemoRoleType, DemoUser> = {
  ADMIN: {
    id: "usr-admin",
    role: "ADMIN",
    roleLabel: "Admin / Tata Usaha",
    name: "Siti Rahmawati, S.Pd.",
    identifier: "198403152009032008",
    email: "admin@smapbngrayun.sch.id",
    title: "Staf Tata Usaha & Administrator SIAKAD",
    avatarFallback: "SR",
  },
  DEVELOPER: {
    id: "usr-dev",
    role: "DEVELOPER",
    roleLabel: "Developer & Core Engineer",
    name: "Fajar Pratama, S.Kom.",
    identifier: "DEV-SIAKAD-01",
    email: "dev@smapbngrayun.sch.id",
    title: "Lead System Architect & Core Platform Engineer",
    avatarFallback: "FP",
  },
  GURU: {
    id: "usr-guru",
    role: "GURU",
    roleLabel: "Guru & Wali Kelas",
    name: "Ahmad Dahlan, S.Pd.",
    identifier: "198805202014021004",
    email: "dahlan.guru@smapbngrayun.sch.id",
    title: "Guru Matematika & Wali Kelas XI MIPA 1",
    avatarFallback: "AD",
    assignedClass: "XI MIPA 1",
  },
  KEPALA_SEKOLAH: {
    id: "usr-kepsek",
    role: "KEPALA_SEKOLAH",
    roleLabel: "Kepala Sekolah",
    name: "Drs. Bambang Setyono, M.Pd.",
    identifier: "197508122002121003",
    email: "kepsek@smapbngrayun.sch.id",
    title: "Kepala Sekolah SMA PB Ngrayun",
    avatarFallback: "BS",
  },
  SISWA: {
    id: "usr-siswa",
    role: "SISWA",
    roleLabel: "Siswa",
    name: "Bagus Wicaksono",
    identifier: "20241001",
    email: "bagus.w@siswa.smapbngrayun.sch.id",
    title: "Siswa Kelas X MIPA 1 (RFID: 73 A4 19 B2)",
    avatarFallback: "BW",
    assignedClass: "X MIPA 1",
  },
};

export interface NavItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  badge?: string;
  roles?: string[];
}

export const MAIN_NAVIGATION: { group: string; items: NavItem[] }[] = [
  {
    group: "Utama",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["ADMIN", "DEVELOPER", "GURU", "KEPALA_SEKOLAH", "SISWA"],
      },
      {
        title: "Absensi",
        href: "/attendance",
        icon: QrCode,
        badge: "Live",
        roles: ["ADMIN", "DEVELOPER", "GURU", "KEPALA_SEKOLAH"],
      },
      {
        title: "Pengajuan Izin",
        href: "/permissions",
        icon: FileCheck2,
        badge: "3 Baru",
        roles: ["ADMIN", "DEVELOPER", "GURU", "KEPALA_SEKOLAH", "SISWA"],
      },
    ],
  },
  {
    group: "Data Akademik",
    items: [
      {
        title: "Data Siswa",
        href: "/students",
        icon: Users,
        roles: ["ADMIN", "DEVELOPER", "GURU", "KEPALA_SEKOLAH"],
      },
      {
        title: "Data Guru",
        href: "/teachers",
        icon: GraduationCap,
        roles: ["ADMIN", "DEVELOPER", "KEPALA_SEKOLAH"],
      },
      {
        title: "Kelas",
        href: "/classes",
        icon: School,
        roles: ["ADMIN", "DEVELOPER", "GURU", "KEPALA_SEKOLAH"],
      },
      {
        title: "Mata Pelajaran",
        href: "/subjects",
        icon: BookOpen,
        roles: ["ADMIN", "DEVELOPER", "GURU", "KEPALA_SEKOLAH"],
      },
      {
        title: "Jadwal",
        href: "/schedules",
        icon: CalendarDays,
        roles: ["ADMIN", "DEVELOPER", "GURU", "KEPALA_SEKOLAH", "SISWA"],
      },
    ],
  },
  {
    group: "Laporan & Sistem",
    items: [
      {
        title: "Laporan",
        href: "/reports",
        icon: FileSpreadsheet,
        roles: ["ADMIN", "DEVELOPER", "GURU", "KEPALA_SEKOLAH"],
      },
      {
        title: "Pengguna",
        href: "/users",
        icon: UserCog,
        roles: ["ADMIN", "DEVELOPER"],
      },
      {
        title: "Pengaturan",
        href: "/settings",
        icon: Settings,
        roles: ["ADMIN", "DEVELOPER"],
      },
      {
        title: "Developer Console",
        href: "/settings",
        icon: Terminal,
        badge: "Governance",
        roles: ["DEVELOPER", "ADMIN"],
      },
    ],
  },
];

export const ATTENDANCE_STATUS_CONFIG: Record<
  AttendanceStatus,
  {
    label: string;
    description: string;
    colorClass: string;
    badgeClass: string;
    dotClass: string;
  }
> = {
  HADIR: {
    label: "Hadir Tepat Waktu",
    description: "Siswa hadir sebelum jam batas masuk",
    colorClass: "text-emerald-700 dark:text-emerald-400",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
    dotClass: "bg-emerald-500",
  },
  TERLAMBAT: {
    label: "Terlambat",
    description: "Siswa hadir setelah jam batas masuk toleransi",
    colorClass: "text-amber-700 dark:text-amber-400",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
    dotClass: "bg-amber-500",
  },
  IZIN: {
    label: "Izin Resmi",
    description: "Izin yang telah disetujui wali kelas/BK",
    colorClass: "text-sky-700 dark:text-sky-400",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
    dotClass: "bg-sky-500",
  },
  SAKIT: {
    label: "Sakit",
    description: "Siswa berhalangan karena sakit dengan surat dokter",
    colorClass: "text-purple-700 dark:text-purple-400",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
    dotClass: "bg-purple-500",
  },
  ALPA: {
    label: "Alpa / Tanpa Keterangan",
    description: "Tidak hadir tanpa konfirmasi surat atau izin",
    colorClass: "text-rose-700 dark:text-rose-400",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
    dotClass: "bg-rose-500",
  },
};

export const PERMISSION_STATUS_CONFIG: Record<
  PermissionStatus,
  { label: string; badgeClass: string }
> = {
  MENUNGGU: {
    label: "Menunggu Verifikasi",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
  },
  DISETUJUI: {
    label: "Disetujui",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  },
  DITOLAK: {
    label: "Ditolak",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
  },
};
