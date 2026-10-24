import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(3, "Username atau NIP/NIS minimal 3 karakter"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  rememberMe: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const manualAttendanceSchema = z.object({
  studentId: z.string().min(1, "Siswa harus dipilih"),
  classId: z.string().min(1, "Kelas harus dipilih"),
  status: z.enum(["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "ALPA"]),
  checkInTime: z.string().optional(),
  notes: z.string().max(200, "Catatan maksimal 200 karakter").optional(),
});

export type ManualAttendanceInput = z.infer<typeof manualAttendanceSchema>;

export const permissionRequestSchema = z.object({
  studentId: z.string().min(1, "Pilih siswa yang mengajukan izin"),
  type: z.enum(["IZIN", "SAKIT", "DISPENSASI"]),
  startDate: z.string().min(10, "Tanggal mulai harus diisi"),
  endDate: z.string().min(10, "Tanggal selesai harus diisi"),
  reason: z.string().min(10, "Alasan perizinan minimal 10 karakter"),
  attachmentName: z.string().optional(),
});

export type PermissionRequestInput = z.infer<typeof permissionRequestSchema>;

export const studentFormSchema = z.object({
  nis: z.string().regex(/^\d{4,6}$/, "NIS harus berupa 4-6 digit angka"),
  nisn: z.string().regex(/^\d{10}$/, "NISN harus 10 digit angka"),
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  gender: z.enum(["L", "P"], { required_error: "Pilih jenis kelamin" }),
  classId: z.string().min(1, "Kelas wajib dipilih"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  parentName: z.string().min(3, "Nama orang tua/wali wajib diisi"),
  parentPhone: z.string().min(10, "Nomor telepon orang tua minimal 10 digit"),
  address: z.string().min(5, "Alamat domisili minimal 5 karakter"),
  rfidCardUid: z.string().optional(),
  status: z.enum(["AKTIF", "LULUS", "MUTASI", "NON_AKTIF"]).default("AKTIF"),
  academicYear: z.string().default("2026/2027"),
});

export type StudentFormInput = z.infer<typeof studentFormSchema>;

export const teacherFormSchema = z.object({
  nip: z.string().min(8, "NIP/Kode Guru minimal 8 karakter"),
  nuptk: z.string().min(16, "NUPTK harus 16 digit").or(z.literal("")),
  fullName: z.string().min(3, "Nama lengkap beserta gelar minimal 3 karakter"),
  title: z.string().min(3, "Jabatan / bidang tugas minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  phone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  role: z.enum([
    "KEPALA_SEKOLAH",
    "WAKIL_KEPALA",
    "GURU_MAPEL",
    "WALI_KELAS",
    "TATA_USAHA",
    "PETUGAS_PIKET",
  ]),
  subjects: z.array(z.string()).min(1, "Minimal pilih 1 mata pelajaran yang diampu"),
  isHomeroom: z.boolean().default(false),
  assignedClass: z.string().optional(),
  status: z.enum(["AKTIF", "CUTI", "NON_AKTIF"]).default("AKTIF"),
});

export type TeacherFormInput = z.infer<typeof teacherFormSchema>;

export const classFormSchema = z.object({
  name: z.string().min(3, "Nama rombel minimal 3 karakter (misal: X MIPA 1)"),
  level: z.enum(["X", "XI", "XII"], { required_error: "Pilih tingkat/jenjang" }),
  major: z.enum(["MIPA", "IPS", "UMUM"], { required_error: "Pilih peminatan/jurusan" }),
  homeroomTeacherId: z.string().min(1, "Wali kelas wajib dipilih"),
  roomNumber: z.string().min(3, "Nomor ruangan wajib diisi (misal: R.101)"),
  academicYear: z.string().min(4, "Tahun ajaran wajib diisi (misal: 2026/2027)"),
});

export type ClassFormInput = z.infer<typeof classFormSchema>;

export const subjectFormSchema = z.object({
  code: z.string().min(2, "Kode mapel minimal 2 karakter (misal: MAT-W)"),
  name: z.string().min(3, "Nama mata pelajaran minimal 3 karakter"),
  category: z.enum(["WAJIB", "PEMINATAN", "MUATAN_LOKAL"]),
  creditHours: z.coerce.number().min(1, "Minimal 1 JP").max(8, "Maksimal 8 JP"),
  isActive: z.boolean().default(true),
  assignedTeachers: z.array(z.string()).optional(),
});

export type SubjectFormInput = z.infer<typeof subjectFormSchema>;

export const scheduleFormSchema = z.object({
  classId: z.string().min(1, "Pilih rombel/kelas"),
  subjectId: z.string().min(1, "Pilih mata pelajaran"),
  teacherId: z.string().min(1, "Pilih guru pengampu"),
  day: z.enum(["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"], {
    required_error: "Pilih hari pembelajaran",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam mulai JJ:MM (07:00)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam selesai JJ:MM (08:30)"),
  room: z.string().min(2, "Lokasi ruangan wajib diisi"),
}).refine(
  (data) => {
    return data.startTime < data.endTime;
  },
  {
    message: "Jam selesai harus lebih akhir dari jam mulai",
    path: ["endTime"],
  }
);

export type ScheduleFormInput = z.infer<typeof scheduleFormSchema>;

export const userAccountSchema = z.object({
  username: z.string().min(3, "Username / NIP / NIS minimal 3 karakter"),
  fullName: z.string().min(3, "Nama pengguna minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  role: z.enum(["ADMIN", "KEPALA_SEKOLAH", "GURU", "TATA_USAHA", "SISWA"], {
    required_error: "Pilih peran pengguna",
  }),
  status: z.enum(["AKTIF", "NONAKTIF"]).default("AKTIF"),
  institution: z.string().default("SMA PB Ngrayun"),
});

export type UserAccountInput = z.infer<typeof userAccountSchema>;

export const schoolSettingsSchema = z.object({
  schoolName: z.string().min(5, "Nama sekolah wajib diisi"),
  npsn: z.string().length(8, "NPSN harus 8 digit"),
  entryThreshold: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam JJ:MM"),
  lateLimit: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam JJ:MM"),
  exitTimeRegular: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam JJ:MM"),
  exitTimeFriday: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam JJ:MM"),
  toleranceMinutes: z.number().min(0).max(60),
  telegramNotification: z.boolean().default(true),
  whatsappNotification: z.boolean().default(true),
  enableGps: z.boolean().default(true).optional(),
  schoolLatitude: z.coerce.number().optional(),
  schoolLongitude: z.coerce.number().optional(),
  maxGpsRadiusMeters: z.coerce.number().min(10).max(5000).default(100).optional(),
  maxGpsAccuracyMeters: z.coerce.number().min(5).max(500).default(50).optional(),
});

export type SchoolSettingsInput = z.infer<typeof schoolSettingsSchema>;

export const attendanceSessionFormSchema = z.object({
  classId: z.string().min(1, "Rombel/Kelas wajib dipilih"),
  subjectId: z.string().min(1, "Mata pelajaran wajib dipilih"),
  teacherId: z.string().min(1, "Guru pengampu wajib dipilih"),
  date: z.string().min(10, "Tanggal pelaksanaan wajib diisi"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam mulai JJ:MM"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam selesai JJ:MM"),
  room: z.string().min(2, "Ruang kelas wajib diisi"),
  notes: z.string().optional(),
  token: z.string().optional(),
  barcode: z.string().optional(),
  radiusMeters: z.coerce.number().min(10).max(5000).default(100).optional(),
  enableGps: z.boolean().default(true).optional(),
});

export type AttendanceSessionFormInput = z.infer<typeof attendanceSessionFormSchema>;
