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
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Memuat data rekap kelas...
            </div>
          ) : classStats.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Belum ada data rombel terdaftar.
            </div>
          ) : (
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}
