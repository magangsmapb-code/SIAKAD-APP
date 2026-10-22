"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GraduationCap, UserPlus, UserCheck, BookOpen } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { teacherFormSchema, TeacherFormInput } from "@/lib/validators";
import { Teacher, TeacherRole } from "@/types";
import { useSchoolData } from "@/contexts/school-data-context";

interface TeacherFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherToEdit?: Teacher | null;
}

const AVAILABLE_SUBJECTS = [
  "Matematika Wajib",
  "Matematika Peminatan",
  "Bahasa Indonesia",
  "Bahasa Inggris",
  "Fisika",
  "Kimia",
  "Biologi",
  "Informatika",
  "Sosiologi",
  "Ekonomi",
  "Geografi",
  "Sejarah Indonesia",
  "Pendidikan Agama Islam",
  "Pendidikan Jasmani & Olahraga",
  "Pendidikan Pancasila & Kewarganegaraan",
  "Bahasa Jawa (Mulok)",
  "Seni Budaya",
];

export function TeacherFormModal({
  open,
  onOpenChange,
  teacherToEdit,
}: TeacherFormModalProps) {
  const { classes, addTeacher, updateTeacher } = useSchoolData();
  const isEditing = Boolean(teacherToEdit);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeacherFormInput>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      nip: "",
      nuptk: "",
      fullName: "",
      title: "",
      email: "",
      phone: "",
      role: "GURU_MAPEL",
      subjects: [],
      isHomeroom: false,
      assignedClass: "",
      status: "AKTIF",
    },
  });

  const selectedRole = watch("role");
  const selectedStatus = watch("status");
  const selectedSubjects = watch("subjects") || [];
  const isHomeroom = watch("isHomeroom");
  const assignedClass = watch("assignedClass");

  React.useEffect(() => {
    if (teacherToEdit) {
      reset({
        nip: teacherToEdit.nip,
        nuptk: teacherToEdit.nuptk || "",
        fullName: teacherToEdit.fullName,
        title: teacherToEdit.title,
        email: teacherToEdit.email,
        phone: teacherToEdit.phone,
        role: teacherToEdit.role,
        subjects: teacherToEdit.subjects || [],
        isHomeroom: teacherToEdit.isHomeroom || false,
        assignedClass: teacherToEdit.assignedClass || "",
        status: teacherToEdit.status,
      });
    } else {
      reset({
        nip: "",
        nuptk: "",
        fullName: "",
        title: "Guru Mata Pelajaran",
        email: "",
        phone: "",
        role: "GURU_MAPEL",
        subjects: [],
        isHomeroom: false,
        assignedClass: "",
        status: "AKTIF",
      });
    }
  }, [teacherToEdit, reset, open]);

  const handleToggleSubject = (subject: string) => {
    const current = selectedSubjects;
    if (current.includes(subject)) {
      setValue(
        "subjects",
        current.filter((s) => s !== subject),
        { shouldValidate: true }
      );
    } else {
      setValue("subjects", [...current, subject], { shouldValidate: true });
    }
  };

  const onSubmit = (data: TeacherFormInput) => {
    if (isEditing && teacherToEdit) {
      updateTeacher(teacherToEdit.id, data);
    } else {
      addTeacher(data);
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
              {isEditing ? "Edit Data Tenaga Pendidik" : "Tambah Guru / Tenaga Pendidik"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {isEditing
              ? `Perbarui profil pengajar, NIP, penugasan rombel, dan mata pelajaran untuk ${teacherToEdit?.fullName}`
              : "Lengkapi data pengajar untuk kebutuhan jadwal dan hak akses presensi di SMA PB Ngrayun."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* NIP & NUPTK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                NIP / Kode Guru <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("nip")}
                placeholder="198403152009032008"
                className="h-8 text-xs font-mono"
              />
              {errors.nip && (
                <p className="text-[11px] text-destructive">{errors.nip.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                NUPTK (16 Digit, Opsional)
              </label>
              <Input
                {...register("nuptk")}
                placeholder="4146762663210093"
                className="h-8 text-xs font-mono"
              />
              {errors.nuptk && (
                <p className="text-[11px] text-destructive">{errors.nuptk.message}</p>
              )}
            </div>
          </div>

          {/* Full Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Nama Lengkap & Gelar <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("fullName")}
                placeholder="Contoh: Siti Rahmawati, S.Pd."
                className="h-8 text-xs"
              />
              {errors.fullName && (
                <p className="text-[11px] text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Jabatan / Bidang Tugas <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("title")}
                placeholder="Contoh: Guru Matematika & Wali Kelas"
                className="h-8 text-xs"
              />
              {errors.title && (
                <p className="text-[11px] text-destructive">
                  {errors.title.message}
                </p>
              )}
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Email Sekolah / Institusi <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("email")}
                placeholder="nama.guru@smapbngrayun.sch.id"
                className="h-8 text-xs font-mono"
              />
              {errors.email && (
                <p className="text-[11px] text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                No. Telepon / WhatsApp <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("phone")}
                placeholder="081234567890"
                className="h-8 text-xs font-mono"
              />
              {errors.phone && (
                <p className="text-[11px] text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Role & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Peran Utama <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedRole}
                onValueChange={(val: TeacherRole) => setValue("role", val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Pilih Peran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GURU_MAPEL" className="text-xs">
                    Guru Mata Pelajaran
                  </SelectItem>
                  <SelectItem value="WALI_KELAS" className="text-xs">
                    Wali Kelas
                  </SelectItem>
                  <SelectItem value="PETUGAS_PIKET" className="text-xs">
                    Petugas Piket Presensi
                  </SelectItem>
                  <SelectItem value="WAKIL_KEPALA" className="text-xs">
                    Wakil Kepala Sekolah
                  </SelectItem>
                  <SelectItem value="KEPALA_SEKOLAH" className="text-xs">
                    Kepala Sekolah
                  </SelectItem>
                  <SelectItem value="TATA_USAHA" className="text-xs">
                    Tata Usaha
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Status Kepegawaian <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedStatus}
                onValueChange={(val: "AKTIF" | "CUTI" | "NON_AKTIF") =>
                  setValue("status", val)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIF" className="text-xs">
                    Aktif Mengajar
                  </SelectItem>
                  <SelectItem value="CUTI" className="text-xs">
                    Cuti Kerja
                  </SelectItem>
                  <SelectItem value="NON_AKTIF" className="text-xs">
                    Non-Aktif / Pensiun
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Wali Kelas Setting */}
          <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/30">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isHomeroom"
                checked={isHomeroom}
                onCheckedChange={(checked) => setValue("isHomeroom", Boolean(checked))}
              />
              <label
                htmlFor="isHomeroom"
                className="text-xs font-semibold leading-none cursor-pointer"
              >
                Ditugaskan sebagai Wali Kelas
              </label>
            </div>

            {isHomeroom && (
              <div className="space-y-1 pl-6 pt-1">
                <label className="text-xs font-medium text-foreground">
                  Pilih Rombel / Kelas Binaan
                </label>
                <Select
                  value={assignedClass}
                  onValueChange={(val) => setValue("assignedClass", val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Pilih Kelas Binaan" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.name} className="text-xs">
                        {c.name} ({c.academicYear})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Mata Pelajaran yang Diampu */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                Mata Pelajaran yang Diampu <span className="text-destructive">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {selectedSubjects.length} dipilih
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 rounded-md border border-border bg-card">
              {AVAILABLE_SUBJECTS.map((subj) => (
                <div key={subj} className="flex items-center space-x-2">
                  <Checkbox
                    id={`subj-${subj}`}
                    checked={selectedSubjects.includes(subj)}
                    onCheckedChange={() => handleToggleSubject(subj)}
                  />
                  <label
                    htmlFor={`subj-${subj}`}
                    className="text-xs leading-none truncate cursor-pointer text-muted-foreground hover:text-foreground"
                    title={subj}
                  >
                    {subj}
                  </label>
                </div>
              ))}
            </div>
            {errors.subjects && (
              <p className="text-[11px] text-destructive">
                {errors.subjects.message}
              </p>
            )}
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
              {isEditing ? "Simpan Perubahan" : "Simpan Tenaga Pendidik"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
