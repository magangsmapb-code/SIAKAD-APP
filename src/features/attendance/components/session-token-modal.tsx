"use client";

import * as React from "react";
import {
  QrCode,
  Barcode,
  Copy,
  Check,
  RefreshCw,
  Maximize2,
  Minimize2,
  MapPin,
  ShieldCheck,
  Users,
  Clock,
  Sparkles,
  Wifi,
  Navigation,
  School,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AttendanceSessionItem } from "@/types";
import { toast } from "sonner";
import { useSchoolData } from "@/contexts/school-data-context";

interface SessionTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: AttendanceSessionItem | null;
  onRadiusChange?: (sessionId: string, radiusMeters: number) => void;
}

// Generate deterministic pseudo-random QR matrix based on session data and token
function generateQrMatrix(text: string, size = 25): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Finder Patterns (top-left, top-right, bottom-left)
  const drawFinder = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[startY + r][startX + c] = true;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(size - 7, 0);
  drawFinder(0, size - 7);

  // Timing Patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Data hash pseudo-fill
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Don't overwrite finders or timing
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const inCenter = r >= 10 && r <= 14 && c >= 10 && c <= 14;

      if (!inTopLeft && !inTopRight && !inBottomLeft && !inCenter) {
        const val = ((hash ^ (r * 13 + c * 37)) * 2654435761) >>> 0;
        matrix[r][c] = (val % 3 === 0);
      }
    }
  }

  return matrix;
}

