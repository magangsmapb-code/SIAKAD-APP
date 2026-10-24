"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  Clock,
  School,
  Wifi,
  BellRing,
  ShieldCheck,
  Save,
  Check,
  Navigation,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { schoolSettingsSchema, SchoolSettingsInput } from "@/lib/validators";
import { useSchoolData } from "@/contexts/school-data-context";
import { INSTITUTION } from "@/lib/constants";
import { toast } from "sonner";

export function SettingsForm() {
  const { schoolSettings, updateSchoolSettings } = useSchoolData();
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SchoolSettingsInput>({
    resolver: zodResolver(schoolSettingsSchema),
    defaultValues: {
      schoolName: INSTITUTION.name,
      npsn: "20512345",
      entryThreshold: INSTITUTION.workingHours.entryThreshold,
      lateLimit: INSTITUTION.workingHours.lateLimit,
      exitTimeRegular: INSTITUTION.workingHours.exitTimeRegular,
      exitTimeFriday: INSTITUTION.workingHours.exitTimeFriday,
      toleranceMinutes: 15,
      telegramNotification: true,
      whatsappNotification: true,
      enableGps: true,
      schoolLatitude: -8.0435,
      schoolLongitude: 111.4123,
      maxGpsRadiusMeters: 100,
      maxGpsAccuracyMeters: 50,
    },
  });

  React.useEffect(() => {
    if (schoolSettings) {
      reset({
        schoolName: schoolSettings.schoolName || INSTITUTION.name,
        npsn: schoolSettings.npsn || "20512345",
        entryThreshold: schoolSettings.entryThreshold || INSTITUTION.workingHours.entryThreshold,
        lateLimit: schoolSettings.lateLimit || INSTITUTION.workingHours.lateLimit,
        exitTimeRegular: schoolSettings.exitTimeRegular || INSTITUTION.workingHours.exitTimeRegular,
        exitTimeFriday: schoolSettings.exitTimeFriday || INSTITUTION.workingHours.exitTimeFriday,
        toleranceMinutes: schoolSettings.toleranceMinutes || 15,
        telegramNotification: schoolSettings.telegramNotification ?? true,
        whatsappNotification: schoolSettings.whatsappNotification ?? true,
        enableGps: schoolSettings.enableGps ?? true,
        schoolLatitude: schoolSettings.schoolLatitude ?? -8.0435,
        schoolLongitude: schoolSettings.schoolLongitude ?? 111.4123,
        maxGpsRadiusMeters: schoolSettings.maxGpsRadiusMeters ?? 100,
        maxGpsAccuracyMeters: schoolSettings.maxGpsAccuracyMeters ?? 50,
      });
    }
  }, [schoolSettings, reset]);

  const waNotif = watch("whatsappNotification");
  const tgNotif = watch("telegramNotification");
  const enableGps = watch("enableGps");
  const maxRadius = watch("maxGpsRadiusMeters");

  const handleDetectLocation = () => {
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setValue("schoolLatitude", parseFloat(pos.coords.latitude.toFixed(6)));
          setValue("schoolLongitude", parseFloat(pos.coords.longitude.toFixed(6)));
          toast.success("Koordinat lokasi GPS berhasil dideteksi.");
        },
        (err) => {
          toast.error("Gagal mendeteksi lokasi GPS: " + err.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      toast.error("Browser tidak mendukung sensor Geolocation.");
    }
  };

  const onSubmit = async (data: SchoolSettingsInput) => {
    setIsSubmitting(true);
    try {
      await updateSchoolSettings(data);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      // Handled by updateSchoolSettings toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {savedSuccess && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" />
          <span>Pengaturan presensi berhasil disimpan ke konfigurasi sistem.</span>
        </div>
      )}

      {/* Profil Sekolah */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <School className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-bold">Identitas Sekolah</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Profil resmi lembaga penyelenggara presensi digital
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Nama Sekolah</span>
              <span className="text-destructive">*</span>
            </label>
            <Input {...register("schoolName")} error={!!errors.schoolName} />
            {errors.schoolName && (
              <p className="text-[11px] text-destructive">{errors.schoolName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>NPSN</span>
              <span className="text-destructive">*</span>
            </label>
            <Input {...register("npsn")} error={!!errors.npsn} />
            {errors.npsn && (
              <p className="text-[11px] text-destructive">{errors.npsn.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Lokasi Lembaga</label>
            <Input value={INSTITUTION.location} disabled className="bg-muted/40" />
          </div>
        </CardContent>
      </Card>

      {/* Konfigurasi Jam & Toleransi Presensi */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base font-bold">Jadwal & Jam Operasional Presensi</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Aturan ambang batas masuk, batas toleransi terlambat, dan jam kepulangan siswa
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Jam Batas Masuk (WIB)</span>
              <span className="text-destructive">*</span>
            </label>
            <Input {...register("entryThreshold")} placeholder="07:00" error={!!errors.entryThreshold} />
            <span className="text-[10px] text-muted-foreground">Sebelum jam ini = Tepat Waktu</span>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Batas Maksimal Toleransi (WIB)</span>
              <span className="text-destructive">*</span>
            </label>
            <Input {...register("lateLimit")} placeholder="07:15" error={!!errors.lateLimit} />
            <span className="text-[10px] text-muted-foreground">Lewat jam ini = Terlambat</span>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Jam Pulang Reguler (Senin - Kamis)</span>
              <span className="text-destructive">*</span>
            </label>
            <Input {...register("exitTimeRegular")} placeholder="14:30" error={!!errors.exitTimeRegular} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>Jam Pulang Khusus Jumat</span>
              <span className="text-destructive">*</span>
            </label>
            <Input {...register("exitTimeFriday")} placeholder="11:30" error={!!errors.exitTimeFriday} />
          </div>
        </CardContent>
      </Card>

      {/* Konfigurasi Geofencing & Radius GPS Presensi */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-emerald-600" />
              <div>
                <CardTitle className="text-base font-bold">Geofencing & Radius Lokasi Presensi</CardTitle>
                <CardDescription className="text-xs">
                  Batas radius toleransi jarak fisik GPS siswa dan guru dari sekolah
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              Radius: {maxRadius || 100} m
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 rounded-xl border border-border p-3 cursor-pointer hover:bg-muted/30">
            <Checkbox
              checked={enableGps}
              onCheckedChange={(c) => setValue("enableGps", !!c)}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground">
                Wajibkan Verifikasi Radius Lokasi GPS
              </span>
              <p className="text-[11px] text-muted-foreground">
                Menolak presensi mandiri atau presensi token/QR jika perangkat pengguna berada di luar radius toleransi sekolah.
              </p>
            </div>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Latitude Sekolah</span>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  className="text-[10px] text-primary hover:underline font-normal flex items-center gap-1"
                >
                  <MapPin className="h-3 w-3" />
                  Deteksi GPS
                </button>
              </label>
              <Input
                type="number"
                step="any"
                {...register("schoolLatitude")}
                placeholder="-8.043500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Longitude Sekolah
              </label>
              <Input
                type="number"
                step="any"
                {...register("schoolLongitude")}
                placeholder="111.412300"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Radius Toleransi (Meter)
              </label>
              <Input
                type="number"
                min={10}
                max={5000}
                {...register("maxGpsRadiusMeters")}
                placeholder="100"
              />
              <span className="text-[10px] text-muted-foreground">Rekomendasi: 50m - 150m</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Mesin & Integrasi Notifikasi */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base font-bold">Integrasi Notifikasi Wali Murid</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Kirimkan notifikasi otomatis ke nomor HP orang tua/wali saat siswa tap kartu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30">
            <Checkbox
              checked={waNotif}
              onCheckedChange={(c) => setValue("whatsappNotification", !!c)}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground">
                Notifikasi WhatsApp Gateway
              </span>
              <p className="text-[11px] text-muted-foreground">
                Kirim pesan otomatis saat siswa tiba di sekolah atau belum hadir hingga pukul 08:00 WIB.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30">
            <Checkbox
              checked={tgNotif}
              onCheckedChange={(c) => setValue("telegramNotification", !!c)}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-foreground">
                Kanal Bot Telegram Guru & Wali Kelas
              </span>
              <p className="text-[11px] text-muted-foreground">
                Laporan ringkas otomatis harian ke grup guru SMA PB Ngrayun.
              </p>
            </div>
          </label>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting} className="gap-2 h-10 px-6 font-semibold">
          <Save className="h-4 w-4" />
          Simpan Pengaturan
        </Button>
      </div>
    </form>
  );
}
