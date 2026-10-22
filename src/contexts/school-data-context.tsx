"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Student,
  Teacher,
  SchoolClass,
  Subject,
  ScheduleItem,
  DayOfWeek,
  AttendanceSessionItem,
  AttendanceRecord,
  StudentRecapSummary,
  PermissionRequest,
  SessionStatus,
  StudentAttendanceEntry,
  AttendanceStatus,
  SchoolSetting,
} from "@/types";
import {
  StudentFormInput,
  TeacherFormInput,
  ClassFormInput,
  SubjectFormInput,
  ScheduleFormInput,
  AttendanceSessionFormInput,
  PermissionRequestInput,
} from "@/lib/validators";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuth } from "./auth-context";

export interface ConflictValidationResult {
  hasConflict: boolean;
  conflicts: string[];
}

interface SchoolDataContextValue {
  isLoadingData: boolean;
  dataError: string | null;
  refreshData: () => Promise<void>;

  // Students
  students: Student[];
  addStudent: (data: StudentFormInput) => Promise<Student>;
  updateStudent: (id: string, data: Partial<Student>) => Promise<void>;
  toggleStudentStatus: (id: string) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;

  // Teachers
  teachers: Teacher[];
  addTeacher: (data: TeacherFormInput) => Promise<Teacher>;
  updateTeacher: (id: string, data: Partial<Teacher>) => Promise<void>;
  toggleTeacherStatus: (id: string) => Promise<void>;

  // Classes
  classes: SchoolClass[];
  addClass: (data: ClassFormInput) => Promise<SchoolClass>;
  updateClass: (id: string, data: Partial<SchoolClass>) => Promise<void>;
  archiveClass: (id: string) => void;

  // Subjects
  subjects: Subject[];
  addSubject: (data: SubjectFormInput) => Promise<Subject>;
  updateSubject: (id: string, data: Partial<Subject>) => Promise<void>;
  toggleSubjectStatus: (id: string) => Promise<void>;

  // Schedules
  schedules: ScheduleItem[];
  addSchedule: (data: ScheduleFormInput) => Promise<{ success: boolean; error?: string }>;
  updateSchedule: (
    id: string,
    data: ScheduleFormInput
  ) => Promise<{ success: boolean; error?: string }>;
  deleteSchedule: (id: string) => Promise<void>;
  validateScheduleConflict: (
    item: Omit<ScheduleItem, "id">,
    ignoreId?: string
  ) => ConflictValidationResult;

  // Attendance Sessions
  sessions: AttendanceSessionItem[];
  createSession: (data: AttendanceSessionFormInput) => Promise<AttendanceSessionItem>;
  saveAttendanceSession: (
    sessionId: string,
    entries: StudentAttendanceEntry[],
    isDraft: boolean,
    notes?: string
  ) => Promise<void>;
  updateSessionStatus: (sessionId: string, status: SessionStatus) => Promise<void>;

  // Attendance Records & Recaps
  attendanceRecords: AttendanceRecord[];
  addAttendanceRecord: (record: Omit<AttendanceRecord, "id">) => void;
  studentRecaps: StudentRecapSummary[];

  // Permissions
  permissions: PermissionRequest[];
  addPermission: (data: PermissionRequestInput) => Promise<PermissionRequest>;
  reviewPermission: (
    id: string,
    status: "DISETUJUI" | "DITOLAK",
    reviewedBy: string,
    reviewNotes?: string
  ) => Promise<void>;

  // School Settings
  schoolSettings: SchoolSetting | null;
  updateSchoolSettings: (data: Partial<SchoolSetting>) => Promise<void>;
}

const SchoolDataContext = React.createContext<SchoolDataContextValue | undefined>(
  undefined
);

// Helper for time calculation
function timeToMinutes(t: string): number {
  const parts = t.split(":").map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
  return parts[0] * 60 + parts[1];
}

function intervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return (
    timeToMinutes(startA) < timeToMinutes(endB) &&
    timeToMinutes(endA) > timeToMinutes(startB)
  );
}

