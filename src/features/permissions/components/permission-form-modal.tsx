"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FilePlus,
  Calendar,
  User,
  Paperclip,
  Upload,
  Info,
  CheckCircle2,
  X,
  FileCheck2,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  permissionRequestSchema,
  PermissionRequestInput,
} from "@/lib/validators";
import { useSchoolData } from "@/contexts/school-data-context";
import { PermissionRequest } from "@/types";

interface PermissionFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (permission: PermissionRequest) => void;
}

export function PermissionFormModal({
  open,
  onOpenChange,
  onSuccess,
}: PermissionFormModalProps) {
  const { students, addPermission } = useSchoolData();
  const [selectedFile, setSelectedFile] = React.useState<{
    name: string;
    size: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const activeStudents = React.useMemo(
    () => students.filter((s) => s.status === "AKTIF"),
    [students]
  );

  const todayStr = React.useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );

  const form = useForm<PermissionRequestInput>({
    resolver: zodResolver(permissionRequestSchema),
    defaultValues: {
      studentId: "",
      type: "IZIN",
      startDate: todayStr,
      endDate: todayStr,
      reason: "",
      attachmentName: "",
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  // Calculate day count
  const totalDays = React.useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    return isNaN(diff) || diff < 1 ? 1 : diff;
  }, [startDate, endDate]);

  // Handle local demo file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeKb = (file.size / 1024).toFixed(1) + " KB";
      setSelectedFile({ name: file.name, size: sizeKb });
      form.setValue("attachmentName", file.name);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    form.setValue("attachmentName", "");
  };

  const onSubmit = async (data: PermissionRequestInput) => {
    setIsSubmitting(true);
    try {
      const newPerm = await addPermission(data);
      form.reset();
      setSelectedFile(null);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(newPerm);
      }
    } catch (err) {
      console.error("Gagal mengajukan izin:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FilePlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                Pengajuan Izin & Surat Sakit Siswa
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Daftarkan permohonan dispensasi, surat dokter, atau izin keluarga untuk diverifikasi sekolah.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Live Backend Connection Indicator */}
        <div className="text-[11px] bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 rounded-md p-2 flex items-start gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong>Terhubung ke REST API SIAKAD:</strong> Pengajuan izin tersinkronisasi langsung ke sistem dan akan masuk ke antrean verifikasi wali kelas.
          </span>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3.5 pt-1">
          {/* Pilih Siswa */}
          <div className="space-y-1">
            <label className="text-xs font-semibold flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Pilih Siswa <span className="text-destructive">*</span>
            </label>
            <Select
              value={form.watch("studentId")}
              onValueChange={(val) =>
                form.setValue("studentId", val, { shouldValidate: true })
              }
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Pilih siswa yang bersangkutan..." />
              </SelectTrigger>
              <SelectContent>
                {activeStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.fullName} ({s.nis}) • {s.className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.studentId && (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.studentId.message}
              </p>
            )}
          </div>

          {/* Jenis Izin */}
          <div className="space-y-1">
            <label className="text-xs font-semibold">
              Kategori Permohonan Izin <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => form.setValue("type", "IZIN")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                  form.watch("type") === "IZIN"
                    ? "bg-purple-600 text-white border-purple-700 shadow-sm"
                    : "bg-muted/40 hover:bg-purple-50 text-purple-800 dark:text-purple-400"
                }`}
              >
                Izin Biasa
              </button>
              <button
                type="button"
                onClick={() => form.setValue("type", "SAKIT")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                  form.watch("type") === "SAKIT"
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-muted/40 hover:bg-blue-50 text-blue-800 dark:text-blue-400"
                }`}
              >
                Sakit (Medis)
              </button>
              <button
                type="button"
                onClick={() => form.setValue("type", "DISPENSASI")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                  form.watch("type") === "DISPENSASI"
                    ? "bg-amber-600 text-white border-amber-700 shadow-sm"
                    : "bg-muted/40 hover:bg-amber-50 text-amber-800 dark:text-amber-400"
                }`}
              >
                Dispensasi Tugas
              </button>
            </div>
          </div>

          {/* Date Range & Total Days */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Tanggal Mulai <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                className="text-xs h-9"
                {...form.register("startDate")}
              />
              {form.formState.errors.startDate && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Tanggal Selesai <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                className="text-xs h-9"
                {...form.register("endDate")}
              />
              {form.formState.errors.endDate && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-md flex justify-between items-center">
            <span>Perkiraan Durasi Izin:</span>
            <span className="font-bold text-foreground">
              {totalDays} Hari Kalender
            </span>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-xs font-semibold">
              Alasan Lengkap Pengajuan <span className="text-destructive">*</span>
            </label>
            <Textarea
              rows={3}
              placeholder="Jelaskan alasan detail ketidakhadiran (misal: demam tinggi rawat jalan Puskesmas, keperluan keluarga, atau tugas dinas mewakili sekolah)..."
              className="text-xs resize-none"
              {...form.register("reason")}
            />
            {form.formState.errors.reason && (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.reason.message}
              </p>
            )}
          </div>

          {/* Demo File Upload with Working Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-1">
              <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
              Lampiran Dokumen Bukti (Surat Dokter / Tugas / Wali Murid)
            </label>

            {selectedFile ? (
              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/40 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileCheck2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-foreground truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    ({selectedFile.size})
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={handleRemoveFile}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <label className="border border-dashed rounded-lg p-3 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/20 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">
                  Pilih file bukti dari perangkat (PDF, JPG, PNG)
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Maksimal 5 MB • Simulasi unggah frontend
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5"
            >
              <FilePlus className="h-4 w-4" />
              {isSubmitting ? "Mengirim Permohonan..." : "Kirim Pengajuan Izin"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
