"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, Plus, Edit } from "lucide-react";
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
import { subjectFormSchema, SubjectFormInput } from "@/lib/validators";
import { Subject } from "@/types";
import { useSchoolData } from "@/contexts/school-data-context";

interface SubjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectToEdit?: Subject | null;
}

export function SubjectFormModal({
  open,
  onOpenChange,
  subjectToEdit,
}: SubjectFormModalProps) {
  const { teachers, addSubject, updateSubject } = useSchoolData();
  const isEditing = Boolean(subjectToEdit);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubjectFormInput>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      code: "",
      name: "",
      category: "WAJIB",
      creditHours: 4,
      isActive: true,
      assignedTeachers: [],
    },
  });

  const selectedCategory = watch("category");
  const selectedTeachers = watch("assignedTeachers") || [];
  const isActive = watch("isActive");

  React.useEffect(() => {
    if (subjectToEdit) {
      reset({
        code: subjectToEdit.code,
        name: subjectToEdit.name,
        category: subjectToEdit.category,
        creditHours: subjectToEdit.creditHours,
        isActive: subjectToEdit.isActive ?? true,
        assignedTeachers: subjectToEdit.teacherNames || [],
      });
    } else {
      reset({
        code: "",
        name: "",
        category: "WAJIB",
        creditHours: 4,
        isActive: true,
        assignedTeachers: [],
      });
    }
  }, [subjectToEdit, reset, open]);

  const handleToggleTeacher = (teacherName: string) => {
    const current = selectedTeachers;
    if (current.includes(teacherName)) {
      setValue(
        "assignedTeachers",
        current.filter((t) => t !== teacherName)
      );
    } else {
      setValue("assignedTeachers", [...current, teacherName]);
    }
  };

  const onSubmit = (data: SubjectFormInput) => {
    if (isEditing && subjectToEdit) {
      updateSubject(subjectToEdit.id, {
        code: data.code.toUpperCase(),
        name: data.name,
        category: data.category,
        creditHours: data.creditHours,
        isActive: data.isActive,
        teacherNames: data.assignedTeachers,
        teacherCount: data.assignedTeachers ? data.assignedTeachers.length : 0,
      });
    } else {
      addSubject(data);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" />
            <DialogTitle className="text-base font-bold">
              {isEditing ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            {isEditing
              ? `Perbarui kode, alokasi jam, dan guru pengampu untuk ${subjectToEdit?.name}`
              : "Masukkan mata pelajaran kurikulum dan tentukan alokasi JP per minggu."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Code & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Kode Mapel <span className="text-destructive">*</span>
              </label>
              <Input
                {...register("code")}
                placeholder="Contoh: MAT-W"
                className="h-8 text-xs font-mono uppercase"
              />
              {errors.code && (
                <p className="text-[11px] text-destructive">{errors.code.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Kategori Kurikulum <span className="text-destructive">*</span>
              </label>
              <Select
                value={selectedCategory}
                onValueChange={(val: "WAJIB" | "PEMINATAN" | "MUATAN_LOKAL") =>
                  setValue("category", val)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WAJIB" className="text-xs">
                    Wajib (Umum)
                  </SelectItem>
                  <SelectItem value="PEMINATAN" className="text-xs">
                    Peminatan (MIPA/IPS)
                  </SelectItem>
                  <SelectItem value="MUATAN_LOKAL" className="text-xs">
                    Muatan Lokal (Mulok)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Name & Credit Hours */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Nama Mata Pelajaran <span className="text-destructive">*</span>
            </label>
            <Input
              {...register("name")}
              placeholder="Contoh: Matematika Peminatan"
              className="h-8 text-xs font-semibold"
            />
            {errors.name && (
              <p className="text-[11px] text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Alokasi Jam (JP / Minggu) <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                min={1}
                max={8}
                {...register("creditHours")}
                className="h-8 text-xs font-mono"
              />
              {errors.creditHours && (
                <p className="text-[11px] text-destructive">
                  {errors.creditHours.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", Boolean(checked))}
              />
              <label
                htmlFor="isActive"
                className="text-xs font-medium leading-none cursor-pointer"
              >
                Status Mapel Aktif
              </label>
            </div>
          </div>

          {/* Guru Pengampu Assignment */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-medium text-foreground">
              Guru Pengampu Terdaftar ({selectedTeachers.length} Dipilih)
            </label>
            <div className="max-h-36 overflow-y-auto p-2 rounded-md border border-border bg-card space-y-1.5">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tch-${teacher.id}`}
                    checked={selectedTeachers.includes(teacher.fullName)}
                    onCheckedChange={() => handleToggleTeacher(teacher.fullName)}
                  />
                  <label
                    htmlFor={`tch-${teacher.id}`}
                    className="text-xs leading-none truncate cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    {teacher.fullName} ({teacher.nip})
                  </label>
                </div>
              ))}
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
              {isEditing ? "Simpan Perubahan" : "Simpan Mapel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
