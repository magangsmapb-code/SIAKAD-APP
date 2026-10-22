"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { School, Plus, Edit } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { classFormSchema, ClassFormInput } from "@/lib/validators";
import { SchoolClass, ClassLevel, Major } from "@/types";
import { useSchoolData } from "@/contexts/school-data-context";

interface ClassFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classToEdit?: SchoolClass | null;
}

export function ClassFormModal({
  open,
  onOpenChange,
  classToEdit,
}: ClassFormModalProps) {
  const { teachers, addClass, updateClass } = useSchoolData();
  const isEditing = Boolean(classToEdit);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClassFormInput>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
      level: "X",
      major: "MIPA",
      homeroomTeacherId: "",
      roomNumber: "",
      academicYear: "2026/2027",
    },
  });

  const selectedLevel = watch("level");
  const selectedMajor = watch("major");
  const selectedHomeroom = watch("homeroomTeacherId");

  React.useEffect(() => {
    if (classToEdit) {
      reset({
        name: classToEdit.name,
        level: classToEdit.level,
        major: classToEdit.major,
        homeroomTeacherId: classToEdit.homeroomTeacherId,
        roomNumber: classToEdit.roomNumber,
        academicYear: classToEdit.academicYear,
      });
    } else {
      reset({
        name: "",
        level: "X",
        major: "MIPA",
        homeroomTeacherId: teachers[0]?.id || "",
        roomNumber: "R.101 (Lantai 1)",
        academicYear: "2026/2027",
      });
    }
  }, [classToEdit, reset, teachers, open]);

  const onSubmit = (data: ClassFormInput) => {
    if (isEditing && classToEdit) {
      updateClass(classToEdit.id, data);
    } else {
      addClass(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <School className="h-5 w-5" />
            <DialogTitle className="text-base font-bold">
              {isEditing ? "Edit Rombongan Belajar" : "Buat Rombel Baru"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {isEditing
              ? `Perbarui informasi wali kelas dan ruangan untuk ${classToEdit?.name}`
              : "Tetapkan nama rombel, jenjang, wali kelas, serta ruangan presensi."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Class Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Nama Rombel / Kelas <span className="text-destructive">*</span>
            </label>
            <Input
              {...register("name")}
              placeholder="Contoh: X MIPA 3 atau XI IPS 2"
              className="h-8 text-xs font-semibold"
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Level & Major */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Tingkat / Jenjang <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedLevel}
                onValueChange={(val: ClassLevel) => setValue("level", val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Pilih Tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="X" className="text-xs">
                    Kelas X (Sepuluh)
                  </SelectItem>
                  <SelectItem value="XI" className="text-xs">
                    Kelas XI (Sebelas)
                  </SelectItem>
                  <SelectItem value="XII" className="text-xs">
                    Kelas XII (Duabelas)
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.level && (
                <p className="text-[11px] text-destructive">{errors.level.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Peminatan / Jurusan <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedMajor}
                onValueChange={(val: Major) => setValue("major", val)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Pilih Jurusan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MIPA" className="text-xs">
                    MIPA (Sains & Matematika)
                  </SelectItem>
                  <SelectItem value="IPS" className="text-xs">
                    IPS (Sosial & Humaniora)
                  </SelectItem>
                  <SelectItem value="UMUM" className="text-xs">
                    Umum / Fase E
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.major && (
                <p className="text-[11px] text-destructive">{errors.major.message}</p>
              )}
            </div>
          </div>

          {/* Homeroom Teacher */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Wali Kelas <span className="text-destructive">*</span>
            </label>
            <Select
              value={selectedHomeroom}
              onValueChange={(val) => setValue("homeroomTeacherId", val)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Pilih Guru sebagai Wali Kelas" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.fullName} ({t.nip})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.homeroomTeacherId && (
              <p className="text-[11px] text-destructive">
                {errors.homeroomTeacherId.message}
              </p>
            )}
          </div>

          {/* Room Number & Academic Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Ruangan Belajar <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("roomNumber")}
                placeholder="R.101 (Lantai 1)"
                className="h-8 text-xs"
              />
              {errors.roomNumber && (
                <p className="text-[11px] text-destructive">
                  {errors.roomNumber.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Tahun Ajaran <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("academicYear")}
                placeholder="2026/2027"
                className="h-8 text-xs font-mono"
              />
              {errors.academicYear && (
                <p className="text-[11px] text-destructive">
                  {errors.academicYear.message}
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
              {isEditing ? "Simpan Perubahan" : "Buat Rombel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
