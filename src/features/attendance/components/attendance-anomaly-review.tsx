"use client";

import * as React from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Check,
  Clock,
  MapPin,
  Smartphone,
  User,
  Shield,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface AnomalyItem {
  id: string;
  createdAt: string;
  actorName: string;
  userRole: string;
  action?: string;
  userId: string;
  anomalyType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING_REVIEW" | "INVESTIGATING" | "RESOLVED_FALSE_POSITIVE" | "RESOLVED_CONFIRMED_FRAUD" | "DISMISSED";
  details: string;
  coords?: { lat: number; lon: number; accuracy?: number } | null;
  deviceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
}

export function AttendanceAnomalyReview() {
  const [anomalies, setAnomalies] = React.useState<AnomalyItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [severityFilter, setSeverityFilter] = React.useState<string>("ALL");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  // Review modal
  const [selectedAnomaly, setSelectedAnomaly] = React.useState<AnomalyItem | null>(null);
  const [resolveStatus, setResolveStatus] = React.useState<string>("RESOLVED_CONFIRMED_FRAUD");
  const [reviewNotes, setReviewNotes] = React.useState<string>("");
  const [resolving, setResolving] = React.useState(false);

  const fetchAnomalies = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (severityFilter !== "ALL") params.append("severity", severityFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);

      const endpoint = `/attendance/anomalies?${params.toString()}`;
      const res = await apiClient.get<any>(endpoint);

      if (res && res.data) {
        setAnomalies(res.data);
      }
    } catch {
      // Fallback demo anomalies if running offline
      setAnomalies([
        {
          id: "anom-1",
          createdAt: new Date().toISOString(),
          actorName: "Siswa X (Nis: 20241019)",
          userRole: "STUDENT",
          userId: "u-std-19",
          anomalyType: "GEOFENCE_RADIUS_BREACH",
          severity: "HIGH",
          status: "PENDING_REVIEW",
          details: "Posisi di luar perimeter (1,450 meter dari pusat sekolah SMA PB Ngrayun, batas 100m)",
          coords: { lat: -8.112, lon: 111.455, accuracy: 12 },
          deviceId: "dev_redmi_note11",
          ipAddress: "182.253.12.98",
        },
        {
          id: "anom-2",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          actorName: "Pencegahan Titip Absen",
          userRole: "UNKNOWN",
          userId: "u-std-42",
          anomalyType: "MULTI_ACCOUNT_DEVICE_BREACH",
          severity: "HIGH",
          status: "PENDING_REVIEW",
          details: "Perangkat dev_samsung_a54 terdeteksi digunakan untuk absensi 2 akun siswa berbeda dalam 10 menit.",
          deviceId: "dev_samsung_a54",
          ipAddress: "36.88.192.44",
        },
        {
          id: "anom-3",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          actorName: "Rian Prasetya",
          userRole: "STUDENT",
          userId: "u-std-88",
          anomalyType: "LOW_GPS_ACCURACY",
          severity: "MEDIUM",
          status: "RESOLVED_FALSE_POSITIVE",
          details: "Akurasi sinyal GPS rendah (120m, batas kebijakan 50m) akibat cuaca mendung di lereng Ngrayun.",
          coords: { lat: -8.0436, lon: 111.4121, accuracy: 120 },
          reviewNotes: "Telah dikonfirmasi siswa hadir fisik di kelas oleh wali kelas.",
          reviewedAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [severityFilter, statusFilter]);

  React.useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const handleResolve = async () => {
    if (!selectedAnomaly) return;
    if (!reviewNotes || reviewNotes.trim().length < 5) {
      toast.error("Catatan hasil audit wajib diisi minimal 5 karakter.");
      return;
    }

    try {
      setResolving(true);
      await apiClient.patch(`/attendance/anomalies/${selectedAnomaly.id}/resolve`, {
        status: resolveStatus,
        reviewNotes,
      });

      toast.success("Resolusi anomali presensi berhasil dicatat pada audit trail.");
      setSelectedAnomaly(null);
      setReviewNotes("");
      await fetchAnomalies();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal memperbarui status anomali.");
    } finally {
      setResolving(false);
    }
  };

  const filtered = anomalies.filter((a) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = a.actorName?.toLowerCase().includes(q);
      const matchType = a.anomalyType?.toLowerCase().includes(q);
      const matchDetails = a.details?.toLowerCase().includes(q);
      if (!matchName && !matchType && !matchDetails) return false;
    }
    return true;
  });

  const pendingCount = anomalies.filter((a) => a.status === "PENDING_REVIEW").length;
  const highCount = anomalies.filter((a) => a.severity === "HIGH" || a.severity === "CRITICAL").length;

  return (
    <div className="space-y-4">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                Menunggu Tinjauan Manusia
              </span>
              <p className="text-xl font-bold text-amber-950 dark:text-amber-100 mt-0.5">
                {pendingCount} Kasus
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-amber-200/80 dark:bg-amber-900/60 flex items-center justify-center text-amber-800 dark:text-amber-200">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/40 dark:bg-rose-950/20">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                Indikasi Pelanggaran Kritis/Tinggi
              </span>
              <p className="text-xl font-bold text-rose-950 dark:text-rose-100 mt-0.5">
                {highCount} Kasus
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-rose-200/80 dark:bg-rose-900/60 flex items-center justify-center text-rose-800 dark:text-rose-200">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                Total Telemetri Anomali
              </span>
              <p className="text-xl font-bold text-blue-950 dark:text-blue-100 mt-0.5">
                {anomalies.length} Kejadian
              </p>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-200/80 dark:bg-blue-900/60 flex items-center justify-center text-blue-800 dark:text-blue-200">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Cari pelaku, jenis anomali, atau rincian..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[140px] text-xs h-8">
              <SelectValue placeholder="Tingkat Bahaya" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Bahaya</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] text-xs h-8">
              <SelectValue placeholder="Status Resolusi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="PENDING_REVIEW">Perlu Tinjauan</SelectItem>
              <SelectItem value="RESOLVED_CONFIRMED_FRAUD">Pelanggaran Terbukti</SelectItem>
              <SelectItem value="RESOLVED_FALSE_POSITIVE">False Positive Sah</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchAnomalies}
          disabled={loading}
          className="text-xs h-8 gap-1.5"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          <span>Segarkan</span>
        </Button>
      </div>

      {/* Anomaly Records List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Memuat telemetri deteksi anomali...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed bg-muted/20 text-xs text-muted-foreground">
            <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
            Tidak ditemukan anomali atau indikasi kecurangan presensi.
          </div>
        ) : (
          filtered.map((item) => (
            <Card
              key={item.id}
              className={`border transition-all ${
                item.status === "PENDING_REVIEW"
                  ? item.severity === "HIGH" || item.severity === "CRITICAL"
                    ? "border-rose-300 dark:border-rose-900 bg-rose-50/20"
                    : "border-amber-300 dark:border-amber-900 bg-amber-50/20"
                  : "border-border bg-card"
              }`}
            >
              <CardContent className="p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.severity === "HIGH" || item.severity === "CRITICAL"
                          ? "destructive"
                          : "terlambat"
                      }
                      className="text-[10px] font-bold"
                    >
                      {item.severity}
                    </Badge>
                    <span className="font-bold text-xs text-foreground font-mono">
                      {item.anomalyType}
                    </span>
                    <Badge
                      variant={item.status === "PENDING_REVIEW" ? "outline" : "hadir"}
                      className="text-[10px]"
                    >
                      {item.status === "PENDING_REVIEW"
                        ? "Menunggu Tinjauan"
                        : item.status === "RESOLVED_CONFIRMED_FRAUD"
                        ? "Kecurangan Terbukti"
                        : "False Positive Sah"}
                    </Badge>
                  </div>

                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.createdAt).toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    WIB
                  </span>
                </div>

                <p className="text-xs text-foreground font-medium">{item.details}</p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t">
                  <span className="flex items-center gap-1 text-foreground font-semibold">
                    <User className="h-3 w-3 text-primary" />
                    {item.actorName} ({item.userRole})
                  </span>
                  {item.deviceId && (
                    <span className="flex items-center gap-1 font-mono">
                      <Smartphone className="h-3 w-3 text-blue-500" />
                      ID Perangkat: {item.deviceId}
                    </span>
                  )}
                  {item.coords && (
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin className="h-3 w-3 text-rose-500" />
                      GPS: {item.coords.lat.toFixed(4)}, {item.coords.lon.toFixed(4)}{" "}
                      (±{item.coords.accuracy}m)
                    </span>
                  )}
                  {item.ipAddress && (
                    <span className="font-mono">IP: {item.ipAddress}</span>
                  )}

                  {item.status === "PENDING_REVIEW" ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedAnomaly(item);
                        setReviewNotes("");
                      }}
                      className="ml-auto h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      <span>Tinjau & Resolusi</span>
                    </Button>
                  ) : (
                    <span className="ml-auto text-[11px] text-emerald-600 font-semibold italic">
                      Ditinjau: {item.reviewNotes || "Diselesaikan"}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog Resolusi Anomali */}
      <Dialog open={!!selectedAnomaly} onOpenChange={(open) => !open && setSelectedAnomaly(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Tinjauan Audit Investigasi Anomali
            </DialogTitle>
            <DialogDescription className="text-xs">
              Hasil tinjauan manusia akan dicatat permanen dalam audit log sistem SIAKAD.
            </DialogDescription>
          </DialogHeader>

          {selectedAnomaly && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 rounded-lg bg-muted/40 border space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Pelaku: {selectedAnomaly.actorName}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {selectedAnomaly.anomalyType}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{selectedAnomaly.details}</p>
                {selectedAnomaly.deviceId && (
                  <p className="font-mono text-[11px]">Device ID: {selectedAnomaly.deviceId}</p>
                )}
              </div>

              <div>
                <label className="font-semibold block mb-1">Keputusan Resolusi:</label>
                <Select value={resolveStatus} onValueChange={setResolveStatus}>
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESOLVED_CONFIRMED_FRAUD">
                      RESOLVED_CONFIRMED_FRAUD (Terbukti Melanggar/Manipulasi)
                    </SelectItem>
                    <SelectItem value="RESOLVED_FALSE_POSITIVE">
                      RESOLVED_FALSE_POSITIVE (Kasus Sah / Gangguan GPS Fisik)
                    </SelectItem>
                    <SelectItem value="INVESTIGATING">
                      INVESTIGATING (Sedang Pemanggilan Siswa/Guru)
                    </SelectItem>
                    <SelectItem value="DISMISSED">
                      DISMISSED (Dibatalkan)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Catatan Hasil Investigasi / Verifikasi:</label>
                <Textarea
                  placeholder="Contoh: Siswa telah dikonfirmasi berada di perpustakaan sekolah pada jam tersebut, GPS terhalang struktur beton."
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedAnomaly(null)}
              className="text-xs"
            >
              Tutup
            </Button>
            <Button
              size="sm"
              onClick={handleResolve}
              disabled={resolving}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{resolving ? "Menyimpan..." : "Simpan Keputusan Audit"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
