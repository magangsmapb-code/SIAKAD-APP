"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  GraduationCap,
  School,
  FileCheck2,
  CalendarDays,
  X,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSchoolData } from "@/contexts/school-data-context";

export interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const { students, teachers, classes } = useSchoolData();
  const [query, setQuery] = React.useState("");

  // Keyboard shortcut Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  const filteredStudents = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return students
      .filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.nis.includes(q) ||
          s.className.toLowerCase().includes(q)
      )
      .slice(0, 4);
  }, [students, query]);

  const filteredTeachers = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return teachers
      .filter(
        (t) =>
          t.fullName.toLowerCase().includes(q) ||
          t.nip.includes(q) ||
          t.subjects.some((sub) => sub.toLowerCase().includes(q))
      )
      .slice(0, 3);
  }, [teachers, query]);

  const filteredClasses = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return classes
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.homeroomTeacherName && c.homeroomTeacherName.toLowerCase().includes(q))
      )
      .slice(0, 3);
  }, [classes, query]);

  const handleSelect = (href: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden gap-0 border-border">
        <DialogHeader className="p-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5 px-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama siswa, NIS, guru, mata pelajaran, atau kelas..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none py-1.5 focus:ring-0"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 text-xs">
          {!query.trim() ? (
            <div className="py-8 text-center text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Pencarian Cepat SIAKAD</p>
              <p className="text-[11px] max-w-sm mx-auto">
                Ketikkan kata kunci untuk mencari data siswa, pengajar, kelas, atau navigasi cepat ke fitur presensi.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <Badge variant="outline" className="text-[10px] cursor-pointer" onClick={() => setQuery("MIPA")}>
                  X MIPA
                </Badge>
                <Badge variant="outline" className="text-[10px] cursor-pointer" onClick={() => setQuery("Bagus")}>
                  Bagus Wicaksono
                </Badge>
                <Badge variant="outline" className="text-[10px] cursor-pointer" onClick={() => setQuery("Matematika")}>
                  Matematika
                </Badge>
              </div>
            </div>
          ) : (
            <>
              {/* Siswa Results */}
              {filteredStudents.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                    Siswa ({filteredStudents.length})
                  </p>
                  {filteredStudents.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelect("/students")}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px]">
                          {s.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary">
                            {s.fullName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            NIS: {s.nis} &bull; Kelas {s.className}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}

              {/* Guru Results */}
              {filteredTeachers.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                    Guru & Pengajar ({filteredTeachers.length})
                  </p>
                  {filteredTeachers.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleSelect("/teachers")}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[11px]">
                          {t.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary">
                            {t.fullName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            NIP: {t.nip} &bull; {t.subjects.join(", ")}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}

              {/* Kelas Results */}
              {filteredClasses.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
                    Rombel & Kelas ({filteredClasses.length})
                  </p>
                  {filteredClasses.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelect("/classes")}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[11px]">
                          {c.level}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary">
                            Kelas {c.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Wali: {c.homeroomTeacherName} &bull; {c.studentCount} Siswa
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              )}

              {filteredStudents.length === 0 &&
                filteredTeachers.length === 0 &&
                filteredClasses.length === 0 && (
                  <div className="py-6 text-center text-muted-foreground">
                    <p className="font-medium text-foreground">Tidak ditemukan hasil</p>
                    <p className="text-[11px] mt-1">
                      Tidak ada data yang cocok dengan kata kunci &quot;{query}&quot;.
                    </p>
                  </div>
                )}
            </>
          )}
        </div>

        <div className="p-2.5 border-t border-border bg-muted/30 flex items-center justify-between text-[11px] text-muted-foreground px-4">
          <span>Gunakan tanda panah atau klik untuk memilih hasil</span>
          <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">
            ESC untuk keluar
          </kbd>
        </div>
      </DialogContent>
    </Dialog>
  );
}
