"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Clock,
  Search,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { UserNav } from "@/components/layout/user-nav";
import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { SearchDialog } from "@/components/layout/search-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMounted } from "@/hooks/use-mounted";
import { useDemoRole } from "@/contexts/demo-role-context";
import { useAuth } from "@/contexts/auth-context";
import { ACADEMIC_YEARS, DemoRoleType, DEMO_USERS } from "@/lib/constants";
import { toast } from "sonner";

export interface TopbarProps {
  onToggleSidebar?: () => void;
  onOpenDrawer?: () => void;
  className?: string;
}

export function Topbar({ onOpenDrawer, className = "" }: TopbarProps) {
  const pathname = usePathname();
  const mounted = useMounted();
  const { role, setRole, academicYear, setAcademicYear } = useDemoRole();
  const { user } = useAuth();
  const [currentDateTime, setCurrentDateTime] = React.useState<string>("");
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    if (!mounted) return;

    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);
      setCurrentDateTime(`${formatted} WIB`);
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  // Compute breadcrumbs from pathname
  const breadcrumbs = React.useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0 || parts[0] === "dashboard") {
      return [{ label: "Dashboard", href: "/dashboard", active: true }];
    }

    const titleMap: Record<string, string> = {
      attendance: "Absensi",
      students: "Data Siswa",
      teachers: "Data Guru",
      classes: "Kelas",
      subjects: "Mata Pelajaran",
      schedules: "Jadwal",
      permissions: "Pengajuan Izin",
      reports: "Laporan",
      users: "Pengguna",
      settings: "Pengaturan",
      login: "Masuk Sistem",
    };

    return parts.map((part, index) => {
      const href = "/" + parts.slice(0, index + 1).join("/");
      return {
        label: titleMap[part] || part.charAt(0).toUpperCase() + part.slice(1),
        href: href,
        active: index === parts.length - 1,
      };
    });
  }, [pathname]);

  const handleAcademicYearChange = (val: string) => {
    setAcademicYear(val);
    toast.info(`Tahun Ajaran aktif diubah ke ${val}`);
  };

  const handleRoleChange = (newRole: DemoRoleType) => {
    setRole(newRole);
    const user = DEMO_USERS[newRole];
    toast.success(`Beralih ke akun demo: ${user.name} (${user.roleLabel})`);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 px-3 sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-card/80 gap-2 sm:gap-4 ${className}`}
      >
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenDrawer ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenDrawer}
              aria-label="Buka Menu Navigasi"
              className="md:hidden h-10 w-10 text-muted-foreground hover:text-foreground"
            >
              <span className="sr-only">Menu</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          ) : (
            <MobileNav />
          )}
          <div className="hidden lg:block">
            <BreadcrumbNav items={breadcrumbs} />
          </div>
          <div className="lg:hidden flex items-center">
            <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[130px] sm:max-w-[220px]">
              {breadcrumbs[breadcrumbs.length - 1]?.label || "Dashboard"}
            </span>
          </div>
        </div>

        {/* Search Bar & Center Actions */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Quick Search Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 text-xs text-muted-foreground h-9 px-3 w-48 lg:w-60 justify-between bg-muted/40 hover:bg-muted/70 border-border"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="truncate">Cari siswa, guru, kelas...</span>
            </div>
            <kbd className="font-mono text-[10px] bg-background border px-1 py-0.5 rounded text-muted-foreground">
              Ctrl K
            </kbd>
          </Button>

          {/* Mobile search trigger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(true)}
            className="md:hidden h-9 w-9 text-muted-foreground"
            aria-label="Cari Data"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Academic Year Selector */}
          <div className="hidden sm:block">
            <Select value={academicYear} onValueChange={handleAcademicYearChange}>
              <SelectTrigger className="h-9 text-xs w-[170px] bg-muted/30 border-border font-medium">
                <div className="flex items-center gap-1.5 truncate">
                  <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                  <SelectValue placeholder="Tahun Ajaran" />
                </div>
              </SelectTrigger>
              <SelectContent align="end">
                {ACADEMIC_YEARS.map((y) => (
                  <SelectItem key={y.id} value={y.label} className="text-xs">
                    {y.label} {y.isCurrent && "★ Aktif"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Live Academic Clock - Hydration Safe */}
          <div className="hidden xl:flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span
              className="font-mono text-[11px] font-medium text-foreground"
              suppressHydrationWarning
            >
              {mounted && currentDateTime ? currentDateTime : "07:00:00 WIB"}
            </span>
          </div>

          {/* Role Display / Switcher */}
          {user?.role === "SUPER_ADMIN" || user?.role === "DEVELOPER" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-xs bg-primary/5 hover:bg-primary/10 border-primary/30 text-primary font-semibold px-2.5 sm:px-3"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin-slow shrink-0" />
                  <span className="truncate max-w-[85px] sm:max-w-none">
                    {role === "ADMIN"
                      ? "🛡️ Admin"
                      : role === "GURU"
                      ? "👨‍🏫 Guru"
                      : role === "KEPALA_SEKOLAH"
                      ? "🏫 Kepsek"
                      : "🎒 Siswa"}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 text-xs">
                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  Simulasi Peran Pengguna
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["ADMIN", "GURU", "KEPALA_SEKOLAH", "SISWA"] as DemoRoleType[]).map((r) => {
                  const u = DEMO_USERS[r];
                  const isSelected = role === r;
                  return (
                    <DropdownMenuItem
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      className={`flex items-start gap-2 p-2 cursor-pointer rounded-md ${
                        isSelected
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="text-base">
                        {r === "ADMIN" ? "🛡️" : r === "GURU" ? "👨‍🏫" : r === "KEPALA_SEKOLAH" ? "🏫" : "🎒"}
                      </span>
                      <div className="flex-1 overflow-hidden">
                        <p className="leading-tight font-semibold truncate">{u.name}</p>
                        <p className={`text-[10px] leading-tight truncate ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {u.roleLabel}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 sm:px-3 py-1 text-xs text-primary font-semibold select-none">
              <span>
                {role === "ADMIN"
                  ? "🛡️ Admin"
                  : role === "GURU"
                  ? "👨‍🏫 Guru"
                  : role === "KEPALA_SEKOLAH"
                  ? "🏫 Kepsek"
                  : "🎒 Siswa"}
              </span>
            </div>
          )}

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative h-9 w-9 rounded-full shrink-0"
                aria-label="Pemberitahuan Sistem"
              >
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white ring-2 ring-background">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-2">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-bold text-foreground">
                  Pemberitahuan Presensi
                </span>
                <Badge variant="secondary" className="text-[10px] px-1.5 font-semibold bg-primary/10 text-primary border-primary/20">
                  3 Baru
                </Badge>
              </div>
              <DropdownMenuSeparator />
              <div className="space-y-1">
                <DropdownMenuItem
                  onClick={() => toast.info("Membuka detail pengajuan izin Bagus Wicaksono...")}
                  className="flex flex-col items-start gap-1 p-2 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Pengajuan Izin Siswa Baru</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Bagus Wicaksono (X MIPA 1) mengajukan izin untuk 17 Okt 2026.
                  </p>
                  <span className="text-[10px] text-muted-foreground/80">
                    10 menit lalu
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => toast.success("Log mesin presensi gerbang utama normal.")}
                  className="flex flex-col items-start gap-1 p-2 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Sinkronisasi RFID Selesai</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Mesin Gate Utama berhasil mengirim 174 log presensi pagi ini.
                  </p>
                  <span className="text-[10px] text-muted-foreground/80">
                    25 menit lalu
                  </span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Navigation */}
          <UserNav />
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
