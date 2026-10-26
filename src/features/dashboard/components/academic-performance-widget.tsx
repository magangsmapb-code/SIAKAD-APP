"use client";

import * as React from "react";
import {
  GraduationCap,
  Award,
  BookOpen,
  TrendingUp,
  FileText,
  Printer,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";
import { INSTITUTION } from "@/lib/constants";

export interface SubjectGrade {
  id: string;
  code: string;
  subjectName: string;
  category: "WAJIB" | "PEMINATAN" | "MUATAN_LOKAL";
  teacherName: string;
  kktp: number; // Kriteria Ketercapaian Tujuan Pembelajaran (default 75)
  formatif: number;
  sumatifMateri: number;
  pts: number;
  pas: number;
  finalScore: number;
  predicate: "A" | "B" | "C" | "D";
  competencySummary: string;
}

const DEFAULT_GRADES: SubjectGrade[] = [
  {
    id: "grd-1",
    code: "MAT-X",
    subjectName: "Matematika Tingkat Lanjut",
    category: "PEMINATAN",
    teacherName: "Budi Santoso, S.Pd.",
    kktp: 75,
    formatif: 90,
    sumatifMateri: 88,
    pts: 86,
    pas: 92,
    finalScore: 89,
    predicate: "A",
    competencySummary: "Menunjukkan penguasaan istimewa dalam analisis matriks dan fungsi eksponensial.",
  },
  {
    id: "grd-2",
    code: "FIS-X",
    subjectName: "Fisika Terapan",
    category: "PEMINATAN",
    teacherName: "Dra. Siti Aminah, M.Pd.",
    kktp: 75,
    formatif: 95,
    sumatifMateri: 92,
    pts: 94,
    pas: 96,
    finalScore: 94,
    predicate: "A",
    competencySummary: "Sangat terampil dalam praktikum dinamika partikel dan penerapan hukum Newton.",
  },
  {
    id: "grd-3",
    code: "BIO-X",
    subjectName: "Biologi Sel & Genetik",
    category: "PEMINATAN",
    teacherName: "Ahmad Fauzi, S.Si.",
    kktp: 75,
    formatif: 85,
    sumatifMateri: 84,
    pts: 82,
    pas: 88,
    finalScore: 85,
    predicate: "B",
    competencySummary: "Mencapai ketuntasan baik dalam pemahaman respirasi sel dan fotosintesis.",
  },
  {
    id: "grd-4",
    code: "IND-X",
    subjectName: "Bahasa Indonesia",
    category: "WAJIB",
    teacherName: "Dewi Lestari, S.Pd.",
    kktp: 75,
    formatif: 92,
    sumatifMateri: 89,
    pts: 90,
    pas: 91,
    finalScore: 91,
    predicate: "A",
    competencySummary: "Sangat menguasai penulisan teks argumentasi ilmiah dan retorika debat publik.",
  },
  {
    id: "grd-5",
    code: "ENG-X",
    subjectName: "Bahasa Inggris Komunikasi",
    category: "WAJIB",
    teacherName: "Robert William, M.A.",
    kktp: 75,
    formatif: 88,
    sumatifMateri: 86,
    pts: 85,
    pas: 89,
    finalScore: 87,
    predicate: "B",
    competencySummary: "Mampu menyampaikan gagasan secara lancar dalam descriptive and narrative presentations.",
  },
  {
    id: "grd-6",
    code: "INF-X",
    subjectName: "Informatika & Pemrograman",
    category: "PEMINATAN",
    teacherName: "Eko Prasetyo, S.Kom.",
    kktp: 75,
    formatif: 98,
    sumatifMateri: 96,
    pts: 95,
    pas: 96,
    finalScore: 96,
    predicate: "A",
    competencySummary: "Istimewa dalam logika algoritma, struktur data array, serta kolaborasi git.",
  },
  {
    id: "grd-7",
    code: "PAI-X",
    subjectName: "Pendidikan Agama & Budi Pekerti",
    category: "WAJIB",
    teacherName: "Drs. H. Mulyadi",
    kktp: 75,
    formatif: 91,
    sumatifMateri: 90,
    pts: 89,
    pas: 92,
    finalScore: 91,
    predicate: "A",
    competencySummary: "Meneladani integritas etika luhur dan pemahaman fiqih muamalah kontemporer.",
  },
  {
    id: "grd-8",
    code: "PMR-X",
    subjectName: "Muatan Lokal Reog Ponorogo",
    category: "MUATAN_LOKAL",
    teacherName: "Suryono, S.Sn.",
    kktp: 75,
    formatif: 93,
    sumatifMateri: 90,
    pts: 88,
    pas: 91,
    finalScore: 91,
    predicate: "A",
    competencySummary: "Memahami filosofi seni budaya Reog Ponorogo dan pelestarian kearifan lokal Ngrayun.",
  },
];

export function AcademicPerformanceWidget({
  studentName = "Aditya Pratama",
  nis = "20241001",
  className = "X MIPA 1",
}: {
  studentName?: string;
  nis?: string;
  className?: string;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");

  const filteredGrades = React.useMemo(() => {
    return DEFAULT_GRADES.filter((g) => {
      if (selectedCategory !== "ALL" && g.category !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          g.subjectName.toLowerCase().includes(q) ||
          g.code.toLowerCase().includes(q) ||
          g.teacherName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [searchQuery, selectedCategory]);

  const stats = React.useMemo(() => {
    const totalScore = DEFAULT_GRADES.reduce((acc, curr) => acc + curr.finalScore, 0);
    const average = Number((totalScore / DEFAULT_GRADES.length).toFixed(1));
    const highest = Math.max(...DEFAULT_GRADES.map((g) => g.finalScore));
    const highestSubject = DEFAULT_GRADES.find((g) => g.finalScore === highest)?.subjectName || "-";
    const passedKKTP = DEFAULT_GRADES.filter((g) => g.finalScore >= g.kktp).length;
    const completeness = Math.round((passedKKTP / DEFAULT_GRADES.length) * 100);

    return {
      average,
      highest,
      highestSubject,
      completeness,
      totalSubjects: DEFAULT_GRADES.length,
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Executive Grade Overview Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 p-4 sm:p-6 text-white shadow-sm border border-indigo-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-0.5 text-xs font-semibold backdrop-blur-md border border-blue-400/30 text-blue-200">
              <GraduationCap className="h-3.5 w-3.5 text-blue-300" />
              <span>Transkrip Rapor Kurikulum Merdeka &bull; Semester Ganjil 2026/2027</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Buku Nilai & Capaian Belajar Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {studentName} (NIS: {nis}) &bull; Kelas {className} &bull; {INSTITUTION.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handlePrint}
              className="bg-white/10 hover:bg-white/20 text-white text-xs border border-white/20 backdrop-blur-md gap-1.5 print:hidden"
            >
              <Printer className="h-3.5 w-3.5 text-blue-300" />
              Cetak Transkrip Rapor
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:grid-cols-4">
        <StatCard
          title="Rata-rata Nilai Rapor"
          value={`${stats.average}`}
          subtitle="Predikat A (Sangat Baik)"
          icon={Award}
          variant="primary"
        />
        <StatCard
          title="Ketuntasan KKTP"
          value={`${stats.completeness}%`}
          subtitle="8 dari 8 Mapel Tuntas"
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Peringkat Rombel"
          value="Peringkat 2"
          subtitle="Dari 32 Siswa Kelas X MIPA 1"
          icon={TrendingUp}
          variant="neutral"
        />
        <StatCard
          title="Capaian Tertinggi"
          value={`${stats.highest}`}
          subtitle={stats.highestSubject}
          icon={Sparkles}
          variant="warning"
        />
      </div>

      {/* Grade Details Table Card */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Daftar Capaian Kompetensi & Penilaian Semester
              </CardTitle>
              <CardDescription className="text-xs">
                Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) standar sekolah: 75.00
              </CardDescription>
            </div>

            {/* Filter controls (Hidden when printing) */}
            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <div className="relative w-44">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari mapel / guru..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>

              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`px-2 py-1 text-[11px] font-semibold rounded ${
                    selectedCategory === "ALL" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("WAJIB")}
                  className={`px-2 py-1 text-[11px] font-semibold rounded ${
                    selectedCategory === "WAJIB" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Wajib
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("PEMINATAN")}
                  className={`px-2 py-1 text-[11px] font-semibold rounded ${
                    selectedCategory === "PEMINATAN" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Peminatan
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("MUATAN_LOKAL")}
                  className={`px-2 py-1 text-[11px] font-semibold rounded ${
                    selectedCategory === "MUATAN_LOKAL" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Mulok
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4 p-0 sm:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                  <th className="py-3 px-3 w-10 text-center">No</th>
                  <th className="py-3 px-3">Mata Pelajaran & Guru</th>
                  <th className="py-3 px-2 text-center w-14">KKTP</th>
                  <th className="py-3 px-2 text-center w-14">Formatif</th>
                  <th className="py-3 px-2 text-center w-14">Sumatif</th>
                  <th className="py-3 px-2 text-center w-14">PTS</th>
                  <th className="py-3 px-2 text-center w-14">PAS</th>
                  <th className="py-3 px-2 text-center w-16">Nilai Akhir</th>
                  <th className="py-3 px-2 text-center w-14">Predikat</th>
                  <th className="py-3 px-3">Deskripsi Capaian Kompetensi (Kurikulum Merdeka)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredGrades.map((grade, idx) => {
                  const isPassed = grade.finalScore >= grade.kktp;
                  return (
                    <tr
                      key={grade.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-3 text-center font-mono text-muted-foreground">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <span>{grade.subjectName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({grade.code})
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {grade.teacherName}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-muted-foreground">
                        {grade.kktp}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-medium">
                        {grade.formatif}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-medium">
                        {grade.sumatifMateri}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-medium">
                        {grade.pts}
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-medium">
                        {grade.pas}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {grade.finalScore}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-flex items-center justify-center font-black rounded-md px-2 py-0.5 text-xs ${
                            grade.predicate === "A"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                              : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          }`}
                        >
                          {grade.predicate}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-muted-foreground leading-relaxed">
                        {grade.competencySummary}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Official Signature Section (Visible on Print) */}
          <div className="hidden print:grid grid-cols-2 gap-8 pt-10 text-xs">
            <div className="text-center space-y-16">
              <p>Mengetahui,<br />Orang Tua / Wali Siswa</p>
              <p className="font-bold border-b border-black inline-block min-w-[160px]">
                ...............................................
              </p>
            </div>
            <div className="text-center space-y-16">
              <p>Ponorogo, 15 Oktober 2026<br />Wali Kelas X MIPA 1</p>
              <p className="font-bold border-b border-black inline-block min-w-[160px]">
                Budi Santoso, S.Pd.<br />
                <span className="font-normal">NIP. 19780512 200312 1 004</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
