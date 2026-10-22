"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  User,
  Settings,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { useDemoRole } from "@/contexts/demo-role-context";
import { useAuth } from "@/contexts/auth-context";
import { DemoRoleType, DEMO_USERS } from "@/lib/constants";

export function UserNav() {
  const router = useRouter();
  const { role, setRole, currentUser } = useDemoRole();
  const { user, logout } = useAuth();
  const [logoutModalOpen, setLogoutModalOpen] = React.useState(false);

  const displayName = user?.fullName || currentUser.name;
  const displayRole = user?.role || currentUser.roleLabel;
  const displayEmail = user?.email || (user ? `${user.username}@smapbngrayun.sch.id` : currentUser.email);
  const displayIdentifier = user?.teacherNip || user?.studentNis || user?.username || currentUser.identifier;
  const avatarFallback = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    setLogoutModalOpen(false);
    await logout();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-2.5 rounded-full p-1.5 min-h-[44px] min-w-[44px] justify-center transition-all hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Menu profil pengguna"
          >
            <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold leading-tight text-foreground truncate max-w-[150px]">
                {displayName}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight truncate max-w-[150px]">
                {displayRole}
              </span>
            </div>
            <ChevronDown className="hidden md:block h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-xs font-semibold leading-none text-foreground">
                {displayName}
              </p>
              <p className="text-[11px] leading-none text-muted-foreground">
                {displayEmail}
              </p>
              <div className="pt-1.5 flex items-center gap-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20 font-semibold">
                  {displayRole}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {displayIdentifier}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Demo Role Switcher Submenu (Super Admin only) */}
          {(user?.role === "SUPER_ADMIN" || user?.role === "DEVELOPER") && (
            <>
              <div className="px-2 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  <span>Simulasi Peran:</span>
                </p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  {(["ADMIN", "GURU", "KEPALA_SEKOLAH", "SISWA"] as DemoRoleType[]).map((r) => {
                    const u = DEMO_USERS[r];
                    const isSelected = role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`flex items-center gap-1.5 p-1.5 rounded-md text-left transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="text-xs">
                          {r === "ADMIN" ? "🛡️" : r === "GURU" ? "👨‍🏫" : r === "KEPALA_SEKOLAH" ? "🏫" : "🎒"}
                        </span>
                        <span className="truncate">{r === "KEPALA_SEKOLAH" ? "Kepsek" : u.roleLabel.split("/")[0].trim()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs"
              onSelect={() => router.push("/settings")}
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profil Pengguna</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs"
              onSelect={() => router.push("/settings")}
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Pengaturan Sistem</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-xs"
              onSelect={() => router.push("/attendance")}
            >
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span>Log Aktivitas Presensi</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-rose-600 focus:bg-rose-50 focus:text-rose-700 dark:focus:bg-rose-950/50 cursor-pointer gap-2 text-xs"
            onSelect={() => setLogoutModalOpen(true)}
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar Sistem</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationModal
        open={logoutModalOpen}
        onOpenChange={setLogoutModalOpen}
        title="Konfirmasi Keluar"
        description="Apakah Anda yakin ingin keluar dari sistem SIAKAD SMA Pemberdayaan Bangsa Ngrayun?"
        confirmLabel="Ya, Keluar"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={handleLogout}
      />
    </>
  );
}
