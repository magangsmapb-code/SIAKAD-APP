"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";
import { useSchoolData } from "@/contexts/school-data-context";

interface ClassStatRow {
  classId: string;
  className: string;
  totalStudents: number;
  hadir: number;
  terlambat: number;
  izin: number;
  sakit: number;
  alpa: number;
  persentase: number;
}

export function ClassSummaryTable() {
  const { classes } = useSchoolData();
  const [classStats, setClassStats] = React.useState<ClassStatRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchClassStats = async () => {
      try {
        const res = await apiClient.get<Array<{
          classId: string;
          className: string;
          totalStudents: number;
          attendancePercentage: number;
          hadir: number;
          terlambat: number;
          izin: number;
          sakit: number;
          alpa: number;
        }>>("/dashboard/class-statistics");

        if (res.data && Array.isArray(res.data)) {
          const mapped = res.data.map((c) => ({
            classId: c.classId,
            className: c.className,
            totalStudents: c.totalStudents,
            hadir: c.hadir,
            terlambat: c.terlambat,
            izin: c.izin,
            sakit: c.sakit,
            alpa: c.alpa,
            persentase: c.attendancePercentage,
          }));
          setClassStats(mapped);
        }
      } catch (err) {
        console.error("Gagal memuat statistik kelas:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClassStats();
  }, [classes]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-bold">
            Rekap Kehadiran Rombel Hari Ini
          </CardTitle>
          <CardDescription className="text-xs">
            Persentase kehadiran per kelas tahun ajaran aktif
          </CardDescription>
        </div>
        <Link
          href="/classes"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Lihat Semua Kelas
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Memuat data rekap kelas...
          </div>
        ) : classStats.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Belum ada data rombel terdaftar.
          </div>
        ) : (
          <>
            {/* Mobile View: Class Cards (sm:hidden) */}
            <div className="sm:hidden divide-y divide-border/60">
              {classStats.map((row) => (
                <div key={row.classId} className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-foreground">
                      Kelas {row.className}
                    </span>
                    <Badge
                      variant={row.persentase >= 95 ? "hadir" : "terlambat"}
                      className="text-[10px] px-2 py-0.5 font-mono"
                    >
                      {row.persentase}% Hadir
                    </Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block">
                        Hadir
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                        {row.hadir}
                      </span>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/40 p-1.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 block">
                        Telat
                      </span>
                      <span className="font-bold text-amber-700 dark:text-amber-400 font-mono">
                        {row.terlambat}
                      </span>
                    </div>
                    <div className="bg-sky-50 dark:bg-sky-950/40 p-1.5 rounded-lg border border-sky-200 dark:border-sky-800">
                      <span className="text-[10px] text-sky-800 dark:text-sky-300 block">
                        Izin/Skt
                      </span>
                      <span className="font-bold text-sky-700 dark:text-sky-400 font-mono">
                        {row.izin + row.sakit}
                      </span>
                    </div>
                    <div className="bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-lg border border-rose-200 dark:border-rose-800">
                      <span className="text-[10px] text-rose-800 dark:text-rose-300 block">
                        Alpa
                      </span>
                      <span className="font-bold text-rose-700 dark:text-rose-400 font-mono">
                        {row.alpa}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Table (hidden sm:block) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[500px] data-tabular">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2.5 font-semibold">Kelas</th>
                    <th className="py-2.5 text-center font-semibold">Total</th>
                    <th className="py-2.5 text-center font-semibold text-emerald-600">Hadir</th>
                    <th className="py-2.5 text-center font-semibold text-amber-600">Telat</th>
                    <th className="py-2.5 text-center font-semibold text-sky-600">Izin/Skt</th>
                    <th className="py-2.5 text-center font-semibold text-rose-600">Alpa</th>
                    <th className="py-2.5 text-right font-semibold">Capaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {classStats.map((row) => (
                    <tr key={row.classId} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 font-semibold text-foreground">
                        {row.className}
                      </td>
                      <td className="py-3 text-center font-mono">{row.totalStudents}</td>
                      <td className="py-3 text-center font-mono font-medium text-emerald-600">
                        {row.hadir}
                      </td>
                      <td className="py-3 text-center font-mono font-medium text-amber-600">
                        {row.terlambat}
                      </td>
                      <td className="py-3 text-center font-mono text-sky-600">
                        {row.izin + row.sakit}
                      </td>
                      <td className="py-3 text-center font-mono text-rose-600 font-medium">
                        {row.alpa}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="hidden sm:block w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${Math.min(100, Math.max(0, row.persentase))}%` }}
                            />
                          </div>
                          <Badge
                            variant={row.persentase >= 95 ? "hadir" : "terlambat"}
                            className="text-[10px] px-1.5 py-0 font-mono"
                          >
                            {row.persentase}%
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
