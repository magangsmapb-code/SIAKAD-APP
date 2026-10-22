"use client";

import * as React from "react";
import {
  FileCheck2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Paperclip,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/shared/table-toolbar";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { PermissionReviewModal } from "./permission-review-modal";
import { PermissionFormModal } from "./permission-form-modal";
import { useSchoolData } from "@/contexts/school-data-context";
import { useDemoRole } from "@/contexts/demo-role-context";
import { PermissionRequest, PermissionStatus } from "@/types";
import { PlusCircle } from "lucide-react";

export function PermissionTable() {
  const { permissions, reviewPermission } = useSchoolData();
  const { role } = useDemoRole();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [selectedPermission, setSelectedPermission] = React.useState<PermissionRequest | null>(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const filtered = React.useMemo(() => {
    return permissions.filter((p) => {
      const matchSearch =
        search === "" ||
        p.studentName.toLowerCase().includes(search.toLowerCase()) ||
        p.className.toLowerCase().includes(search.toLowerCase()) ||
        p.reason.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [permissions, search, statusFilter]);

  const reviewerName = React.useMemo(() => {
    if (role === "KEPALA_SEKOLAH") return "Drs. Bambang Setyono, M.Pd.";
    if (role === "GURU") return "Siti Rahmawati, S.Pd. (Wali Kelas)";
    return "Petugas Tata Usaha / Admin";
  }, [role]);

  const handleApprove = (id: string, notes?: string) => {
    reviewPermission(id, "DISETUJUI", reviewerName, notes);
  };

  const handleReject = (id: string, notes?: string) => {
    reviewPermission(id, "DITOLAK", reviewerName, notes);
  };

  const getStatusBadge = (status: PermissionStatus) => {
    switch (status) {
      case "DISETUJUI":
        return (
          <Badge variant="hadir" className="gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            Disetujui
          </Badge>
        );
      case "DITOLAK":
        return (
          <Badge variant="alpa" className="gap-1 text-xs">
            <XCircle className="h-3 w-3" />
            Ditolak
          </Badge>
        );
      default:
        return (
          <Badge variant="terlambat" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            Menunggu
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold">
              Daftar Permohonan Izin & Surat Dokter
            </CardTitle>
            <CardDescription className="text-xs">
              Verifikasi digital permohonan dispensasi, izin urusan keluarga, atau surat sakit siswa
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="text-xs gap-1.5 h-9"
            onClick={() => setCreateModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Ajukan Izin Baru
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <TableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari siswa, kelas, atau alasan izin..."
          statusFilter={{
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "Semua Status", value: "ALL" },
              { label: "Menunggu Verifikasi", value: "MENUNGGU" },
              { label: "Disetujui", value: "DISETUJUI" },
              { label: "Ditolak", value: "DITOLAK" },
            ],
            placeholder: "Semua Status",
          }}
          hasActiveFilters={search !== "" || statusFilter !== "ALL"}
          onResetFilters={() => {
            setSearch("");
            setStatusFilter("ALL");
          }}
        />

        {filtered.length === 0 ? (
          <EmptyState
            title="Tidak Ada Data Perizinan"
            description="Tidak ditemukan berkas perizinan yang sesuai dengan filter yang aktif."
            actionLabel="Reset Filter"
            onAction={() => {
              setSearch("");
              setStatusFilter("ALL");
            }}
          />
        ) : (
          <>
            {/* Mobile Card List View (< md) */}
            <div className="block md:hidden divide-y divide-border/60 rounded-lg border border-border bg-card mt-2">
              {filtered.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-foreground block">
                        {item.studentName}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        NIS: {item.studentNis} • {item.className}
                      </span>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="font-semibold text-xs">
                      {item.type}
                    </Badge>
                    <div className="flex items-center gap-1.5 font-medium text-foreground ml-auto">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{item.startDate} ({item.totalDays} hari)</span>
                    </div>
                  </div>

                  <div className="bg-muted/40 p-2.5 rounded-lg space-y-1">
                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {item.reason}
                    </p>
                    {item.attachmentName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-primary pt-1">
                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.attachmentName}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-1">
                    <Button
                      variant={item.status === "MENUNGGU" ? "default" : "outline"}
                      size="sm"
                      className="w-full h-11 min-h-[44px] text-xs gap-2 font-semibold touch-target"
                      onClick={() => {
                        setSelectedPermission(item);
                        setModalOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4" />
                      <span>{item.status === "MENUNGGU" ? "Verifikasi Pengajuan" : "Lihat Detail Berkas"}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-md border border-border mt-2">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-3.5 font-semibold">Nama Siswa</th>
                    <th className="py-3 px-3 font-semibold">Jenis Izin</th>
                    <th className="py-3 px-3 font-semibold">Rentang Waktu</th>
                    <th className="py-3 px-3 font-semibold">Alasan & Dokumen</th>
                    <th className="py-3 px-3 font-semibold">Status</th>
                    <th className="py-3 px-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">
                            {item.studentName}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            NIS: {item.studentNis} • {item.className}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <Badge variant="outline" className="font-semibold text-xs">
                          {item.type}
                        </Badge>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{item.startDate} ({item.totalDays} hari)</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <p className="truncate text-foreground font-medium">
                          {item.reason}
                        </p>
                        {item.attachmentName && (
                          <div className="flex items-center gap-1 text-[11px] text-primary mt-0.5">
                            <Paperclip className="h-3 w-3" />
                            <span className="truncate">{item.attachmentName}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {getStatusBadge(item.status)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Button
                          variant={item.status === "MENUNGGU" ? "default" : "outline"}
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => {
                            setSelectedPermission(item);
                            setModalOpen(true);
                          }}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {item.status === "MENUNGGU" ? "Verifikasi" : "Detail"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>

      <PermissionReviewModal
        permission={selectedPermission}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <PermissionFormModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </Card>
  );
}
