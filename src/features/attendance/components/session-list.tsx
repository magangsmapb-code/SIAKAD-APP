"use client";

import * as React from "react";
import {
  Calendar,
  School,
  User,
  BookOpen,
  Filter,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  Eye,
  RefreshCw,
  Search,
  MoreVertical,
  ChevronRight,
  Layers,
  QrCode,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSchoolData } from "@/contexts/school-data-context";
import { AttendanceSessionItem, SessionStatus } from "@/types";
import { AttendanceFormModal } from "./attendance-form-modal";
import { SessionCreateModal } from "./session-create-modal";
import { SessionTokenModal } from "./session-token-modal";

export function SessionList() {
  const { sessions, classes, teachers, subjects, updateSessionStatus } = useSchoolData();

  // Filters
  const [selectedDate, setSelectedDate] = React.useState<string>("");
  const [selectedClass, setSelectedClass] = React.useState<string>("ALL");
  const [selectedTeacher, setSelectedTeacher] = React.useState<string>("ALL");
  const [selectedSubject, setSelectedSubject] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Modals
  const [activeSession, setActiveSession] = React.useState<AttendanceSessionItem | null>(null);
  const [formModalOpen, setFormModalOpen] = React.useState<boolean>(false);
  const [createModalOpen, setCreateModalOpen] = React.useState<boolean>(false);
  const [tokenModalOpen, setTokenModalOpen] = React.useState<boolean>(false);
  const [tokenSession, setTokenSession] = React.useState<AttendanceSessionItem | null>(null);

  const handleOpenTokenModal = (session: AttendanceSessionItem) => {
    setTokenSession(session);
    setTokenModalOpen(true);
  };

  // Filtered Sessions
  const filteredSessions = React.useMemo(() => {
    return sessions.filter((s) => {
      const matchDate = selectedDate === "" || s.date === selectedDate;
      const matchClass = selectedClass === "ALL" || s.classId === selectedClass;
      const matchTeacher = selectedTeacher === "ALL" || s.teacherId === selectedTeacher;
      const matchSubject = selectedSubject === "ALL" || s.subjectId === selectedSubject;
      const matchStatus = selectedStatus === "ALL" || s.status === selectedStatus;
      const matchSearch =
        searchQuery === "" ||
        s.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.teacherName.toLowerCase().includes(searchQuery.toLowerCase());

      return (
        matchDate &&
        matchClass &&
        matchTeacher &&
        matchSubject &&
        matchStatus &&
        matchSearch
      );
    });
  }, [
    sessions,
    selectedDate,
    selectedClass,
    selectedTeacher,
    selectedSubject,
    selectedStatus,
    searchQuery,
  ]);

  // Overall counts for summary
  const summary = React.useMemo(() => {
    const total = sessions.length;
    const disimpan = sessions.filter((s) => s.status === "SUDAH_DISIMPAN").length;
    const berlangsung = sessions.filter((s) => s.status === "SEDANG_BERLANGSUNG").length;
    const belum = sessions.filter((s) => s.status === "BELUM_DIMULAI").length;
    const perluDiperiksa = sessions.filter((s) => s.status === "PERLU_DIPERIKSA").length;

    return { total, disimpan, berlangsung, belum, perluDiperiksa };
  }, [sessions]);

  const handleOpenAttendance = (session: AttendanceSessionItem) => {
    setActiveSession(session);
    setFormModalOpen(true);
  };

  const getStatusBadge = (status: SessionStatus, isDraft: boolean) => {
    if (isDraft) {
      return (
        <Badge variant="terlambat" className="gap-1 text-xs font-semibold animate-pulse">
          <Clock className="h-3 w-3" />
          Sedang Berlangsung (Draft)
        </Badge>
      );
    }

    switch (status) {
      case "SUDAH_DISIMPAN":
        return (
          <Badge variant="hadir" className="gap-1 text-xs font-semibold">
            <CheckCircle2 className="h-3 w-3" />
            Sudah Disimpan
          </Badge>
        );
      case "PERLU_DIPERIKSA":
        return (
          <Badge variant="alpa" className="gap-1 text-xs font-semibold">
            <AlertTriangle className="h-3 w-3" />
            Perlu Diperiksa
          </Badge>
        );
      case "SEDANG_BERLANGSUNG":
        return (
          <Badge variant="terlambat" className="gap-1 text-xs font-semibold">
            <Clock className="h-3 w-3" />
            Sedang Berlangsung
          </Badge>
        );
      case "BELUM_DIMULAI":
      default:
        return (
          <Badge variant="secondary" className="gap-1 text-xs font-semibold text-muted-foreground">
            <Layers className="h-3 w-3" />
            Belum Dimulai
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Statistic Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 border-l-4 border-l-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
                Total Sesi Terdaftar
              </p>
              <p className="text-xl sm:text-2xl font-black text-foreground mt-0.5">
                {summary.total}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
                Sudah Disimpan Final
              </p>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-0.5">
                {summary.disimpan}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
                Sedang Berlangsung / Draft
              </p>
              <p className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">
                {summary.berlangsung}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
                Perlu Diperiksa (Ada Alpa)
              </p>
              <p className="text-xl sm:text-2xl font-black text-rose-600 mt-0.5">
                {summary.perluDiperiksa}
              </p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Container Card */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold">
                Daftar Sesi Pembelajaran & Presensi Kelas
              </CardTitle>
              <CardDescription className="text-xs">
                Kelola pengisian absensi jam pelajaran per kelas oleh guru pengampu mata pelajaran.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-primary text-primary-foreground h-9"
                onClick={() => setCreateModalOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                Buka Sesi Baru
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {/* Filter Tanggal */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Tanggal Sesi
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            {/* Filter Kelas */}
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

            {/* Filter Guru */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Guru Pengampu
              </label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Semua Guru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Guru</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Mapel */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Mata Pelajaran
              </label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Semua Mapel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Mapel</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Status Pengisian */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                <Filter className="h-3 w-3" /> Status Pengisian
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">Semua Status</SelectItem>
                  <SelectItem value="BELUM_DIMULAI" className="text-xs">Belum Dimulai</SelectItem>
                  <SelectItem value="SEDANG_BERLANGSUNG" className="text-xs">Sedang Berlangsung</SelectItem>
                  <SelectItem value="SUDAH_DISIMPAN" className="text-xs">Sudah Disimpan</SelectItem>
                  <SelectItem value="PERLU_DIPERIKSA" className="text-xs">Perlu Diperiksa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Search & Reset Filters */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari kelas, mapel, atau guru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs h-8 pl-8"
              />
            </div>

            {(selectedDate ||
              selectedClass !== "ALL" ||
              selectedTeacher !== "ALL" ||
              selectedSubject !== "ALL" ||
              selectedStatus !== "ALL" ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDate("");
                  setSelectedClass("ALL");
                  setSelectedTeacher("ALL");
                  setSelectedSubject("ALL");
                  setSelectedStatus("ALL");
                  setSearchQuery("");
                }}
                className="text-xs h-8 text-muted-foreground hover:text-foreground"
              >
                Reset Filter
              </Button>
            )}
          </div>

          {/* Sessions List Items */}
          {filteredSessions.length === 0 ? (
            <div className="p-10 text-center border rounded-xl bg-muted/10 space-y-2">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto opacity-40" />
              <h3 className="text-sm font-bold text-foreground">Tidak Ada Sesi yang Cocok</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tidak ditemukan sesi pembelajaran yang memenuhi kriteria filter saat ini.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="text-xs gap-1 mt-2"
              >
                <PlusCircle className="h-3.5 w-3.5" /> Buka Sesi Baru Sekarang
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredSessions.map((s) => {
                const totalStudents = s.totalStudents || 0;
                const markedStudents = s.markedStudents || 0;
                const progressPct =
                  totalStudents > 0
                    ? Math.round((markedStudents / totalStudents) * 100)
                    : 0;

                return (
                  <div
                    key={s.id}
                    className="rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Session Information */}
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm sm:text-base text-foreground">
                          {s.subjectName}
                        </span>
                        <Badge variant="outline" className="text-xs font-semibold">
                          {s.className}
                        </Badge>
                        {getStatusBadge(s.status, s.isDraft)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {s.teacherName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {s.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {s.startTime} - {s.endTime} WIB
                        </span>
                        <span className="flex items-center gap-1">
                          <School className="h-3.5 w-3.5 text-muted-foreground" />
                          {s.room}
                        </span>
                      </div>

                      {s.notes && (
                        <p className="text-[11px] text-muted-foreground italic bg-muted/30 px-2 py-1 rounded inline-block">
                          Catatan: &ldquo;{s.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Middle: Live Count Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap bg-muted/30 p-2 rounded-lg border">
                      <div className="text-center px-2">
                        <span className="text-[10px] text-muted-foreground block font-bold">
                          Hadir
                        </span>
                        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                          {s.presentCount || 0}
                        </span>
                      </div>
                      <div className="text-center px-2 border-l">
                        <span className="text-[10px] text-muted-foreground block font-bold">
                          Terlambat
                        </span>
                        <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                          {s.lateCount || 0}
                        </span>
                      </div>
                      <div className="text-center px-2 border-l">
                        <span className="text-[10px] text-muted-foreground block font-bold">
                          Sakit
                        </span>
                        <span className="text-xs font-black text-purple-700 dark:text-purple-400">
                          {s.sickCount || 0}
                        </span>
                      </div>
                      <div className="text-center px-2 border-l">
                        <span className="text-[10px] text-muted-foreground block font-bold">
                          Izin
                        </span>
                        <span className="text-xs font-black text-sky-700 dark:text-sky-400">
                          {s.permissionCount || 0}
                        </span>
                      </div>
                      <div className="text-center px-2 border-l">
                        <span className="text-[10px] text-muted-foreground block font-bold">
                          Alpa
                        </span>
                        <span className="text-xs font-black text-rose-700 dark:text-rose-400">
                          {s.absentCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenTokenModal(s)}
                        className="text-xs gap-1.5 min-h-[38px] border-primary/30 hover:bg-primary/10 text-primary font-semibold"
                        title="Tampilkan Token & Barcode Presensi Kelas"
                      >
                        <QrCode className="h-3.5 w-3.5 text-primary" />
                        <span className="hidden sm:inline">Token & QR</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => handleOpenAttendance(s)}
                        className={`text-xs gap-1.5 min-h-[38px] ${
                          s.isDraft
                            ? "bg-amber-600 hover:bg-amber-700 text-white"
                            : s.status === "SUDAH_DISIMPAN"
                            ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {s.isDraft ? (
                          <>
                            <FileEdit className="h-3.5 w-3.5" />
                            Lanjutkan Draft
                          </>
                        ) : s.status === "SUDAH_DISIMPAN" ? (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Lihat / Ubah Presensi
                          </>
                        ) : (
                          <>
                            <FileEdit className="h-3.5 w-3.5" />
                            Isi Presensi
                          </>
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuLabel>Tindakan Sesi</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleOpenTokenModal(s)}>
                            <QrCode className="h-3.5 w-3.5 mr-2 text-primary" /> Tampilkan Token & QR
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenAttendance(s)}>
                            <FileEdit className="h-3.5 w-3.5 mr-2" /> Buka Formulir
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => updateSessionStatus(s.id, "SUDAH_DISIMPAN")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                            Tandai Sudah Disimpan
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateSessionStatus(s.id, "PERLU_DIPERIKSA")}
                          >
                            <AlertTriangle className="h-3.5 w-3.5 mr-2 text-rose-600" />
                            Tandai Perlu Diperiksa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attendance Form Modal */}
      <AttendanceFormModal
        session={activeSession}
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        onSavedSuccess={() => {
          // Re-sync with active session from updated context
          if (activeSession) {
            const updated = sessions.find((s) => s.id === activeSession.id);
            if (updated) setActiveSession(updated);
          }
        }}
      />

      {/* Session Token & QR Barcode Modal */}
      <SessionTokenModal
        session={tokenSession}
        open={tokenModalOpen}
        onOpenChange={setTokenModalOpen}
        onRadiusChange={(sessionId, radiusMeters) => {
          // Update local session radius in state
          if (tokenSession && tokenSession.id === sessionId) {
            setTokenSession({ ...tokenSession, radiusMeters });
          }
        }}
      />

      {/* Create Session Modal */}
      <SessionCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreated={(newSession) => {
          setActiveSession(newSession);
          setFormModalOpen(true);
        }}
      />
    </div>
  );
}
