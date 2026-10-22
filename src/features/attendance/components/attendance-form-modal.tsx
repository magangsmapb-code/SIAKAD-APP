"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Save,
  Send,
  HelpCircle,
  XCircle,
  FileText,
  AlertCircle,
  Users,
  Search,
  Sparkles,
  Info,
  Calendar,
  School,
  BookOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useSchoolData } from "@/contexts/school-data-context";
import {
  AttendanceSessionItem,
  StudentAttendanceEntry,
  AttendanceStatus,
} from "@/types";

interface AttendanceFormModalProps {
  session: AttendanceSessionItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSavedSuccess?: () => void;
}

export function AttendanceFormModal({
  session,
  open,
  onOpenChange,
  onSavedSuccess,
}: AttendanceFormModalProps) {
  const { students, saveAttendanceSession } = useSchoolData();

  // Local state for entries
  const [entries, setEntries] = React.useState<StudentAttendanceEntry[]>([]);
  const [sessionNotes, setSessionNotes] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [filterGender, setFilterGender] = React.useState<"ALL" | "L" | "P">("ALL");
  const [filterStatus, setFilterStatus] = React.useState<string>("ALL");

  // Dirty state tracking to prevent accidental data loss
  const [isDirty, setIsDirty] = React.useState(false);
  const [confirmExitOpen, setConfirmExitOpen] = React.useState(false);

  // Review summary modal before final submit
  const [reviewSummaryOpen, setReviewSummaryOpen] = React.useState(false);

  // Unmarked warning dialog
  const [unmarkedWarningOpen, setUnmarkedWarningOpen] = React.useState(false);

  // Bulk mark all present dialog
  const [bulkPresentOpen, setBulkPresentOpen] = React.useState(false);

  // Success confirmation dialog
  const [successDialogOpen, setSuccessDialogOpen] = React.useState(false);
  const [lastSubmissionSummary, setLastSubmissionSummary] = React.useState<{
    present: number;
    late: number;
    sick: number;
    permission: number;
    absent: number;
    isDraft: boolean;
  } | null>(null);

  // Prevent double submissions
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Initialize or re-populate entries when session changes
  React.useEffect(() => {
    if (!session) return;

    setSessionNotes(session.notes || "");
    setIsDirty(false);

    if (session.entries && session.entries.length > 0) {
      // Load existing saved/draft entries
      setEntries(session.entries.map((e) => ({ ...e })));
    } else {
      // Initialize from class students with strict UNSET (BELUM_DIISI) status!
      // CRITICAL: Do NOT auto-mark students as present!
      const classStudents = students.filter(
        (s) => s.classId === session.classId && s.status === "AKTIF"
      );

      const initial: StudentAttendanceEntry[] = classStudents.map((s) => ({
        studentId: s.id,
        studentNis: s.nis,
        studentNisn: s.nisn,
        studentName: s.fullName,
        gender: s.gender,
        status: "BELUM_DIISI", // Explicit unset
      }));

      setEntries(initial);
    }
  }, [session, students]);

  // Real-time counter metrics
  const stats = React.useMemo(() => {
    const total = entries.length;
    const hadir = entries.filter((e) => e.status === "HADIR").length;
    const terlambat = entries.filter((e) => e.status === "TERLAMBAT").length;
    const sakit = entries.filter((e) => e.status === "SAKIT").length;
    const izin = entries.filter((e) => e.status === "IZIN").length;
    const alpa = entries.filter((e) => e.status === "ALPA").length;
    const belumDiisi = entries.filter((e) => e.status === "BELUM_DIISI").length;

    return { total, hadir, terlambat, sakit, izin, alpa, belumDiisi };
  }, [entries]);

  // Filtered students inside modal
  const filteredEntries = React.useMemo(() => {
    return entries.filter((entry) => {
      const matchSearch =
        searchQuery === "" ||
        entry.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.studentNis.includes(searchQuery);

      const matchGender =
        filterGender === "ALL" || entry.gender === filterGender;

      const matchStatus =
        filterStatus === "ALL" || entry.status === filterStatus;

      return matchSearch && matchGender && matchStatus;
    });
  }, [entries, searchQuery, filterGender, filterStatus]);

  // Unmarked student names for validation alert
  const unmarkedStudents = React.useMemo(() => {
    return entries.filter((e) => e.status === "BELUM_DIISI");
  }, [entries]);

  // Update status for a single student
  const handleStatusChange = (
    studentId: string,
    newStatus: AttendanceStatus | "BELUM_DIISI"
  ) => {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.studentId !== studentId) return e;
        return {
          ...e,
          status: newStatus,
          checkInTime:
            newStatus === "HADIR" || newStatus === "TERLAMBAT"
              ? e.checkInTime || new Date().toTimeString().split(" ")[0]
              : undefined,
        };
      })
    );
    setIsDirty(true);
  };

  // Update notes for a single student
  const handleNoteChange = (studentId: string, note: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.studentId === studentId ? { ...e, notes: note } : e))
    );
    setIsDirty(true);
  };

  // Bulk mark all unassigned or all as Hadir (with prompt)
  const handleBulkMarkPresent = () => {
    setEntries((prev) =>
      prev.map((e) => ({
        ...e,
        status: e.status === "BELUM_DIISI" ? "HADIR" : e.status,
        checkInTime:
          e.status === "BELUM_DIISI"
            ? new Date().toTimeString().split(" ")[0]
            : e.checkInTime,
      }))
    );
    setIsDirty(true);
    setBulkPresentOpen(false);
  };

  // Safe Close Request with Unsaved Check
  const handleAttemptClose = () => {
    if (isDirty) {
      setConfirmExitOpen(true);
    } else {
      onOpenChange(false);
    }
  };

  // Save Draft (Allows partial marking, does not enforce 100% filled)
  const handleSaveDraft = () => {
    if (!session || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      saveAttendanceSession(session.id, entries, true, sessionNotes);
      setIsDirty(false);
      setIsSubmitting(false);
      setLastSubmissionSummary({
        present: stats.hadir,
        late: stats.terlambat,
        sick: stats.sakit,
        permission: stats.izin,
        absent: stats.alpa,
        isDraft: true,
      });
      setSuccessDialogOpen(true);
    }, 400);
  };

  // Final Submit trigger: checks if there are unmarked students
  const handleFinalSubmitClick = () => {
    if (unmarkedStudents.length > 0) {
      setUnmarkedWarningOpen(true);
      return;
    }
    setReviewSummaryOpen(true);
  };

  // Execute Final Submit after summary review
  const executeFinalSubmit = () => {
    if (!session || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      saveAttendanceSession(session.id, entries, false, sessionNotes);
      setIsDirty(false);
      setIsSubmitting(false);
      setReviewSummaryOpen(false);
      setLastSubmissionSummary({
        present: stats.hadir,
        late: stats.terlambat,
        sick: stats.sakit,
        permission: stats.izin,
        absent: stats.alpa,
        isDraft: false,
      });
      setSuccessDialogOpen(true);
      if (onSavedSuccess) {
        onSavedSuccess();
      }
    }, 600);
  };

  if (!session) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleAttemptClose()}>
        <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="p-4 sm:p-5 pb-3 border-b bg-background sticky top-0 z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                    Formulir Presensi Kelas: {session.className}
                  </DialogTitle>
                  <Badge
                    variant={
                      session.isDraft
                        ? "terlambat"
                        : session.status === "SUDAH_DISIMPAN"
                        ? "hadir"
                        : session.status === "PERLU_DIPERIKSA"
                        ? "alpa"
                        : "secondary"
                    }
                    className="text-[11px]"
                  >
                    {session.isDraft
                      ? "Draft Berjalan"
                      : session.status === "SUDAH_DISIMPAN"
                      ? "Tersimpan Final"
                      : session.status === "PERLU_DIPERIKSA"
                      ? "Perlu Pemeriksaan"
                      : "Sesi Baru"}
                  </Badge>
                  {isDirty && (
                    <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50">
                      Ada Perubahan Belum Disimpan
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <BookOpen className="h-3 w-3 text-primary" /> {session.subjectName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <School className="h-3 w-3" /> {session.teacherName}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {session.date} ({session.startTime} - {session.endTime})
                  </span>
                  <span>•</span>
                  <span>Ruang: {session.room}</span>
                </DialogDescription>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setBulkPresentOpen(true)}
                  className="text-xs h-8 gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Tandai Sisa Hadir
                </Button>
              </div>
            </div>

            {/* Disclaimer & Warning Notice */}
            <div className="mt-2 text-[11px] bg-blue-50/70 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 rounded-md p-2 flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <span>
                <strong>Aturan Pengisian:</strong> Status awal setiap siswa adalah <em>BELUM DIISI</em>. Data absensi disimpan di memori frontend selama sesi demo. Aturan validasi final akan diterapkan ulang oleh server backend saat integrasi.
              </span>
            </div>

            {/* Realtime Live Counter Bar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 pt-2 border-t">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg p-2 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">
                  Hadir (H)
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-800 dark:text-emerald-300">
                  {stats.hadir}
                </span>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg p-2 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                  Terlambat (T)
                </span>
                <span className="text-base sm:text-lg font-black text-amber-800 dark:text-amber-300">
                  {stats.terlambat}
                </span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-lg p-2 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-400 block">
                  Sakit (S)
                </span>
                <span className="text-base sm:text-lg font-black text-blue-800 dark:text-blue-300">
                  {stats.sakit}
                </span>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-lg p-2 text-center">
                <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-400 block">
                  Izin (I)
                </span>
                <span className="text-base sm:text-lg font-black text-purple-800 dark:text-purple-300">
                  {stats.izin}
                </span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg p-2 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">
                  Alpa (A)
                </span>
                <span className="text-base sm:text-lg font-black text-rose-800 dark:text-rose-300">
                  {stats.alpa}
                </span>
              </div>
              <div
                className={`rounded-lg p-2 text-center border ${
                  stats.belumDiisi > 0
                    ? "bg-amber-100/80 border-amber-300 dark:bg-amber-950/60 dark:border-amber-800 text-amber-900"
                    : "bg-muted/50 border-muted text-muted-foreground"
                }`}
              >
                <span className="text-[10px] uppercase font-bold block">
                  Belum Ditandai
                </span>
                <span
                  className={`text-base sm:text-lg font-black ${
                    stats.belumDiisi > 0 ? "text-amber-700 dark:text-amber-400 font-extrabold" : "text-foreground"
                  }`}
                >
                  {stats.belumDiisi}
                </span>
              </div>
            </div>

            {/* Filter & Search Bar inside Modal */}
            <div className="flex flex-col sm:flex-row items-center gap-2 mt-2">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari siswa atau NIS di rombel ini..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-xs h-8 pl-8"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value as "ALL" | "L" | "P")}
                  className="text-xs h-8 rounded-md border border-input bg-background px-2 text-foreground"
                >
                  <option value="ALL">Semua Gender</option>
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-xs h-8 rounded-md border border-input bg-background px-2 text-foreground"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="BELUM_DIISI">Belum Ditandai</option>
                  <option value="HADIR">Hadir</option>
                  <option value="TERLAMBAT">Terlambat</option>
                  <option value="SAKIT">Sakit</option>
                  <option value="IZIN">Izin</option>
                  <option value="ALPA">Alpa</option>
                </select>
              </div>
            </div>
          </DialogHeader>

          {/* Student List Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {filteredEntries.length === 0 ? (
              <div className="p-8 text-center border rounded-lg bg-muted/20">
                <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-foreground">
                  Tidak ada siswa yang sesuai dengan filter pencarian
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Coba ubah kata kunci pencarian atau reset filter gender dan status.
                </p>
              </div>
            ) : (
              filteredEntries.map((student, idx) => {
                const isMarked = student.status !== "BELUM_DIISI";

                return (
                  <div
                    key={student.studentId}
                    className={`rounded-xl border p-3 sm:p-4 transition-all duration-200 ${
                      !isMarked
                        ? "bg-card border-amber-200/70 dark:border-amber-900/40 shadow-sm"
                        : "bg-card/70 border-border"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Student Identity */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                            student.gender === "L"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300"
                          }`}
                        >
                          {student.studentName.slice(0, 2).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground font-semibold">
                              #{idx + 1}
                            </span>
                            <span className="text-sm font-bold text-foreground">
                              {student.studentName}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {student.gender === "L" ? "L" : "P"}
                            </span>
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>NIS: {student.studentNis}</span>
                            {student.checkInTime && (
                              <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-mono">
                                <Clock className="h-3 w-3" />
                                {student.checkInTime}
                              </span>
                            )}
                            {!isMarked && (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                • Belum Ditandai
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Selection Buttons (Large Touch Target >= 44px for Android Mobile) */}
                      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                        {/* HADIR */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "HADIR")}
                          className={`min-h-[44px] min-w-[58px] sm:min-w-[64px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                            student.status === "HADIR"
                              ? "bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-400/50"
                              : "bg-muted/40 hover:bg-emerald-50 text-emerald-800 dark:text-emerald-400 border-border"
                          }`}
                        >
                          <span>Hadir</span>
                          <span className="text-[9px] font-normal opacity-80">(H)</span>
                        </button>

                        {/* TERLAMBAT */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "TERLAMBAT")}
                          className={`min-h-[44px] min-w-[58px] sm:min-w-[64px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                            student.status === "TERLAMBAT"
                              ? "bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400/50"
                              : "bg-muted/40 hover:bg-amber-50 text-amber-800 dark:text-amber-400 border-border"
                          }`}
                        >
                          <span>Terlambat</span>
                          <span className="text-[9px] font-normal opacity-80">(T)</span>
                        </button>

                        {/* SAKIT */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "SAKIT")}
                          className={`min-h-[44px] min-w-[58px] sm:min-w-[64px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                            student.status === "SAKIT"
                              ? "bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-400/50"
                              : "bg-muted/40 hover:bg-blue-50 text-blue-800 dark:text-blue-400 border-border"
                          }`}
                        >
                          <span>Sakit</span>
                          <span className="text-[9px] font-normal opacity-80">(S)</span>
                        </button>

                        {/* IZIN */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "IZIN")}
                          className={`min-h-[44px] min-w-[58px] sm:min-w-[64px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                            student.status === "IZIN"
                              ? "bg-purple-600 text-white border-purple-700 shadow-sm ring-2 ring-purple-400/50"
                              : "bg-muted/40 hover:bg-purple-50 text-purple-800 dark:text-purple-400 border-border"
                          }`}
                        >
                          <span>Izin</span>
                          <span className="text-[9px] font-normal opacity-80">(I)</span>
                        </button>

                        {/* ALPA */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.studentId, "ALPA")}
                          className={`min-h-[44px] min-w-[58px] sm:min-w-[64px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                            student.status === "ALPA"
                              ? "bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-400/50"
                              : "bg-muted/40 hover:bg-rose-50 text-rose-800 dark:text-rose-400 border-border"
                          }`}
                        >
                          <span>Alpa</span>
                          <span className="text-[9px] font-normal opacity-80">(A)</span>
                        </button>

                        {/* RESET UNSET */}
                        {isMarked && (
                          <button
                            type="button"
                            title="Kosongkan status siswa ini"
                            onClick={() => handleStatusChange(student.studentId, "BELUM_DIISI")}
                            className="min-h-[44px] px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground underline"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Optional Note Field (useful if sick, late, permission, or alpa) */}
                    {(student.status === "SAKIT" ||
                      student.status === "IZIN" ||
                      student.status === "TERLAMBAT" ||
                      student.status === "ALPA" ||
                      student.notes) && (
                      <div className="mt-2.5 pt-2 border-t border-dashed flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <Input
                          placeholder={
                            student.status === "TERLAMBAT"
                              ? "Contoh: Terlambat 10 menit karena ban bocor..."
                              : student.status === "SAKIT"
                              ? "Keterangan sakit / ada surat dokter..."
                              : student.status === "IZIN"
                              ? "Alasan izin / dispensasi dinas..."
                              : "Keterangan tidak hadir / tindak lanjut..."
                          }
                          value={student.notes || ""}
                          onChange={(e) => handleNoteChange(student.studentId, e.target.value)}
                          className="text-xs h-7 bg-muted/30"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* General Session Notes */}
            <div className="mt-4 rounded-xl border bg-muted/20 p-3 space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Catatan Umum Pelaksanaan Sesi (Opsional)
              </label>
              <textarea
                rows={2}
                value={sessionNotes}
                onChange={(e) => {
                  setSessionNotes(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="Tuliskan catatan kejadian penting selama jam pembelajaran di kelas..."
                className="w-full text-xs rounded-lg border border-input bg-background p-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Sticky Footer / Mobile Action Bar */}
          <DialogFooter className="p-3 sm:p-4 border-t bg-background/95 backdrop-blur-sm sticky bottom-0 z-10 flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="text-xs text-muted-foreground flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <span>
                Total Terisi:{" "}
                <strong className="text-foreground">
                  {stats.total - stats.belumDiisi} / {stats.total} Siswa
                </strong>
              </span>
              {stats.belumDiisi > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5" /> {stats.belumDiisi} Belum Diisi
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAttemptClose}
                disabled={isSubmitting}
                className="text-xs"
              >
                Batal / Tutup
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSubmitting}
                className="text-xs gap-1.5"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Menyimpan..." : "Simpan Draft"}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleFinalSubmitClick}
                disabled={isSubmitting}
                className="text-xs gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <Send className="h-4 w-4" />
                Periksa & Kirim Final
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <Dialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Perubahan Belum Disimpan
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Anda memiliki pengisian presensi siswa yang belum disimpan. Jika Anda keluar sekarang, perubahan sementara ini akan dibuang.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setConfirmExitOpen(false)}
              className="text-xs"
            >
              Tetap di Form
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                setIsDirty(false);
                setConfirmExitOpen(false);
                onOpenChange(false);
              }}
            >
              Tinggalkan Tanpa Menyimpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warning Alert: Unmarked Students Exist */}
      <Dialog open={unmarkedWarningOpen} onOpenChange={setUnmarkedWarningOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="h-5 w-5" />
              Ada Siswa Belum Ditandai
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground space-y-2">
              <p>
                Masih ada <strong>{unmarkedStudents.length} siswa</strong> yang belum memiliki status kehadiran:
              </p>
              <div className="max-h-32 overflow-y-auto rounded-md bg-muted/40 p-2 text-left border">
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-foreground">
                  {unmarkedStudents.map((u) => (
                    <li key={u.studentId}>
                      {u.studentName} ({u.studentNis})
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[11px]">
                Untuk menyimpan sebagai hasil final, seluruh siswa wajib ditandai statusnya. Jika Anda ingin menyimpan sebagian terlebih dahulu, silakan pilih <strong>Simpan Draft</strong>.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setUnmarkedWarningOpen(false)}
              className="text-xs"
            >
              Kembali Lengkapi
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => {
                setUnmarkedWarningOpen(false);
                handleSaveDraft();
              }}
            >
              Simpan Sebagai Draft Saja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Mark All Present Dialog */}
      <Dialog open={bulkPresentOpen} onOpenChange={setBulkPresentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <Sparkles className="h-5 w-5" />
              Tandai Siswa Belum Diisi Sebagai Hadir?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Aksi ini akan menandai {stats.belumDiisi} siswa yang saat ini berstatus <em>Belum Ditandai</em> menjadi <strong>Hadir</strong>. Siswa yang telah Anda tandai sebagai Sakit, Izin, atau Alpa tidak akan berubah.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkPresentOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleBulkMarkPresent}
            >
              Ya, Tandai Hadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Summary Review Dialog Before Final Submit */}
      <Dialog open={reviewSummaryOpen} onOpenChange={setReviewSummaryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Ringkasan Presensi Sesi Pembelajaran
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Periksa ringkasan kehadiran sebelum mengirimkan data absensi secara final ke sistem lokal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rombel / Kelas:</span>
                <span className="font-bold text-foreground">{session.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mata Pelajaran:</span>
                <span className="font-bold text-foreground">{session.subjectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guru Pengampu:</span>
                <span className="font-semibold text-foreground">{session.teacherName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Waktu Sesi:</span>
                <span className="font-semibold text-foreground">
                  {session.date} ({session.startTime} - {session.endTime})
                </span>
              </div>
            </div>

            <div className="rounded-lg border p-3 space-y-2">
              <span className="text-xs font-bold text-foreground block">
                Distribusi Kehadiran ({stats.total} Siswa):
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded border border-emerald-200">
                  <span className="font-medium text-emerald-800 dark:text-emerald-300">Hadir</span>
                  <span className="font-black text-emerald-900 dark:text-emerald-200 text-sm">{stats.hadir}</span>
                </div>
                <div className="flex justify-between items-center bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200">
                  <span className="font-medium text-amber-800 dark:text-amber-300">Terlambat</span>
                  <span className="font-black text-amber-900 dark:text-amber-200 text-sm">{stats.terlambat}</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950/40 p-2 rounded border border-blue-200">
                  <span className="font-medium text-blue-800 dark:text-blue-300">Sakit</span>
                  <span className="font-black text-blue-900 dark:text-blue-200 text-sm">{stats.sakit}</span>
                </div>
                <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-950/40 p-2 rounded border border-purple-200">
                  <span className="font-medium text-purple-800 dark:text-purple-300">Izin</span>
                  <span className="font-black text-purple-900 dark:text-purple-200 text-sm">{stats.izin}</span>
                </div>
                <div className="col-span-2 flex justify-between items-center bg-rose-50 dark:bg-rose-950/40 p-2 rounded border border-rose-200">
                  <span className="font-medium text-rose-800 dark:text-rose-300">Alpa (Tanpa Keterangan)</span>
                  <span className="font-black text-rose-900 dark:text-rose-200 text-sm">{stats.alpa}</span>
                </div>
              </div>
            </div>

            {stats.alpa > 0 && (
              <div className="p-2.5 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Sesi ini memiliki <strong>{stats.alpa} siswa Alpa</strong>. Status sesi akan otomatis diberi label <em>&quot;Perlu Diperiksa&quot;</em> agar dapat ditindaklanjuti oleh Wali Kelas atau guru BK.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReviewSummaryOpen(false)}
              disabled={isSubmitting}
            >
              Koreksi Kembali
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={executeFinalSubmit}
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Menyimpan ke Sistem..." : "Konfirmasi & Simpan Final"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Confirmation Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-md text-center">
          <div className="flex justify-center pt-2">
            <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          </div>
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold">
              {lastSubmissionSummary?.isDraft
                ? "Draft Presensi Berhasil Disimpan"
                : "Presensi Berhasil Disimpan!"}
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-muted-foreground">
              {lastSubmissionSummary?.isDraft
                ? "Pengisian sementara telah diamankan di memori browser. Anda dapat melanjutkan pengisian sewaktu-waktu."
                : `Data kehadiran sesi ${session.className} (${session.subjectName}) berhasil direkapitulasi secara akurat ke log absensi.`}
            </DialogDescription>
          </DialogHeader>

          {lastSubmissionSummary && (
            <div className="rounded-lg border bg-muted/30 p-3 my-2 text-xs grid grid-cols-5 gap-1 text-center font-mono">
              <div>
                <span className="text-[10px] text-muted-foreground block">Hadir</span>
                <span className="font-bold text-emerald-600">{lastSubmissionSummary.present}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Terlambat</span>
                <span className="font-bold text-amber-600">{lastSubmissionSummary.late}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Sakit</span>
                <span className="font-bold text-blue-600">{lastSubmissionSummary.sick}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Izin</span>
                <span className="font-bold text-purple-600">{lastSubmissionSummary.permission}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Alpa</span>
                <span className="font-bold text-rose-600">{lastSubmissionSummary.absent}</span>
              </div>
            </div>
          )}

          <DialogFooter className="justify-center sm:justify-center">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                setSuccessDialogOpen(false);
                onOpenChange(false);
              }}
            >
              Selesai & Tutup Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
