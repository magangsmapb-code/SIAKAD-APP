export type AttendanceStatus = "HADIR" | "TERLAMBAT" | "IZIN" | "SAKIT" | "ALPA";

export type AttendanceMethod =
  | "RFID_CARD"
  | "FINGERPRINT"
  | "QR_CODE"
  | "FACE_RECOGNITION"
  | "MANUAL_TEACHER";

export type AttendanceSession = "MASUK" | "PULANG" | "MATA_PELAJARAN";

export type SessionStatus =
  | "BELUM_DIMULAI"
  | "SEDANG_BERLANGSUNG"
  | "SUDAH_DISIMPAN"
  | "PERLU_DIPERIKSA"
  | "DITUTUP"
  | "SELESAI";

export interface StudentAttendanceEntry {
  studentId: string;
  studentNis: string;
  studentNisn?: string;
  studentName: string;
  gender: Gender;
  status: AttendanceStatus | "BELUM_DIISI";
  notes?: string;
  checkInTime?: string;
}

export interface AttendanceSessionItem {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  startTime: string;
  endTime: string;
  room: string;
  status: SessionStatus;
  totalStudents: number;
  markedStudents: number;
  presentCount: number;
  sickCount: number;
  permissionCount: number;
  absentCount: number;
  lateCount: number;
  isDraft: boolean;
  lastUpdated?: string;
  notes?: string;
  entries?: StudentAttendanceEntry[];
}

export interface StudentRecapSummary {
  studentId: string;
  studentNis: string;
  studentName: string;
  className: string;
  gender: Gender;
  totalSessions: number;
  hadir: number;
  terlambat: number;
  sakit: number;
  izin: number;
  alpa: number;
  attendanceRate: number; // percentage e.g. 95.0
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  studentNisn: string;
  className: string;
  date: string; // YYYY-MM-DD
  checkInTime: string | null; // HH:mm:ss
  checkOutTime: string | null; // HH:mm:ss
  status: AttendanceStatus;
  method: AttendanceMethod;
  notes?: string;
  verifiedBy?: string;
  temperature?: number;
  deviceLocation?: string;
  subjectName?: string;
  sessionId?: string;
}

export interface AttendanceStats {
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  permissionCount: number;
  sickCount: number;
  absentCount: number;
  attendanceRate: number; // percentage e.g. 96.4
  punctualityRate: number; // percentage
}

export interface DailyAttendanceChartData {
  day: string;
  date: string;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpa: number;
  persentase: number;
}

export interface ClassAttendanceSummary {
  classId: string;
  className: string;
  totalStudents: number;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpa: number;
  persentase: number;
}

export type Gender = "L" | "P";

export type StudentStatus = "AKTIF" | "LULUS" | "MUTASI" | "NON_AKTIF";

export interface ClassHistoryItem {
  year: string;
  className: string;
  note?: string;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  fullName: string;
  gender: Gender;
  classId: string;
  className: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  address: string;
  rfidCardUid?: string;
  status: StudentStatus;
  avatarUrl?: string;
  academicYear?: string;
  classHistory?: ClassHistoryItem[];
  createdAt: string;
}

export type TeacherRole =
  | "KEPALA_SEKOLAH"
  | "WAKIL_KEPALA"
  | "GURU_MAPEL"
  | "WALI_KELAS"
  | "TATA_USAHA"
  | "PETUGAS_PIKET";

export interface TeachingScheduleItem {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  className: string;
  subjectName: string;
  room: string;
}

export interface Teacher {
  id: string;
  nip: string;
  nuptk: string;
  fullName: string;
  title: string;
  email: string;
  phone: string;
  role: TeacherRole;
  subjects: string[];
  isHomeroom: boolean;
  assignedClass?: string;
  status: "AKTIF" | "CUTI" | "NON_AKTIF";
  avatarUrl?: string;
  teachingSchedule?: TeachingScheduleItem[];
}

export type ClassLevel = "X" | "XI" | "XII";
export type Major = "MIPA" | "IPS" | "UMUM";

export interface SchoolClass {
  id: string;
  name: string;
  level: ClassLevel;
  major: Major;
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  studentCount: number;
  roomNumber: string;
  academicYear: string;
  isArchived?: boolean;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category: "WAJIB" | "PEMINATAN" | "MUATAN_LOKAL";
  creditHours: number;
  teacherCount: number;
  isActive?: boolean;
  teacherNames?: string[];
}

export type DayOfWeek = "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU";

export interface ScheduleItem {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  room: string;
}

export type PermissionType = "IZIN" | "SAKIT" | "DISPENSASI";
export type PermissionStatus = "MENUNGGU" | "DISETUJUI" | "DITOLAK";

export interface PermissionRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  className: string;
  type: PermissionType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentName?: string;
  attachmentUrl?: string;
  status: PermissionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
}

export type UserRole = "ADMIN" | "KEPALA_SEKOLAH" | "GURU" | "TATA_USAHA" | "SISWA";

export interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  institution: string;
  avatarUrl?: string;
  lastLogin?: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

export interface SchoolSetting {
  id: string;
  schoolName: string;
  npsn: string;
  address?: string;
  phone?: string;
  email?: string;
  minAttendancePercentage?: number;
  timezone?: string;
  allowSelfPermission?: boolean;
  entryThreshold?: string;
  lateLimit?: string;
  exitTimeRegular?: string;
  exitTimeFriday?: string;
  toleranceMinutes?: number;
  telegramNotification?: boolean;
  whatsappNotification?: boolean;
}

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  role: string;
  roleLabel?: string;
  institution?: string;
  status: "AKTIF" | "NONAKTIF";
  lastLogin?: string;
  lastLoginAt?: string;
}

export type FeatureImplementationStatus = "IMPLEMENTED" | "IN_PROGRESS" | "NOT_IMPLEMENTED";
export type FeatureMaintenanceStatus = "ACTIVE" | "MAINTENANCE";

export interface FeatureRegistryItem {
  key: string;
  name: string;
  description: string;
  category: string;
  route: string;
  implementationStatus: FeatureImplementationStatus;
  isEnabled: boolean;
  maintenanceStatus: FeatureMaintenanceStatus;
  maintenanceMessage?: string | null;
  requiredPermissions: string[];
  dependencies: string[];
  updatedById?: string | null;
  updatedByName?: string | null;
  lastChangedAt: string;
  changeNotes?: string | null;
}

