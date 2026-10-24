"use client";

import * as React from "react";
import {
  MapPin,
  Clock,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Smartphone,
  Navigation,
  FileQuestion,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface TeacherTodayResponse {
  teacher: {
    id: string;
    fullName: string;
    nip: string;
  };
  todayRecord: {
    id: string;
    date: string;
    status: string;
    checkInTime: string;
    checkOutTime: string | null;
    method: string;
    distanceMeters?: number | null;
  } | null;
  config: {
    checkInStartTime: string;
    checkInEndTime: string;
    lateThresholdTime: string;
    checkOutStartTime: string;
    checkOutEndTime: string;
    enableGps: boolean;
    schoolLatitude: number;
    schoolLongitude: number;
    maxGpsRadiusMeters: number;
    maxGpsAccuracyMeters: number;
    allowTeacherSelfCheckIn: boolean;
  };
  currentWibTime: string;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function TeacherAttendanceCard() {
  const [data, setData] = React.useState<TeacherTodayResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [locating, setLocating] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  // Local GPS Telemetry
  const [coords, setCoords] = React.useState<{
    lat: number;
    lon: number;
    accuracy: number;
  } | null>(null);
  const [distance, setDistance] = React.useState<number | null>(null);
  const [gpsError, setGpsError] = React.useState<string | null>(null);

  // Clock
  const [wibClock, setWibClock] = React.useState<string>("");

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setWibClock(
        now.toLocaleTimeString("id-ID", {
          timeZone: "Asia/Jakarta",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).replace(".", ":") + " WIB"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadTodayData = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<TeacherTodayResponse>("/attendance/teacher/today");
      if (res && res.data) {
        setData(res.data);
      }
    } catch {
      // Fallback if demo or offline
      setData({
        teacher: {
          id: "tch-demo",
          fullName: "Drs. Bambang Sudiro, M.Pd",
          nip: "19780512 200501 1 008",
        },
        todayRecord: null,
        config: {
          checkInStartTime: "06:30",
          checkInEndTime: "07:30",
          lateThresholdTime: "07:00",
          checkOutStartTime: "14:00",
          checkOutEndTime: "16:00",
          enableGps: true,
          schoolLatitude: -8.0435,
          schoolLongitude: 111.4123,
          maxGpsRadiusMeters: 100,
          maxGpsAccuracyMeters: 50,
          allowTeacherSelfCheckIn: true,
        },
        currentWibTime: "06:45",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTodayData();
  }, [loadTodayData]);

  const requestGpsPosition = async (): Promise<{
    lat: number;
    lon: number;
    accuracy: number;
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Perangkat tidak mendukung geolokasi GPS."));
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          const p = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy),
          };
          setCoords(p);
          setGpsError(null);

          if (data?.config) {
            const dist = calculateDistance(
              data.config.schoolLatitude,
              data.config.schoolLongitude,
              p.lat,
              p.lon
            );
            setDistance(dist);
          }
          resolve(p);
        },
        (err) => {
          setLocating(false);
          let msg = "Gagal membaca sinyal lokasi GPS.";
          if (err.code === err.PERMISSION_DENIED) {
            msg = "Izin lokasi GPS ditolak oleh browser.";
          }
          setGpsError(msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  };

  const getOrCreateDeviceId = (): string => {
    let id = localStorage.getItem("siakad_client_device_id");
    if (!id) {
      id = "web_teacher_" + Math.random().toString(36).substring(2, 12);
      localStorage.setItem("siakad_client_device_id", id);
    }
    return id;
  };

  const handleCheckIn = async () => {
    try {
      setSubmitting(true);
      const pos = await requestGpsPosition();
      const deviceId = getOrCreateDeviceId();
      const nonce = "nonce_tch_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

      const payload = {
        latitude: pos.lat,
        longitude: pos.lon,
        gpsAccuracyMeters: pos.accuracy,
        deviceId,
        deviceModel: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 60) : "Browser",
        nonce,
        notes: `Presensi kedatangan guru (${pos.accuracy}m)`,
      };

      const res = await apiClient.post("/attendance/teacher/check-in", payload);
      toast.success(res.message || "Presensi kedatangan guru berhasil diverifikasi!");
      await loadTodayData();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Gagal melakukan absensi guru.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setSubmitting(true);
      const pos = await requestGpsPosition();
      const deviceId = getOrCreateDeviceId();
      const nonce = "nonce_tch_out_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);

      const payload = {
        latitude: pos.lat,
        longitude: pos.lon,
        gpsAccuracyMeters: pos.accuracy,
        deviceId,
        nonce,
        notes: "Presensi kepulangan guru",
      };

      const res = await apiClient.post("/attendance/teacher/check-out", payload);
      toast.success(res.message || "Presensi kepulangan guru berhasil dicatat!");
      await loadTodayData();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.message || "Gagal melakukan check-out guru.";
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const record = data?.todayRecord;
  const config = data?.config;

  return (
    <Card className="border-blue-200 dark:border-blue-900 shadow-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-transparent pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600" />
                Presensi Harian Kerja Guru
              </CardTitle>
              <Badge variant="outline" className="text-[11px] font-semibold bg-background">
                WIB Server Verified
              </Badge>
            </div>
            <CardDescription className="text-xs mt-0.5">
              Presensi kehadiran kedatangan dan kepulangan guru bersertifikasi resmi
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono text-xs gap-1.5 py-1 px-2.5">
              <Clock className="h-3.5 w-3.5 text-blue-600" />
              <span>{wibClock || "Memuat jam..."}</span>
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={loadTodayData}
              disabled={loading}
              title="Perbarui data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-3">
        {/* Schedule window indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted/50 border text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px]">Jam Masuk Guru:</span>
            <span className="font-semibold text-foreground">
              {config?.checkInStartTime || "06:30"} - {config?.checkInEndTime || "07:30"} WIB
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Toleransi Masuk:</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Maksimal {config?.lateThresholdTime || "07:00"} WIB
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px]">Jam Kepulangan:</span>
            <span className="font-semibold text-foreground">
              {config?.checkOutStartTime || "14:00"} - {config?.checkOutEndTime || "16:00"} WIB
            </span>
          </div>
        </div>

        {/* Live Attendance State & Buttons */}
        <div className="rounded-xl border p-4 bg-muted/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs text-muted-foreground">Status Kehadiran Hari Ini:</span>
              <div className="flex items-center gap-2 mt-1">
                {record?.checkInTime ? (
                  <Badge
                    variant={record.status === "HADIR" ? "hadir" : "terlambat"}
                    className="text-xs px-2.5 py-0.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    {record.status === "HADIR" ? "Hadir Tepat Waktu" : "Hadir Terlambat"}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs px-2.5 py-0.5 text-muted-foreground">
                    Belum Check-in Masuk
                  </Badge>
                )}

                {record?.checkInTime && (
                  <span className="text-xs text-foreground font-semibold">
                    Masuk:{" "}
                    {new Date(record.checkInTime).toLocaleTimeString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    WIB
                  </span>
                )}

                {record?.checkOutTime && (
                  <span className="text-xs text-blue-600 font-semibold">
                    &bull; Pulang:{" "}
                    {new Date(record.checkOutTime).toLocaleTimeString("id-ID", {
                      timeZone: "Asia/Jakarta",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    WIB
                  </span>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {!record?.checkInTime ? (
                <Button
                  onClick={handleCheckIn}
                  disabled={submitting || locating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-4 shadow gap-1.5"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{submitting ? "Memverifikasi..." : "Check-in Masuk (GPS)"}</span>
                </Button>
              ) : !record?.checkOutTime ? (
                <Button
                  onClick={handleCheckOut}
                  disabled={submitting || locating}
                  variant="outline"
                  className="border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 font-semibold text-xs h-9 px-4 gap-1.5"
                >
                  <LogOut className="h-3.5 w-3.5 text-blue-600" />
                  <span>{submitting ? "Memverifikasi..." : "Check-out Pulang"}</span>
                </Button>
              ) : (
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 py-1.5 px-3">
                  <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600" />
                  Kehadiran Lengkap
                </Badge>
              )}
            </div>
          </div>

          {/* Telemetry info */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Radius Sekolah SMA PB: {config?.maxGpsRadiusMeters || 100}m
            </span>
            <span className="flex items-center gap-1">
              <Smartphone className="h-3 w-3 text-blue-600" />
              Perangkat Terdaftar
            </span>
            {distance !== null && (
              <span className={`font-semibold ${distance <= (config?.maxGpsRadiusMeters || 100) ? 'text-emerald-600' : 'text-rose-600'}`}>
                Jarak Anda: {distance}m
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
