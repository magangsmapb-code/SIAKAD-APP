"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg text-xs">
        <p className="font-semibold text-foreground mb-1.5">{label}</p>
        <div className="space-y-1">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                {item.name}:
              </span>
              <span className="font-semibold text-foreground font-mono">
                {item.value} siswa
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

interface TrendItem {
  day: string;
  date: string;
  hadir: number;
  terlambat: number;
  izin: number;
  alpa: number;
  persentase: number;
}

export function AttendanceChart() {
  const [mounted, setMounted] = React.useState(false);
  const [chartData, setChartData] = React.useState<TrendItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
    const fetchTrends = async () => {
      try {
        const res = await apiClient.get<Array<{
          date: string;
          hadir: number;
          sakit: number;
          izin: number;
          alpa: number;
          terlambat: number;
          total: number;
          percentage: number;
        }>>("/dashboard/attendance-trends?days=5");

        if (res.data && Array.isArray(res.data)) {
          const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
          const formatted = res.data.map((item) => {
            const d = new Date(item.date);
            const dayName = daysMap[d.getDay()];
            const dateLabel = d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
            return {
              day: dayName,
              date: dateLabel,
              hadir: item.hadir,
              terlambat: item.terlambat,
              izin: item.izin + item.sakit,
              alpa: item.alpa,
              persentase: item.percentage,
            };
          });
          setChartData(formatted);
        }
      } catch (err) {
        console.error("Gagal memuat tren kehadiran:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  const averageAttendance = React.useMemo(() => {
    if (chartData.length === 0) return "100.0";
    const sum = chartData.reduce((acc, curr) => acc + curr.persentase, 0);
    return (sum / chartData.length).toFixed(1);
  }, [chartData]);

  if (!mounted || loading) {
    return (
      <Card className="h-80 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Memuat grafik tren presensi...</p>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold">
              Tren Kehadiran Siswa Mingguan
            </CardTitle>
            <CardDescription className="text-xs">
              Distribusi presensi siswa per hari (Senin - Jumat)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Rata-rata: {averageAttendance}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                domain={[0, "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: "10px", fontSize: "11px" }}
              />
              <Bar
                name="Hadir"
                dataKey="hadir"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                name="Terlambat"
                dataKey="terlambat"
                fill="#d97706"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                name="Izin/Sakit"
                dataKey="izin"
                fill="#0284c7"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                name="Alpa"
                dataKey="alpa"
                fill="#dc2626"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