export function SessionTokenModal({
  open,
  onOpenChange,
  session,
  onRadiusChange,
}: SessionTokenModalProps) {
  const { students } = useSchoolData();
  const [token, setToken] = React.useState<string>("749201");
  const [copied, setCopied] = React.useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = React.useState<boolean>(false);
  const [radiusMeters, setRadiusMeters] = React.useState<number>(
    session?.radiusMeters || 100
  );
  const [countdown, setCountdown] = React.useState<number>(60);
  const [activeTab, setActiveTab] = React.useState<"QR" | "BARCODE">("QR");

  // Generate 6-digit token on open or session change
  React.useEffect(() => {
    if (session) {
      if (session.token) {
        setToken(session.token);
      } else {
        const num = Math.floor(100000 + Math.random() * 900000).toString();
        setToken(num);
      }
      setRadiusMeters(session.radiusMeters || 100);
      setCountdown(60);
    }
  }, [session, open]);

  // Countdown auto-refresh (simulated dynamic rotating token)
  React.useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Regenerate new 6-digit token
          const newToken = Math.floor(100000 + Math.random() * 900000).toString();
          setToken(newToken);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  if (!session) return null;

  const qrPayload = `SIAKAD:SESSION:${session.id}:TOKEN:${token}:RADIUS:${radiusMeters}`;
  const qrMatrix = generateQrMatrix(qrPayload);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success("Token presensi berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    const newToken = Math.floor(100000 + Math.random() * 900000).toString();
    setToken(newToken);
    setCountdown(60);
    toast.info("Token dan barcode presensi baru berhasil dibuat.");
  };

  const handleRadiusSelect = (r: number) => {
    setRadiusMeters(r);
    if (onRadiusChange) {
      onRadiusChange(session.id, r);
    }
    toast.success(`Batas toleransi radius presensi diubah menjadi ${r === 0 ? "Semua Lokasi" : `${r} meter`}.`);
  };

  // Calculate live count from students in session's class
  const classStudents = students.filter((s) => s.classId === session.classId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`transition-all duration-300 ${
          isFullscreen
            ? "max-w-[98vw] w-[98vw] h-[95vh] max-h-[95vh] p-6 overflow-y-auto"
            : "max-w-2xl w-full p-6"
        }`}
      >
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <QrCode className="h-4 w-4" />
                </span>
                Token & Barcode Presensi Kelas
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {session.className} &bull; {session.subjectName} ({session.startTime} - {session.endTime} WIB)
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="gap-1.5 h-8 text-xs font-medium"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" />
                    Keluar Layar Penuh
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" />
                    Mode Proyektor
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
          {/* Kolom Kiri: Display QR Code / Barcode & Token */}
          <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-primary/20 bg-muted/20 p-5">
            {/* Tab Pilihan: QR Code atau Barcode */}
            <div className="flex items-center gap-1 p-1 bg-muted rounded-xl w-full max-w-[260px] text-xs font-semibold">
              <button
                onClick={() => setActiveTab("QR")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "QR"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                QR Code Dinamis
              </button>
              <button
                onClick={() => setActiveTab("BARCODE")}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "BARCODE"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Barcode className="h-3.5 w-3.5" />
                Barcode Visual
              </button>
            </div>

            {/* QR Code Matrix Display */}
            {activeTab === "QR" ? (
              <div className="relative p-4 bg-white rounded-2xl shadow-md border-4 border-primary/30 flex items-center justify-center">
                <svg
                  viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                  className={isFullscreen ? "w-72 h-72 sm:w-80 sm:h-80" : "w-52 h-52 sm:w-56 sm:h-56"}
                >
                  {qrMatrix.map((row, r) =>
                    row.map((cell, c) =>
                      cell ? (
                        <rect
                          key={`${r}-${c}`}
                          x={c}
                          y={r}
                          width={1}
                          height={1}
                          fill="#0f172a"
                        />
                      ) : null
                    )
                  )}
                </svg>

                {/* Central Brand Badge */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-10 w-10 rounded-xl bg-white border-2 border-primary shadow-sm flex items-center justify-center">
                    <School className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            ) : (
              /* Barcode Display */
              <div className="w-full flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-md border-4 border-primary/30">
                <svg className="w-full h-24" viewBox="0 0 300 80">
                  {Array.from({ length: 65 }).map((_, i) => {
                    const width = (i * 7 + token.charCodeAt(i % token.length)) % 4 + 1.5;
                    const x = i * 4.5 + 5;
                    return (
                      <rect
                        key={i}
                        x={x}
                        y="5"
                        width={width}
                        height="55"
                        fill="#0f172a"
                      />
                    );
                  })}
                  <text
                    x="150"
                    y="74"
                    textAnchor="middle"
                    fontFamily="monospace"
                    fontSize="13"
                    fontWeight="bold"
                    fill="#0f172a"
                  >
                    *{token}*
                  </text>
                </svg>
              </div>
            )}

            {/* Large Token Digit Banner */}
            <div className="w-full bg-card rounded-xl border border-border p-3 text-center space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Token Presensi 6-Digit
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-widest font-mono text-primary">
                  {token.slice(0, 3)} {token.slice(3)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  title="Salin Token"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Dynamic Rotating Timer & Refresh Button */}
            <div className="flex items-center justify-between w-full text-xs text-muted-foreground px-1">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span>Berputar dalam: <strong>{countdown}s</strong></span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                className="h-7 text-[11px] gap-1 text-primary hover:text-primary/90"
              >
                <RefreshCw className="h-3 w-3" />
                Acak Ulang
              </Button>
            </div>
          </div>

          {/* Kolom Kanan: Pengaturan Radius GPS & Panduan */}
          <div className="space-y-4">
            {/* Penentuan Batas Radius Geofence */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Navigation className="h-4 w-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Tentukan Batas Radius GPS
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Validasi geofence jarak maksimal siswa dari sekolah/kelas
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  {radiusMeters === 0 ? "Bebas" : `${radiusMeters} Meter`}
                </Badge>
              </div>

              {/* Pill Selectors */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1">
                {[
                  { value: 25, label: "25 m", desc: "Dalam Kelas" },
                  { value: 50, label: "50 m", desc: "Blok Kelas" },
                  { value: 100, label: "100 m", desc: "Standar" },
                  { value: 250, label: "250 m", desc: "Lingkungan" },
                  { value: 0, label: "Bebas", desc: "Tanpa Batas" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleRadiusSelect(item.value)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      radiusMeters === item.value
                        ? "border-emerald-600 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm ring-1 ring-emerald-500"
                        : "border-border/80 bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[9px] text-muted-foreground truncate">{item.desc}</div>
                  </button>
                ))}
              </div>

              {/* Status Info Geofence */}
              <div className="rounded-xl bg-muted/40 p-2.5 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span>Titik Acuan: SMA PB Ngrayun (-8.0435, 111.4123)</span>
                </div>
                <p>
                  {radiusMeters === 0
                    ? "Presensi diizinkan dari mana saja tanpa pengecekan radius lokasi GPS."
                    : `Siswa yang berjarak lebih dari ${radiusMeters} meter dari titik acuan akan ditolak oleh sistem anti-fake GPS.`}
                </p>
              </div>
            </div>

            {/* Rekap Kehadiran Sesi Berjalan */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="text-xs font-bold text-foreground">
                    Target Kehadiran Siswa
                  </h4>
                </div>
                <span className="text-xs font-bold text-primary">
                  {session.presentCount} / {session.totalStudents || classStudents.length} Siswa
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      session.totalStudents > 0
                        ? Math.round((session.presentCount / session.totalStudents) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                <span>Hadir: <strong className="text-emerald-600">{session.presentCount}</strong></span>
                <span>Terlambat: <strong className="text-amber-600">{session.lateCount || 0}</strong></span>
                <span>Belum Absen: <strong className="text-rose-600">{Math.max(0, session.totalStudents - session.presentCount)}</strong></span>
              </div>
            </div>

            {/* Petunjuk Penggunaan untuk Guru */}
            <div className="rounded-xl border border-blue-200/40 bg-blue-50/50 dark:bg-blue-950/20 p-3 text-[11px] text-blue-900 dark:text-blue-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                <span>Petunjuk Penggunaan di Kelas</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-300">
                <li>Klik <strong>Mode Proyektor</strong> jika ingin menampilkan layar ini ke proyektor kelas.</li>
                <li>Siswa dapat memindai QR Code atau memasukkan 6 digit Token di HP masing-masing.</li>
                <li>Token otomatis diperbarui tiap 60 detik untuk mencegah kecurangan titip absen.</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
