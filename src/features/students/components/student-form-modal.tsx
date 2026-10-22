"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus, UserCheck, CreditCard, School } from "lucide-react";
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
import { studentFormSchema, StudentFormInput } from "@/lib/validators";
import { Student } from "@/types";
import { useSchoolData } from "@/contexts/school-data-context";

interface StudentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentToEdit?: Student | null;
}

export function StudentFormModal({
  open,
  onOpenChange,
  studentToEdit,
}: StudentFormModalProps) {
  const { classes, addStudent, updateStudent } = useSchoolData();
  const isEditing = Boolean(studentToEdit);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      nis: "",
      nisn: "",
      fullName: "",
      gender: "L",
      classId: "",
      phone: "",
      parentName: "",
      parentPhone: "",
      address: "",
      rfidCardUid: "",
      status: "AKTIF",
      academicYear: "2026/2027",
    },
  });

  const selectedGender = watch("gender");
  const selectedClassId = watch("classId");
  const selectedStatus = watch("status");

  // Sync form when modal opens or studentToEdit changes
  React.useEffect(() => {
    if (studentToEdit) {
      reset({
        nis: studentToEdit.nis,
        nisn: studentToEdit.nisn,
        fullName: studentToEdit.fullName,
        gender: studentToEdit.gender,
        classId: studentToEdit.classId,
        phone: studentToEdit.phone,
        parentName: studentToEdit.parentName,
        parentPhone: studentToEdit.parentPhone,
        address: studentToEdit.address,
        rfidCardUid: studentToEdit.rfidCardUid || "",
        status: studentToEdit.status,
        academicYear: studentToEdit.academicYear || "2026/2027",
      });
    } else {
      reset({
        nis: "",
        nisn: "",
        fullName: "",
        gender: "L",
        classId: classes[0]?.id || "",
        phone: "",
        parentName: "",
        parentPhone: "",
        address: "",
        rfidCardUid: "",
        status: "AKTIF",
        academicYear: "2026/2027",
      });
    }
  }, [studentToEdit, reset, classes, open]);

  const onSubmit = (data: StudentFormInput) => {
    if (isEditing && studentToEdit) {
      updateStudent(studentToEdit.id, data);
    } else {
      addStudent(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            {isEditing ? (
              <UserCheck className="h-5 w-5" />
            ) : (
              <UserPlus className="h-5 w-5" />
            )}
            <DialogTitle className="text-base font-bold">
              {isEditing ? "Edit Data Siswa" : "Tambah Data Siswa Baru"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {isEditing
              ? `Perbarui profil dan data administratif untuk ${studentToEdit?.fullName}`
              : "Masukkan kelengkapan data induk siswa dan registrasi kartu RFID presensi."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Section: Identitas Utama */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Identitas Akademik & Pokok
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  NIS (Nomor Induk Siswa) <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("nis")}
                  placeholder="Contoh: 2401"
                  className="h-8 text-xs font-mono"
                />
                {errors.nis && (
                  <p className="text-[11px] text-destructive">{errors.nis.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  NISN (10 Digit Nasional) <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("nisn")}
                  placeholder="Contoh: 0078912345"
                  className="h-8 text-xs font-mono"
                />
                {errors.nisn && (
                  <p className="text-[11px] text-destructive">{errors.nisn.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Nama Lengkap Siswa <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("fullName")}
                placeholder="Nama lengkap sesuai akta / ijazah"
                className="h-8 text-xs"
              />
              {errors.fullName && (
                <p className="text-[11px] text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Jenis Kelamin <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selectedGender}
                  onValueChange={(val: "L" | "P") => setValue("gender", val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Pilih JK" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L" className="text-xs">
                      Laki-laki (L)
                    </SelectItem>
                    <SelectItem value="P" className="text-xs">
                      Perempuan (P)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-[11px] text-destructive">
                    {errors.gender.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Rombel / Kelas <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selectedClassId}
                  onValueChange={(val) => setValue("classId", val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Pilih Rombel" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.classId && (
                  <p className="text-[11px] text-destructive">
                    {errors.classId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Status Siswa <span className="text-destructive">*</span>
                </label>
                <Select
                  value={selectedStatus}
                  onValueChange={(val: "AKTIF" | "LULUS" | "MUTASI" | "NON_AKTIF") =>
                    setValue("status", val)
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF" className="text-xs">
                      Aktif
                    </SelectItem>
                    <SelectItem value="NON_AKTIF" className="text-xs">
                      Non-Aktif
                    </SelectItem>
                    <SelectItem value="MUTASI" className="text-xs">
                      Mutasi Keluar
                    </SelectItem>
                    <SelectItem value="LULUS" className="text-xs">
                      Lulus
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Kontak & Wali */}
          <div className="space-y-3 pt-2 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Kontak & Data Orang Tua
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Nama Orang Tua / Wali <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("parentName")}
                  placeholder="Nama ayah / ibu / wali"
                  className="h-8 text-xs"
                />
                {errors.parentName && (
                  <p className="text-[11px] text-destructive">
                    {errors.parentName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  Nomor Telepon/WA Ortu <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("parentPhone")}
                  placeholder="081234567890"
                  className="h-8 text-xs font-mono"
                />
                {errors.parentPhone && (
                  <p className="text-[11px] text-destructive">
                    {errors.parentPhone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">
                  No. HP / WhatsApp Siswa <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("phone")}
                  placeholder="085812340000"
                  className="h-8 text-xs font-mono"
                />
                {errors.phone && (
                  <p className="text-[11px] text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                  <CreditCard className="h-3 w-3 text-primary" />
                  UID Kartu RFID Presensi (Opsional)
                </label>
                <Input
                  {...register("rfidCardUid")}
                  placeholder="Contoh: E2000019283710A1"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Alamat Domisili Siswa <span className="text-destructive">*</span>
              </label>
              <Textarea
                {...register("address")}
                placeholder="Dusun, RT/RW, Desa di Kecamatan Ngrayun/Ponorogo"
                className="text-xs min-h-[60px]"
              />
              {errors.address && (
                <p className="text-[11px] text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              {isEditing ? "Simpan Perubahan" : "Daftarkan Siswa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