export function SchoolDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [isLoadingData, setIsLoadingData] = React.useState<boolean>(true);
  const [dataError, setDataError] = React.useState<string | null>(null);

  const [students, setStudents] = React.useState<Student[]>([]);
  const [teachers, setTeachers] = React.useState<Teacher[]>([]);
  const [classes, setClasses] = React.useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);
  const [sessions, setSessions] = React.useState<AttendanceSessionItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = React.useState<AttendanceRecord[]>([]);
  const [studentRecaps, setStudentRecaps] = React.useState<StudentRecapSummary[]>([]);
  const [permissions, setPermissions] = React.useState<PermissionRequest[]>([]);
  const [schoolSettings, setSchoolSettings] = React.useState<SchoolSetting | null>(null);

  // Fetch initial data from live backend
  const refreshData = React.useCallback(async () => {
    setIsLoadingData(true);
    setDataError(null);

    try {
      const [
        studentsRes,
        teachersRes,
        classesRes,
        subjectsRes,
        schedulesRes,
        sessionsRes,
        permissionsRes,
        settingsRes,
      ] = await Promise.allSettled([
        apiClient.get<any[]>('/students?limit=100'),
        apiClient.get<any[]>('/teachers?limit=100'),
        apiClient.get<any[]>('/classes'),
        apiClient.get<any[]>('/subjects'),
        apiClient.get<any[]>('/schedules'),
        apiClient.get<any[]>('/attendance/sessions?limit=50'),
        apiClient.get<any[]>('/permissions?limit=50'),
        apiClient.get<any>('/settings'),
      ]);

      // 1. Classes
      let loadedClasses: SchoolClass[] = [];
      if (classesRes.status === 'fulfilled' && Array.isArray(classesRes.value.data)) {
        loadedClasses = classesRes.value.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          level: c.level,
          major: c.major,
          homeroomTeacherId: c.homeroomTeacherId || '',
          homeroomTeacherName: c.homeroomTeacher?.fullName || 'Belum Ditentukan',
          studentCount: c._count?.students || (c.students ? c.students.length : 0),
          roomNumber: c.roomNumber || 'R. 101',
          academicYear: '2025/2026',
          isArchived: false,
        }));
        setClasses(loadedClasses);
      }

      // 2. Students
      let loadedStudents: Student[] = [];
      if (studentsRes.status === 'fulfilled' && Array.isArray(studentsRes.value.data)) {
        loadedStudents = studentsRes.value.data.map((s: any) => {
          const targetClass = loadedClasses.find((c) => c.id === s.classId);
          return {
            id: s.id,
            nis: s.nis,
            nisn: s.nisn,
            fullName: s.fullName,
            gender: s.gender,
            classId: s.classId,
            className: s.currentClass?.name || targetClass?.name || 'Kelas',
            phone: s.phone || '',
            parentName: s.parentName || '',
            parentPhone: s.parentPhone || '',
            address: s.address || '',
            rfidCardUid: s.rfidCardUid || undefined,
            status: s.status,
            createdAt: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '',
            academicYear: '2025/2026',
          };
        });
        setStudents(loadedStudents);
      }

      // 3. Teachers
      let loadedTeachers: Teacher[] = [];
      if (teachersRes.status === 'fulfilled' && Array.isArray(teachersRes.value.data)) {
        loadedTeachers = teachersRes.value.data.map((t: any) => ({
          id: t.id,
          nip: t.nip,
          nuptk: t.nuptk || '-',
          fullName: t.fullName,
          title: t.title || '',
          email: t.email || '',
          phone: t.phone || '',
          role: t.isHomeroom ? 'WALI_KELAS' : 'GURU_MAPEL',
          subjects: t.teachingAssignments?.map((ta: any) => ta.subject?.name).filter(Boolean) || [],
          isHomeroom: t.isHomeroom,
          assignedClass: t.homeroomClasses?.[0]?.name,
          status: t.status,
        }));
        setTeachers(loadedTeachers);
      }

      // 4. Subjects
      let loadedSubjects: Subject[] = [];
      if (subjectsRes.status === 'fulfilled' && Array.isArray(subjectsRes.value.data)) {
        loadedSubjects = subjectsRes.value.data.map((sb: any) => ({
          id: sb.id,
          code: sb.code,
          name: sb.name,
          category: sb.category,
          creditHours: sb.creditHours,
          teacherCount: sb.teachingAssignments?.length || 1,
          isActive: sb.isActive !== false,
          teacherNames: sb.teachingAssignments?.map((ta: any) => ta.teacher?.fullName).filter(Boolean) || [],
        }));
        setSubjects(loadedSubjects);
      }

      // 5. Schedules
      if (schedulesRes.status === 'fulfilled' && Array.isArray(schedulesRes.value.data)) {
        const loadedSchedules: ScheduleItem[] = schedulesRes.value.data.map((sc: any) => ({
          id: sc.id,
          classId: sc.classId,
          className: sc.schoolClass?.name || 'Kelas',
          subjectId: sc.subjectId,
          subjectName: sc.subject?.name || 'Mata Pelajaran',
          teacherId: sc.teacherId,
          teacherName: sc.teacher?.fullName || 'Guru Pengampu',
          day: sc.dayOfWeek,
          startTime: sc.startTime,
          endTime: sc.endTime,
          room: sc.room,
        }));
        setSchedules(loadedSchedules);
      }

      // 6. Attendance Sessions & Records
      if (sessionsRes.status === 'fulfilled' && Array.isArray(sessionsRes.value.data)) {
        const extractedRecords: AttendanceRecord[] = [];
        const loadedSessions: AttendanceSessionItem[] = sessionsRes.value.data.map((ses: any) => {
          const records = Array.isArray(ses.records) ? ses.records : [];
          const entries: StudentAttendanceEntry[] = records.map((r: any) => {
            const entry: StudentAttendanceEntry = {
              studentId: r.studentId,
              studentNis: r.student?.nis || '',
              studentNisn: r.student?.nisn || '',
              studentName: r.student?.fullName || 'Siswa',
              gender: r.student?.gender || 'L',
              status: r.status,
              notes: r.notes || undefined,
              checkInTime: r.checkInTime ? new Date(r.checkInTime).toLocaleTimeString('id-ID', { hour12: false }) : undefined,
            };

            // Collect to global records
            extractedRecords.push({
              id: r.id,
              studentId: r.studentId,
              studentName: r.student?.fullName || 'Siswa',
              studentNis: r.student?.nis || '',
              studentNisn: r.student?.nisn || '',
              className: ses.schoolClass?.name || '',
              date: ses.date ? new Date(ses.date).toISOString().split('T')[0] : '',
              checkInTime: entry.checkInTime || null,
              checkOutTime: null,
              status: r.status,
              method: r.method || 'MANUAL_TEACHER',
              notes: r.notes,
              verifiedBy: ses.teacher?.fullName,
              subjectName: ses.subject?.name,
              sessionId: ses.id,
            });

            return entry;
          });

          const marked = entries.filter((e) => e.status !== 'BELUM_DIISI').length;
          const present = entries.filter((e) => e.status === 'HADIR').length;
          const late = entries.filter((e) => e.status === 'TERLAMBAT').length;
          const sick = entries.filter((e) => e.status === 'SAKIT').length;
          const permission = entries.filter((e) => e.status === 'IZIN').length;
          const absent = entries.filter((e) => e.status === 'ALPA').length;

          let displayStatus: SessionStatus = ses.status;
          if (ses.status === 'DITUTUP') displayStatus = 'SUDAH_DISIMPAN';

          return {
            id: ses.id,
            date: ses.date ? new Date(ses.date).toISOString().split('T')[0] : '',
            classId: ses.classId,
            className: ses.schoolClass?.name || 'Kelas',
            teacherId: ses.teacherId,
            teacherName: ses.teacher?.fullName || 'Guru',
            subjectId: ses.subjectId,
            subjectName: ses.subject?.name || 'Mata Pelajaran',
            startTime: ses.startTime,
            endTime: ses.endTime,
            room: ses.room,
            status: displayStatus,
            totalStudents: entries.length || (ses.schoolClass?.students ? ses.schoolClass.students.length : 0),
            markedStudents: marked,
            presentCount: present,
            sickCount: sick,
            permissionCount: permission,
            absentCount: absent,
            lateCount: late,
            isDraft: ses.status === 'SEDANG_BERLANGSUNG',
            notes: ses.notes || undefined,
            entries,
          };
        });

        setSessions(loadedSessions);
        setAttendanceRecords(extractedRecords);

        // Derive studentRecaps
        const recapsMap: Record<string, StudentRecapSummary> = {};
        for (const s of loadedStudents) {
          recapsMap[s.id] = {
            studentId: s.id,
            studentNis: s.nis,
            studentName: s.fullName,
            className: s.className,
            gender: s.gender,
            totalSessions: 0,
            hadir: 0,
            terlambat: 0,
            sakit: 0,
            izin: 0,
            alpa: 0,
            attendanceRate: 100,
          };
        }

        for (const r of extractedRecords) {
          if (recapsMap[r.studentId]) {
            recapsMap[r.studentId].totalSessions++;
            if (r.status === 'HADIR') recapsMap[r.studentId].hadir++;
            else if (r.status === 'TERLAMBAT') recapsMap[r.studentId].terlambat++;
            else if (r.status === 'SAKIT') recapsMap[r.studentId].sakit++;
            else if (r.status === 'IZIN') recapsMap[r.studentId].izin++;
            else if (r.status === 'ALPA') recapsMap[r.studentId].alpa++;
          }
        }

        const calculatedRecaps = Object.values(recapsMap).map((recap) => {
          if (recap.totalSessions > 0) {
            recap.attendanceRate = Number(
              (((recap.hadir + recap.terlambat) / recap.totalSessions) * 100).toFixed(1)
            );
          }
          return recap;
        });

        setStudentRecaps(calculatedRecaps);
      }

      // 7. Permissions
      if (permissionsRes.status === 'fulfilled' && Array.isArray(permissionsRes.value.data)) {
        const loadedPermissions: PermissionRequest[] = permissionsRes.value.data.map((p: any) => ({
          id: p.id,
          studentId: p.studentId,
          studentName: p.student?.fullName || 'Siswa',
          studentNis: p.student?.nis || '',
          className: p.schoolClass?.name || '',
          type: p.type,
          startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
          endDate: p.endDate ? new Date(p.endDate).toISOString().split('T')[0] : '',
          totalDays: p.totalDays || 1,
          reason: p.reason,
          attachmentName: p.attachmentName || undefined,
          attachmentUrl: p.attachmentUrl || undefined,
          status: p.status,
          reviewedBy: p.reviewedBy?.fullName || undefined,
          reviewedAt: p.reviewedAt ? new Date(p.reviewedAt).toISOString().replace('T', ' ').slice(0, 16) : undefined,
          reviewNotes: p.reviewNotes || undefined,
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString().replace('T', ' ').slice(0, 16) : '',
        }));
        setPermissions(loadedPermissions);
      }

      // 8. School Settings
      if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
        setSchoolSettings(settingsRes.value.data);
      }
    } catch (err: any) {
      const msg = err.message || 'Gagal memuat data akademik dari backend API';
      setDataError(msg);
      toast.error('Gagal Sinkronisasi Data', { description: msg });
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  React.useEffect(() => {
    refreshData();
  }, [refreshData, isAuthenticated]);

  // ==========================================
  // STUDENTS CRUD (Live API)
  // ==========================================
  const addStudent = React.useCallback(
    async (data: StudentFormInput): Promise<Student> => {
      try {
        const res = await apiClient.post<any>('/students', {
          nis: data.nis,
          nisn: data.nisn,
          fullName: data.fullName,
          gender: data.gender,
          classId: data.classId,
          phone: data.phone || undefined,
          parentName: data.parentName || undefined,
          parentPhone: data.parentPhone || undefined,
          address: data.address || undefined,
          status: data.status,
        });

        const created = res.data;
        const selectedClass = classes.find((c) => c.id === data.classId);

        const newStudent: Student = {
          id: created.id,
          nis: created.nis,
          nisn: created.nisn,
          fullName: created.fullName,
          gender: created.gender,
          classId: created.classId,
          className: created.currentClass?.name || selectedClass?.name || "Kelas",
          phone: created.phone || "",
          parentName: created.parentName || "",
          parentPhone: created.parentPhone || "",
          address: created.address || "",
          rfidCardUid: created.rfidCardUid || undefined,
          status: created.status,
          academicYear: data.academicYear,
          createdAt: new Date().toISOString().split("T")[0],
        };

        setStudents((prev) => [newStudent, ...prev]);

        if (selectedClass) {
          setClasses((prev) =>
            prev.map((c) =>
              c.id === selectedClass.id
                ? { ...c, studentCount: c.studentCount + 1 }
                : c
            )
          );
        }

        toast.success("Siswa Berhasil Ditambahkan", {
          description: `${newStudent.fullName} (${newStudent.nis}) terdaftar di ${newStudent.className}.`,
        });

        return newStudent;
      } catch (err: any) {
        toast.error("Gagal Menambah Siswa", {
          description: err.message || "Terjadi kesalahan saat menyimpan data siswa ke backend.",
        });
        throw err;
      }
    },
    [classes]
  );

  const updateStudent = React.useCallback(
    async (id: string, data: Partial<Student>) => {
      try {
        const updatePayload: any = {};
        if (data.nis) updatePayload.nis = data.nis;
        if (data.nisn) updatePayload.nisn = data.nisn;
        if (data.fullName) updatePayload.fullName = data.fullName;
        if (data.gender) updatePayload.gender = data.gender;
        if (data.classId) updatePayload.classId = data.classId;
        if (data.phone !== undefined) updatePayload.phone = data.phone;
        if (data.parentName !== undefined) updatePayload.parentName = data.parentName;
        if (data.parentPhone !== undefined) updatePayload.parentPhone = data.parentPhone;
        if (data.address !== undefined) updatePayload.address = data.address;
        if (data.status) updatePayload.status = data.status;

        await apiClient.patch(`/students/${id}`, updatePayload);

        setStudents((prev) =>
          prev.map((s) => {
            if (s.id !== id) return s;
            const updatedClass = data.classId
              ? classes.find((c) => c.id === data.classId)
              : undefined;
            return {
              ...s,
              ...data,
              className: updatedClass ? updatedClass.name : s.className,
            };
          })
        );

        toast.success("Data Siswa Berhasil Diperbarui", {
          description: "Perubahan informasi kesiswaan telah tersimpan di server.",
        });
      } catch (err: any) {
        toast.error("Gagal Memperbarui Siswa", {
          description: err.message || "Gagal mengirim perubahan data siswa ke server.",
        });
        throw err;
      }
    },
    [classes]
  );

  const toggleStudentStatus = React.useCallback(async (id: string) => {
    const student = students.find((s) => s.id === id);
    if (!student) return;

    const nextStatus = student.status === "AKTIF" ? "NON_AKTIF" : "AKTIF";
    try {
      await apiClient.patch(`/students/${id}`, { status: nextStatus });
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
      );
      toast.info(
        `Status ${student.fullName} diubah menjadi ${
          nextStatus === "AKTIF" ? "Aktif" : "Non-Aktif"
        }`
      );
    } catch (err: any) {
      toast.error("Gagal Mengubah Status", { description: err.message });
      throw err;
    }
  }, [students]);

  const deleteStudent = React.useCallback(async (id: string) => {
    const target = students.find((s) => s.id === id);
    try {
      await apiClient.delete(`/students/${id}`);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success(
        target
          ? `Data siswa ${target.fullName} berhasil dihapus/dinonaktifkan.`
          : "Data siswa berhasil diproses."
      );
    } catch (err: any) {
      toast.error("Gagal Menghapus Siswa", { description: err.message });
      throw err;
    }
  }, [students]);

  // ==========================================
  // TEACHERS CRUD (Live API)
  // ==========================================
  const addTeacher = React.useCallback(
    async (data: TeacherFormInput): Promise<Teacher> => {
      try {
        const res = await apiClient.post<any>('/teachers', {
          nip: data.nip,
          nuptk: data.nuptk || undefined,
          fullName: data.fullName,
          title: data.title || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          roleTitle: data.role === 'WALI_KELAS' ? 'Wali Kelas' : 'Guru Mata Pelajaran',
          isHomeroom: data.isHomeroom,
          status: data.status,
        });

        const created = res.data;
        const newTeacher: Teacher = {
          id: created.id,
          nip: created.nip,
          nuptk: created.nuptk || "-",
          fullName: created.fullName,
          title: created.title || "",
          email: created.email || "",
          phone: created.phone || "",
          role: data.role,
          subjects: data.subjects || [],
          isHomeroom: data.isHomeroom,
          assignedClass: data.assignedClass,
          status: created.status,
        };

        setTeachers((prev) => [newTeacher, ...prev]);

        toast.success("Tenaga Pendidik Berhasil Ditambahkan", {
          description: `${newTeacher.fullName} terdaftar dengan NIP ${newTeacher.nip}.`,
        });

        return newTeacher;
      } catch (err: any) {
        toast.error("Gagal Menambah Guru", { description: err.message });
        throw err;
      }
    },
    []
  );

  const updateTeacher = React.useCallback(async (id: string, data: Partial<Teacher>) => {
    try {
      const updatePayload: any = {};
      if (data.nip) updatePayload.nip = data.nip;
      if (data.nuptk !== undefined) updatePayload.nuptk = data.nuptk;
      if (data.fullName) updatePayload.fullName = data.fullName;
      if (data.title !== undefined) updatePayload.title = data.title;
      if (data.email !== undefined) updatePayload.email = data.email;
      if (data.phone !== undefined) updatePayload.phone = data.phone;
      if (data.isHomeroom !== undefined) updatePayload.isHomeroom = data.isHomeroom;
      if (data.status) updatePayload.status = data.status;

      await apiClient.patch(`/teachers/${id}`, updatePayload);

      setTeachers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...data } : t))
      );
      toast.success("Data Guru Berhasil Diperbarui");
    } catch (err: any) {
      toast.error("Gagal Memperbarui Guru", { description: err.message });
      throw err;
    }
  }, []);

  const toggleTeacherStatus = React.useCallback(async (id: string) => {
    const teacher = teachers.find((t) => t.id === id);
    if (!teacher) return;

    const nextStatus = teacher.status === "AKTIF" ? "NON_AKTIF" : "AKTIF";
    try {
      await apiClient.patch(`/teachers/${id}`, { status: nextStatus });
      setTeachers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
      );
      toast.info(
        `Status ${teacher.fullName} diperbarui menjadi ${
          nextStatus === "AKTIF" ? "Aktif" : "Non-Aktif"
        }`
      );
    } catch (err: any) {
      toast.error("Gagal Mengubah Status Guru", { description: err.message });
      throw err;
    }
  }, [teachers]);

  // ==========================================
  // CLASSES CRUD (Live API)
  // ==========================================
  const addClass = React.useCallback(
    async (data: ClassFormInput): Promise<SchoolClass> => {
      try {
        const res = await apiClient.post<any>('/classes', {
          name: data.name,
          level: data.level,
          major: data.major,
          roomNumber: data.roomNumber || undefined,
          homeroomTeacherId: data.homeroomTeacherId || undefined,
        });

        const created = res.data;
        const teacher = teachers.find((t) => t.id === data.homeroomTeacherId);

        const newClass: SchoolClass = {
          id: created.id,
          name: created.name,
          level: created.level,
          major: created.major,
          homeroomTeacherId: data.homeroomTeacherId,
          homeroomTeacherName: teacher ? teacher.fullName : "Belum Ditentukan",
          studentCount: 0,
          roomNumber: created.roomNumber || data.roomNumber,
          academicYear: data.academicYear,
          isArchived: false,
        };

        setClasses((prev) => [...prev, newClass]);

        toast.success("Rombongan Belajar Dibuat", {
          description: `Kelas ${newClass.name} berhasil ditambahkan ke sistem.`,
        });

        return newClass;
      } catch (err: any) {
        toast.error("Gagal Membuat Kelas", { description: err.message });
        throw err;
      }
    },
    [teachers]
  );

  const updateClass = React.useCallback(
    async (id: string, data: Partial<SchoolClass>) => {
      try {
        await apiClient.patch(`/classes/${id}`, {
          name: data.name,
          level: data.level,
          major: data.major,
          roomNumber: data.roomNumber,
          homeroomTeacherId: data.homeroomTeacherId,
        });

        setClasses((prev) =>
          prev.map((c) => {
            if (c.id !== id) return c;
            const teacher = data.homeroomTeacherId
              ? teachers.find((t) => t.id === data.homeroomTeacherId)
              : undefined;

            return {
              ...c,
              ...data,
              homeroomTeacherName: teacher
                ? teacher.fullName
                : data.homeroomTeacherName || c.homeroomTeacherName,
            };
          })
        );
        toast.success("Data Kelas Berhasil Diperbarui");
      } catch (err: any) {
        toast.error("Gagal Memperbarui Kelas", { description: err.message });
        throw err;
      }
    },
    [teachers]
  );

  const archiveClass = React.useCallback((id: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const newArchived = !c.isArchived;
        toast.info(
          `Kelas ${c.name} telah ${newArchived ? "diarsipkan" : "diaktifkan kembali"}.`
        );
        return { ...c, isArchived: newArchived };
      })
    );
  }, []);

  // ==========================================
  // SUBJECTS CRUD (Live API)
  // ==========================================
  const addSubject = React.useCallback(
    async (data: SubjectFormInput): Promise<Subject> => {
      try {
        const res = await apiClient.post<any>('/subjects', {
          code: data.code.toUpperCase(),
          name: data.name,
          category: data.category,
          creditHours: Number(data.creditHours) || 2,
          isActive: data.isActive,
        });

        const created = res.data;
        const newSubject: Subject = {
          id: created.id,
          code: created.code,
          name: created.name,
          category: created.category,
          creditHours: created.creditHours,
          teacherCount: 1,
          isActive: created.isActive,
          teacherNames: data.assignedTeachers || [],
        };

        setSubjects((prev) => [...prev, newSubject]);
        toast.success("Mata Pelajaran Ditambahkan", {
          description: `${newSubject.name} (${newSubject.code}) telah ditambahkan ke kurikulum.`,
        });

        return newSubject;
      } catch (err: any) {
        toast.error("Gagal Menambah Mapel", { description: err.message });
        throw err;
      }
    },
    []
  );

  const updateSubject = React.useCallback(
    async (id: string, data: Partial<Subject>) => {
      try {
        await apiClient.patch(`/subjects/${id}`, {
          code: data.code,
          name: data.name,
          category: data.category,
          creditHours: data.creditHours,
          isActive: data.isActive,
        });

        setSubjects((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...data } : s))
        );
        toast.success("Mata Pelajaran Berhasil Diperbarui");
      } catch (err: any) {
        toast.error("Gagal Memperbarui Mapel", { description: err.message });
        throw err;
      }
    },
    []
  );

  const toggleSubjectStatus = React.useCallback(async (id: string) => {
    const subject = subjects.find((s) => s.id === id);
    if (!subject) return;

    const nextState = !subject.isActive;
    try {
      await apiClient.patch(`/subjects/${id}`, { isActive: nextState });
      setSubjects((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: nextState } : s))
      );
      toast.info(
        `Mata pelajaran ${subject.name} ${
          nextState ? "diaktifkan" : "dinonaktifkan"
        }`
      );
    } catch (err: any) {
      toast.error("Gagal Mengubah Status Mapel", { description: err.message });
      throw err;
    }
  }, [subjects]);

  // ==========================================
  // SCHEDULE CONFLICT VALIDATION & CRUD (Live API)
  // ==========================================
  const validateScheduleConflict = React.useCallback(
    (
      item: Omit<ScheduleItem, "id">,
      ignoreId?: string
    ): ConflictValidationResult => {
      const conflicts: string[] = [];

      for (const existing of schedules) {
        if (ignoreId && existing.id === ignoreId) continue;
        if (existing.day !== item.day) continue;

        const isOverlapping = intervalsOverlap(
          existing.startTime,
          existing.endTime,
          item.startTime,
          item.endTime
        );

        if (isOverlapping) {
          if (existing.teacherId === item.teacherId) {
            conflicts.push(
              `Benturan Guru: ${existing.teacherName} sudah terjadwal mengajar di kelas ${existing.className} (${existing.day} ${existing.startTime} - ${existing.endTime}).`
            );
          }
          if (
            existing.room.trim().toLowerCase() ===
            item.room.trim().toLowerCase()
          ) {
            conflicts.push(
              `Benturan Ruangan: Ruang ${existing.room} sudah dipakai oleh kelas ${existing.className} untuk mapel ${existing.subjectName} (${existing.day} ${existing.startTime} - ${existing.endTime}).`
            );
          }
          if (existing.classId === item.classId) {
            conflicts.push(
              `Benturan Rombel: Kelas ${existing.className} sudah memiliki jadwal mapel ${existing.subjectName} pada jam ${existing.startTime} - ${existing.endTime}.`
            );
          }
        }
      }

      return {
        hasConflict: conflicts.length > 0,
        conflicts,
      };
    },
    [schedules]
  );

  const addSchedule = React.useCallback(
    async (data: ScheduleFormInput): Promise<{ success: boolean; error?: string }> => {
      const cls = classes.find((c) => c.id === data.classId);
      const sbj = subjects.find((s) => s.id === data.subjectId);
      const tch = teachers.find((t) => t.id === data.teacherId);

      const candidate: Omit<ScheduleItem, "id"> = {
        classId: data.classId,
        className: cls ? cls.name : "Kelas",
        subjectId: data.subjectId,
        subjectName: sbj ? sbj.name : "Mata Pelajaran",
        teacherId: data.teacherId,
        teacherName: tch ? tch.fullName : "Guru Pengampu",
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
      };

      const validation = validateScheduleConflict(candidate);
      if (validation.hasConflict) {
        toast.error("Validasi Jadwal: Ditemukan Benturan Waktu", {
          description: validation.conflicts[0],
        });
        return { success: false, error: validation.conflicts[0] };
      }

      try {
        const res = await apiClient.post<any>('/schedules', {
          classId: data.classId,
          subjectId: data.subjectId,
          teacherId: data.teacherId,
          dayOfWeek: data.day,
          startTime: data.startTime,
          endTime: data.endTime,
          room: data.room,
        });

        const created = res.data;
        const newSchedule: ScheduleItem = {
          id: created.id,
          ...candidate,
        };

        setSchedules((prev) => [...prev, newSchedule]);
        toast.success("Jadwal Berhasil Ditambahkan", {
          description: `${newSchedule.subjectName} untuk ${newSchedule.className} (${newSchedule.day} ${newSchedule.startTime}-${newSchedule.endTime}).`,
        });

        return { success: true };
      } catch (err: any) {
        toast.error("Gagal Menambah Jadwal", { description: err.message });
        return { success: false, error: err.message };
      }
    },
    [classes, subjects, teachers, validateScheduleConflict]
  );

  const updateSchedule = React.useCallback(
    async (
      id: string,
      data: ScheduleFormInput
    ): Promise<{ success: boolean; error?: string }> => {
      const cls = classes.find((c) => c.id === data.classId);
      const sbj = subjects.find((s) => s.id === data.subjectId);
      const tch = teachers.find((t) => t.id === data.teacherId);

      const candidate: Omit<ScheduleItem, "id"> = {
        classId: data.classId,
        className: cls ? cls.name : "Kelas",
        subjectId: data.subjectId,
        subjectName: sbj ? sbj.name : "Mata Pelajaran",
        teacherId: data.teacherId,
        teacherName: tch ? tch.fullName : "Guru Pengampu",
        day: data.day,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
      };

      const validation = validateScheduleConflict(candidate, id);
      if (validation.hasConflict) {
        toast.error("Validasi Jadwal: Ditemukan Benturan Waktu", {
          description: validation.conflicts[0],
        });
        return { success: false, error: validation.conflicts[0] };
      }

      try {
        await apiClient.patch(`/schedules/${id}`, {
          classId: data.classId,
          subjectId: data.subjectId,
          teacherId: data.teacherId,
          dayOfWeek: data.day,
          startTime: data.startTime,
          endTime: data.endTime,
          room: data.room,
        });

        setSchedules((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...candidate } : s))
        );

        toast.success("Jadwal Berhasil Diperbarui");
        return { success: true };
      } catch (err: any) {
        toast.error("Gagal Memperbarui Jadwal", { description: err.message });
        return { success: false, error: err.message };
      }
    },
    [classes, subjects, teachers, validateScheduleConflict]
  );

  const deleteSchedule = React.useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/schedules/${id}`);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
      toast.success("Jadwal Pembelajaran Dihapus");
    } catch (err: any) {
      toast.error("Gagal Menghapus Jadwal", { description: err.message });
      throw err;
    }
  }, []);

  // ==========================================
  // ATTENDANCE SESSIONS & RECORDS (Live API)
  // ==========================================
  const createSession = React.useCallback(
    async (data: AttendanceSessionFormInput): Promise<AttendanceSessionItem> => {
      try {
        const res = await apiClient.post<any>('/attendance/sessions', {
          classId: data.classId,
          subjectId: data.subjectId,
          teacherId: data.teacherId,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          room: data.room,
          notes: data.notes || undefined,
        });

        const created = res.data;
        const cls = classes.find((c) => c.id === data.classId);
        const tch = teachers.find((t) => t.id === data.teacherId);
        const sbj = subjects.find((s) => s.id === data.subjectId);

        const classStudents = students.filter(
          (s) => s.classId === data.classId && s.status === "AKTIF"
        );

        const initialEntries: StudentAttendanceEntry[] = classStudents.map((s) => ({
          studentId: s.id,
          studentNis: s.nis,
          studentNisn: s.nisn,
          studentName: s.fullName,
          gender: s.gender,
          status: "BELUM_DIISI",
        }));

        const newSession: AttendanceSessionItem = {
          id: created.id,
          date: data.date,
          classId: data.classId,
          className: cls ? cls.name : "Kelas",
          teacherId: data.teacherId,
          teacherName: tch ? tch.fullName : "Guru",
          subjectId: data.subjectId,
          subjectName: sbj ? sbj.name : "Mata Pelajaran",
          startTime: data.startTime,
          endTime: data.endTime,
          room: data.room,
          status: "BELUM_DIMULAI",
          totalStudents: initialEntries.length,
          markedStudents: 0,
          presentCount: 0,
          sickCount: 0,
          permissionCount: 0,
          absentCount: 0,
          lateCount: 0,
          isDraft: false,
          notes: data.notes,
          entries: initialEntries,
        };

        setSessions((prev) => [newSession, ...prev]);

        toast.success("Sesi Pembelajaran Dibuat", {
          description: `Sesi ${newSession.subjectName} (${newSession.className}) siap untuk presensi.`,
        });

        return newSession;
      } catch (err: any) {
        toast.error("Gagal Membuat Sesi Absensi", { description: err.message });
        throw err;
      }
    },
    [classes, teachers, subjects, students]
  );

  const saveAttendanceSession = React.useCallback(
    async (
      sessionId: string,
      entries: StudentAttendanceEntry[],
      isDraft: boolean,
      notes?: string
    ) => {
      const marked = entries.filter((e) => e.status !== "BELUM_DIISI").length;
      const present = entries.filter((e) => e.status === "HADIR").length;
      const late = entries.filter((e) => e.status === "TERLAMBAT").length;
      const sick = entries.filter((e) => e.status === "SAKIT").length;
      const permission = entries.filter((e) => e.status === "IZIN").length;
      const absent = entries.filter((e) => e.status === "ALPA").length;

      let newStatus: SessionStatus = "SUDAH_DISIMPAN";
      if (isDraft) {
        newStatus = "SEDANG_BERLANGSUNG";
      } else if (absent > 0) {
        newStatus = "PERLU_DIPERIKSA";
      }

      try {
        if (!isDraft) {
          // Send batch records to backend
          const validRecords = entries
            .filter((e) => e.status !== "BELUM_DIISI")
            .map((e) => ({
              studentId: e.studentId,
              status: e.status as AttendanceStatus,
              method: "MANUAL_TEACHER",
              notes: e.notes || undefined,
            }));

          if (validRecords.length > 0) {
            await apiClient.post(`/attendance/sessions/${sessionId}/records`, {
              records: validRecords,
            });
          }
        }

        // Update local session state
        setSessions((prev) =>
          prev.map((s) => {
            if (s.id !== sessionId) return s;
            return {
              ...s,
              entries,
              status: newStatus,
              markedStudents: marked,
              presentCount: present,
              lateCount: late,
              sickCount: sick,
              permissionCount: permission,
              absentCount: absent,
              isDraft,
              lastUpdated: new Date().toISOString().replace("T", " ").slice(0, 16),
              notes: notes !== undefined ? notes : s.notes,
            };
          })
        );

        if (!isDraft) {
          const session = sessions.find((s) => s.id === sessionId);
          const sessionDate = session ? session.date : new Date().toISOString().split("T")[0];
          const newRecords: AttendanceRecord[] = entries
            .filter((e) => e.status !== "BELUM_DIISI")
            .map((e) => ({
              id: `rec-${sessionId}-${e.studentId}`,
              studentId: e.studentId,
              studentName: e.studentName,
              studentNis: e.studentNis,
              studentNisn: e.studentNisn || "",
              className: session ? session.className : "",
              date: sessionDate,
              checkInTime:
                e.checkInTime ||
                (e.status === "HADIR" || e.status === "TERLAMBAT" ? "07:30:00" : null),
              checkOutTime: null,
              status: e.status as AttendanceStatus,
              method: "MANUAL_TEACHER",
              notes: e.notes,
              verifiedBy: session ? session.teacherName : undefined,
              subjectName: session ? session.subjectName : undefined,
              sessionId: sessionId,
            }));

          setAttendanceRecords((prev) => {
            const filtered = prev.filter((r) => r.sessionId !== sessionId);
            return [...newRecords, ...filtered];
          });

          toast.success("Presensi Berhasil Disimpan ke Server", {
            description: `Data presensi (${present} Hadir, ${late} Terlambat, ${sick} Sakit, ${permission} Izin, ${absent} Alpa) tersimpan permanen.`,
          });
        } else {
          toast.info("Draft Presensi Tersimpan", {
            description: `Perubahan draft (${marked}/${entries.length} siswa ditandai) tersimpan.`,
          });
        }
      } catch (err: any) {
        toast.error("Gagal Menyimpan Presensi", {
          description: err.message || "Terjadi kendala saat mengirim data presensi ke server.",
        });
        throw err;
      }
    },
    [sessions]
  );

  const updateSessionStatus = React.useCallback(
    async (sessionId: string, status: SessionStatus) => {
      try {
        if (status === 'SUDAH_DISIMPAN' || status === 'PERLU_DIPERIKSA') {
          await apiClient.post(`/attendance/sessions/${sessionId}/close`, {});
        } else {
          await apiClient.patch(`/attendance/sessions/${sessionId}`, { status });
        }

        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, status } : s))
        );
        toast.info(`Status sesi diperbarui menjadi "${status}"`);
      } catch (err: any) {
        toast.error("Gagal Memperbarui Status Sesi", { description: err.message });
      }
    },
    []
  );

  const addAttendanceRecord = React.useCallback(
    (record: Omit<AttendanceRecord, "id">) => {
      const newRec: AttendanceRecord = {
        id: `att-${Date.now().toString().slice(-4)}`,
        ...record,
      };
      setAttendanceRecords((prev) => [newRec, ...prev]);
      toast.success(`Presensi manual untuk ${newRec.studentName} berhasil dicatat.`);
    },
    []
  );

  // ==========================================
  // PERMISSIONS (Live API)
  // ==========================================
  const addPermission = React.useCallback(
    async (data: PermissionRequestInput): Promise<PermissionRequest> => {
      try {
        const std = students.find((s) => s.id === data.studentId);
        const res = await apiClient.post<any>('/permissions', {
          studentId: data.studentId,
          classId: std?.classId || '',
          type: data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          reason: data.reason,
          attachmentName: data.attachmentName || undefined,
        });

        const created = res.data;
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        const newPerm: PermissionRequest = {
          id: created.id,
          studentId: data.studentId,
          studentName: std ? std.fullName : "Siswa",
          studentNis: std ? std.nis : "",
          className: std ? std.className : "",
          type: data.type,
          startDate: data.startDate,
          endDate: data.endDate,
          totalDays: isNaN(totalDays) ? 1 : totalDays,
          reason: data.reason,
          attachmentName: data.attachmentName,
          status: "MENUNGGU",
          createdAt: new Date().toISOString().replace("T", " ").slice(0, 16),
        };

        setPermissions((prev) => [newPerm, ...prev]);

        toast.success("Pengajuan Izin Berhasil Dikirim", {
          description: `Pengajuan izin ${newPerm.studentName} (${newPerm.type}) berstatus Menunggu Verifikasi.`,
        });

        return newPerm;
      } catch (err: any) {
        toast.error("Gagal Mengajukan Izin", { description: err.message });
        throw err;
      }
    },
    [students]
  );

  const reviewPermission = React.useCallback(
    async (
      id: string,
      status: "DISETUJUI" | "DITOLAK",
      reviewedBy: string,
      reviewNotes?: string
    ) => {
      try {
        const endpoint = status === "DISETUJUI" ? `/permissions/${id}/approve` : `/permissions/${id}/reject`;
        await apiClient.post(endpoint, {
          note: reviewNotes || (status === "DISETUJUI" ? "Disetujui pihak sekolah" : "Ditolak"),
        });

        setPermissions((prev) =>
          prev.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              status,
              reviewedBy,
              reviewedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
              reviewNotes: reviewNotes || (status === "DISETUJUI" ? "Disetujui pihak sekolah" : "Ditolak"),
            };
          })
        );

        toast[status === "DISETUJUI" ? "success" : "error"](
          status === "DISETUJUI" ? "Permohonan Izin Disetujui" : "Permohonan Izin Ditolak",
          {
            description: `Status izin telah diverifikasi oleh ${reviewedBy}.`,
          }
        );
      } catch (err: any) {
        toast.error("Gagal Memverifikasi Izin", { description: err.message });
        throw err;
      }
    },
    []
  );

  // ==========================================
  // SETTINGS (Live API)
  // ==========================================
  const updateSchoolSettings = React.useCallback(
    async (data: Partial<SchoolSetting>) => {
      try {
        const payload: any = {};
        if (data.schoolName) payload.schoolName = data.schoolName;
        if (data.npsn) payload.npsn = data.npsn;
        if (data.minAttendancePercentage !== undefined) payload.minAttendancePercentage = Number(data.minAttendancePercentage);
        if (data.timezone) payload.timezone = data.timezone;
        if (data.allowSelfPermission !== undefined) payload.allowSelfPermission = data.allowSelfPermission;

        const res = await apiClient.patch<SchoolSetting>('/settings', payload);
        setSchoolSettings((prev) => ({ ...(prev || {}), ...data, ...res.data } as SchoolSetting));
        toast.success("Pengaturan Sekolah Berhasil Disimpan");
      } catch (err: any) {
        toast.error("Gagal Menyimpan Pengaturan", { description: err.message });
        throw err;
      }
    },
    []
  );

  const value = React.useMemo(
    () => ({
      isLoadingData,
      dataError,
      refreshData,
      students,
      addStudent,
      updateStudent,
      toggleStudentStatus,
      deleteStudent,
      teachers,
      addTeacher,
      updateTeacher,
      toggleTeacherStatus,
      classes,
      addClass,
      updateClass,
      archiveClass,
      subjects,
      addSubject,
      updateSubject,
      toggleSubjectStatus,
      schedules,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      validateScheduleConflict,
      sessions,
      createSession,
      saveAttendanceSession,
      updateSessionStatus,
      attendanceRecords,
      addAttendanceRecord,
      studentRecaps,
      permissions,
      addPermission,
      reviewPermission,
      schoolSettings,
      updateSchoolSettings,
    }),
    [
      isLoadingData,
      dataError,
      refreshData,
      students,
      addStudent,
      updateStudent,
      toggleStudentStatus,
      deleteStudent,
      teachers,
      addTeacher,
      updateTeacher,
      toggleTeacherStatus,
      classes,
      addClass,
      updateClass,
      archiveClass,
      subjects,
      addSubject,
      updateSubject,
      toggleSubjectStatus,
      schedules,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      validateScheduleConflict,
      sessions,
      createSession,
      saveAttendanceSession,
      updateSessionStatus,
      attendanceRecords,
      addAttendanceRecord,
      studentRecaps,
      permissions,
      addPermission,
      reviewPermission,
      schoolSettings,
      updateSchoolSettings,
    ]
  );

  return (
    <SchoolDataContext.Provider value={value}>
      {children}
    </SchoolDataContext.Provider>
  );
}

export function useSchoolData() {
  const context = React.useContext(SchoolDataContext);
  if (!context) {
    throw new Error("useSchoolData must be used within a SchoolDataProvider");
  }
  return context;
}
