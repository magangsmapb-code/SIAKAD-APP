"use client";

import * as React from "react";
import {
  CreditCard,
  ScanFace,
  Fingerprint,
  QrCode,
  PenTool,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { MobileDataCard } from "@/components/shared/mobile-data-list";
import { ManualAttendanceModal } from "./manual-attendance-modal";
import { useSchoolData } from "@/contexts/school-data-context";
import { AttendanceRecord, AttendanceStatus, AttendanceMethod } from "@/types";

export function LiveAttendanceFeed() {
  const { attendanceRecords, classes, students } = useSchoolData();
  const [records, setRecords] = React.useState<AttendanceRecord[]>(attendanceRecords);
  const [search, setSearch] = React.useState("");
  const [selectedClass, setSelectedClass] = React.useState("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState("ALL");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const [manualModalOpen, setManualModalOpen] = React.useState(false);

  React.useEffect(() => {
    setRecords(attendanceRecords);
  }, [attendanceRecords]);

  // Method Icon Helper
  const getMethodBadge = (method: AttendanceMethod) => {
    switch (method) {
      case "RFID_CARD":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <CreditCard className="h-3 w-3 text-blue-500" />
            RFID Card
          </span>
        );
      case "FACE_RECOGNITION":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <ScanFace className="h-3 w-3 text-purple-500" />
            Face Scan
          </span>
        );
      case "FINGERPRINT":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Fingerprint className="h-3 w-3 text-amber-500" />
            Sidik Jari
          </span>
        );
      case "QR_CODE":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <QrCode className="h-3 w-3 text-emerald-500" />
            QR Dinamis
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <PenTool className="h-3 w-3 text-slate-500" />
            Guru Piket
          </span>
        );
    }
  };

  const getStatusBadgeVariant = (status: AttendanceStatus) => {
    switch (status) {
      case "HADIR":
        return "hadir";
      case "TERLAMBAT":
        return "terlambat";
      case "IZIN":
        return "izin";
      case "SAKIT":
        return "sakit";
      case "ALPA":
        return "alpa";
      default:
        return "default";
    }
  };

  // Filter logic
  const filteredRecords = React.useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        search === "" ||
        r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        r.studentNis.includes(search) ||
        r.className.toLowerCase().includes(search.toLowerCase());

      const matchClass =
        selectedClass === "ALL" || r.className === selectedClass;

      const matchStatus =
        selectedStatus === "ALL" || r.status === selectedStatus;

      return matchSearch && matchClass && matchStatus;
    });
  }, [records, search, selectedClass, selectedStatus]);

  // Paginated records
  const paginatedRecords = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize);

  const handleManualAddSuccess = (newAtt: any) => {
    const student = students.find((s) => s.id === newAtt.studentId);
    const cls = classes.find((c) => c.id === newAtt.classId);
    const newRecord: AttendanceRecord = {
      id: `att-manual-${Date.now()}`,
      studentId: newAtt.studentId,
      studentName: student ? student.fullName : "Siswa Terpilih",
      studentNis: student ? student.nis : "2400",
      studentNisn: student ? student.nisn : "0000000000",
      className: cls ? cls.name : "Kelas",
      date: new Date().toISOString().split("T")[0],
      checkInTime: new Date().toLocaleTimeString("id-ID", { hour12: false }),
      checkOutTime: null,
      status: newAtt.status,
      method: "MANUAL_TEACHER",
      notes: newAtt.notes,
      deviceLocation: "Input Guru Piket Manual",
    };

    setRecords([newRecord, ...records]);
  };

  const handleExportCSV = () => {
    const headers = "NIS,Nama Siswa,Kelas,Tanggal,Jam Masuk,Status,Metode,Catatan\n";
    const rows = filteredRecords
      .map(
        (r) =>
          `"${r.studentNis}","${r.studentName}","${r.className}","${r.date}","${
            r.checkInTime || "-"
          }","${r.status}","${r.method}","${r.notes || "-"}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap_presensi_ngrayun_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <CardTitle className="text-base font-bold">
                Log Presensi Realtime Hari Ini
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Aliran data absensi masuk dan pulang otomatis dari gerbang RFID & mesin kiosk
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="gap-1.5 self-start sm:self-auto text-xs"
            onClick={() => setManualModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Input Presensi Manual
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Table Toolbar */}
        <TableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari siswa, NIS, atau rombel..."
          classFilter={{
            value: selectedClass,
            onChange: setSelectedClass,
            options: [
              { label: "Semua Kelas", value: "ALL" },
              ...classes.map((c) => ({ label: c.name, value: c.name })),
            ],
            placeholder: "Semua Kelas",
          }}
          statusFilter={{
            value: selectedStatus,
            onChange: setSelectedStatus,
            options: [
              { label: "Semua Status", value: "ALL" },
              { label: "Hadir", value: "HADIR" },
              { label: "Terlambat", value: "TERLAMBAT" },
              { label: "Izin", value: "IZIN" },
              { label: "Sakit", value: "SAKIT" },
              { label: "Alpa", value: "ALPA" },
            ],
            placeholder: "Semua Status",
          }}
          onExport={handleExportCSV}
          exportLabel="Ekspor CSV"
          hasActiveFilters={
            search !== "" || selectedClass !== "ALL" || selectedStatus !== "ALL"
          }
          onResetFilters={() => {
            setSearch("");
            setSelectedClass("ALL");
            setSelectedStatus("ALL");
          }}
        />

        {/* Data Table */}
        {filteredRecords.length === 0 ? (
          <EmptyState
            title="Tidak Ada Data Presensi"
            description="Tidak ditemukan log presensi dengan filter yang Anda gunakan. Silakan ubah kata kunci atau setel ulang filter."
            actionLabel="Reset Filter"
            onAction={() => {
              setSearch("");
              setSelectedClass("ALL");
              setSelectedStatus("ALL");
            }}
          />
        ) : (
          <>
            {/* Mobile Cards Feed (md:hidden) */}
            <div className="md:hidden space-y-3 mt-3">
              {paginatedRecords.map((item) => (
                <MobileDataCard
                  key={item.id}
                  title={item.studentName}
                  subtitle={
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-primary">{item.className}</span>
                      <span>•</span>
                      <span className="font-mono text-muted-foreground">NIS: {item.studentNis}</span>
                    </span>
                  }
                  badge={
                    <Badge
                      variant={getStatusBadgeVariant(item.status)}
                      dot
                      className="text-[10px] font-semibold uppercase tracking-wider"
                    >
                      {item.status}
                    </Badge>
                  }
                  fields={[
                    {
                      label: "Waktu Tap",
                      value: (
                        <div className="flex items-center gap-1 font-mono font-semibold">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{item.checkInTime || "--:--:--"}</span>
                        </div>
                      ),
                    },
                    {
                      label: "Metode Presensi",
                      value: getMethodBadge(item.method),
                    },
                    {
                      label: "Lokasi Perangkat",
                      value: item.deviceLocation || "Gerbang Utama",
                    },
                    {
                      label: "Catatan",
                      value: item.notes || (item.status === "HADIR" ? "Tepat waktu" : "-"),
                    },
                  ]}
                />
              ))}
            </div>

            {/* Desktop Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto rounded-md border border-border mt-2">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 font-semibold">Siswa / Rombel</th>
                    <th className="py-3 px-3 font-semibold">Waktu Tap</th>
                    <th className="py-3 px-3 font-semibold">Metode & Alat</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-3 font-semibold">Catatan / Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {item.studentName}
                          </span>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="font-mono">NIS: {item.studentNis}</span>
                            <span>•</span>
                            <span className="font-medium text-navy-800 dark:text-navy-200">
                              {item.className}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-semibold text-foreground">
                            {item.checkInTime || "--:--:--"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {getMethodBadge(item.method)}
                          {item.deviceLocation && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="h-2.5 w-2.5" />
                              {item.deviceLocation}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <Badge
                          variant={getStatusBadgeVariant(item.status)}
                          dot
                          className="text-xs font-semibold uppercase tracking-wider"
                        >
                          {item.status}
                        </Badge>
                      </td>

                      <td className="py-3 px-3">
                        <p className="max-w-xs truncate text-[11px] text-muted-foreground">
                          {item.notes ||
                            (item.status === "HADIR"
                              ? "Tepat waktu di gerbang utama"
                              : "-")}
                        </p>
                        {item.verifiedBy && (
                          <span className="text-[10px] font-medium text-primary">
                            Verifikator: {item.verifiedBy}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {filteredRecords.length > 0 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filteredRecords.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </CardContent>

      <ManualAttendanceModal
        open={manualModalOpen}
        onOpenChange={setManualModalOpen}
        onSubmitSuccess={handleManualAddSuccess}
      />
    </Card>
  );
}
