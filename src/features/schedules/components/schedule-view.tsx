"use client";

import * as React from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Grid3X3,
  ListFilter,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { ScheduleFormModal } from "./schedule-form-modal";
import { useSchoolData } from "@/contexts/school-data-context";
import { ScheduleItem, DayOfWeek } from "@/types";

const DAYS_LIST: DayOfWeek[] = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

export function ScheduleView() {
  const { schedules, classes, teachers, deleteSchedule } = useSchoolData();

  const [viewMode, setViewMode] = React.useState<"daily" | "weekly">("daily");
  const [selectedDay, setSelectedDay] = React.useState<DayOfWeek>("SENIN");
  const [selectedClass, setSelectedClass] = React.useState<string>("ALL");
  const [selectedTeacher, setSelectedTeacher] = React.useState<string>("ALL");

  // Modals
  const [formModalOpen, setFormModalOpen] = React.useState(false);
  const [scheduleToEdit, setScheduleToEdit] = React.useState<ScheduleItem | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
  const [scheduleToDelete, setScheduleToDelete] = React.useState<ScheduleItem | null>(null);

  // Filter schedules
  const filteredSchedules = React.useMemo(() => {
    return schedules.filter((item) => {
      const matchClass =
        selectedClass === "ALL" ||
        item.classId === selectedClass ||
        item.className === selectedClass;

      const matchTeacher =
        selectedTeacher === "ALL" ||
        item.teacherId === selectedTeacher ||
        item.teacherName === selectedTeacher;

      return matchClass && matchTeacher;
    });
  }, [schedules, selectedClass, selectedTeacher]);

  // For daily view, filter further by selectedDay
  const dailySchedules = React.useMemo(() => {
    return filteredSchedules
      .filter((s) => s.day === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [filteredSchedules, selectedDay]);

  const handleOpenAdd = () => {
    setScheduleToEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (item: ScheduleItem) => {
    setScheduleToEdit(item);
    setFormModalOpen(true);
  };

  const handleOpenDelete = (item: ScheduleItem) => {
    setScheduleToDelete(item);
    setConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (scheduleToDelete) {
      deleteSchedule(scheduleToDelete.id);
      setConfirmModalOpen(false);
      setScheduleToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Jadwal Pembelajaran & Sesi Presensi Jam Mengajar
          </h2>
          <p className="text-xs text-muted-foreground">
            Alokasi mata pelajaran harian, deteksi benturan pengajar & ruangan, serta validasi jam mengajar guru
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Switcher Harian / Mingguan */}
          <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
            <Button
              variant={viewMode === "daily" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setViewMode("daily")}
            >
              <Calendar className="h-3.5 w-3.5" />
              Jadwal Harian
            </Button>
            <Button
              variant={viewMode === "weekly" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => setViewMode("weekly")}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
              Jadwal Mingguan
            </Button>
          </div>

          <Button size="sm" className="gap-1.5 text-xs" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5" />
            Tambah Jadwal
          </Button>
        </div>
      </div>

      {/* Production Disclaimer Alert */}
      <div className="rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 p-3 text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
        <Info className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <span className="font-semibold">Catatan Arsitektur Sistem:</span> Validasi benturan waktu (guru mengajar bersamaan di 2 kelas atau ruangan dipakai lebih dari 1 kelas) dijalankan secara interaktif di level frontend untuk demo. Validasi produksi sesungguhnya tetap diverifikasi secara transaksional pada backend NestJS.
        </div>
      </div>

      {/* Filters Card */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ListFilter className="h-3.5 w-3.5" />
              Filter Jadwal:
            </span>

            {/* Filter Kelas */}
            <div className="w-full sm:w-44">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Rombel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    Semua Rombel
                  </SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Guru */}
            <div className="w-full sm:w-52">
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Guru" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    Semua Guru Pengampu
                  </SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedClass !== "ALL" || selectedTeacher !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSelectedClass("ALL");
                  setSelectedTeacher("ALL");
                }}
              >
                Reset Filter
              </Button>
            )}
          </div>

          {/* Daily View Day Selector Pills */}
          {viewMode === "daily" && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {DAYS_LIST.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2.5 font-medium"
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </Button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Main View: Daily or Weekly */}
      {viewMode === "daily" ? (
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Jadwal Hari {selectedDay} ({dailySchedules.length} Sesi Terjadwal)
                </CardTitle>
                <CardDescription className="text-xs">
                  Urutan pembelajaran kronologis jam masuk dan alokasi sesi mengajar
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {dailySchedules.length === 0 ? (
              <EmptyState
                title={`Tidak Ada Jadwal di Hari ${selectedDay}`}
                description="Belum ada sesi pembelajaran yang diatur untuk kriteria filter atau hari yang dipilih."
                actionLabel="Tambah Jadwal Hari Ini"
                onAction={handleOpenAdd}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {dailySchedules.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-subtle hover:border-primary/50 transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Badge variant="navy" className="text-xs font-semibold">
                          {item.className}
                        </Badge>
                        <div className="flex items-center gap-1 font-mono text-xs text-primary font-semibold">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {item.startTime} - {item.endTime}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-foreground">
                          {item.subjectName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{item.teacherName}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-amber-500" />
                          <span>Ruang: {item.room}</span>
                        </div>
                        <Badge variant="hadir" className="text-[10px] px-1.5 py-0">
                          Sesi Aktif
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Edit Sesi Jadwal"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Hapus Sesi Jadwal"
                        onClick={() => handleOpenDelete(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Weekly View Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {(["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT"] as DayOfWeek[]).map((day) => {
            const dayItems = filteredSchedules
              .filter((s) => s.day === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <Card key={day} className="flex flex-col bg-card border-border">
                <CardHeader className="p-3 bg-muted/40 border-b border-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                      {day}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {dayItems.length} Sesi
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-2.5 flex-1 space-y-2">
                  {dayItems.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-xs">
                      Tidak ada jadwal
                    </div>
                  ) : (
                    dayItems.map((sch) => (
                      <div
                        key={sch.id}
                        className="rounded-lg border border-border bg-card/80 p-2.5 space-y-1.5 hover:border-primary/60 transition-all text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[11px] text-foreground truncate">
                            {sch.subjectName}
                          </span>
                          <Badge variant="navy" className="text-[9px] px-1 py-0">
                            {sch.className}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1 font-mono text-[10px] text-primary">
                          <Clock className="h-2.5 w-2.5" />
                          <span>
                            {sch.startTime} - {sch.endTime}
                          </span>
                        </div>

                        <div className="text-[10px] text-muted-foreground truncate">
                          {sch.teacherName}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[10px] text-muted-foreground">
                          <span className="truncate">{sch.room}</span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground p-0.5"
                              onClick={() => handleOpenEdit(sch)}
                              title="Edit"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              className="text-rose-500 hover:text-rose-700 p-0.5"
                              onClick={() => handleOpenDelete(sch)}
                              title="Hapus"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Form Modal */}
      <ScheduleFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        scheduleToEdit={scheduleToEdit}
        defaultClassId={selectedClass !== "ALL" ? selectedClass : undefined}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        title="Konfirmasi Hapus Jadwal"
        description={`Apakah Anda yakin ingin menghapus jadwal ${scheduleToDelete?.subjectName} (${scheduleToDelete?.className}) pada ${scheduleToDelete?.day} ${scheduleToDelete?.startTime}-${scheduleToDelete?.endTime}?`}
        confirmLabel="Ya, Hapus Jadwal"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
