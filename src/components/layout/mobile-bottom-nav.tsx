"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  FileCheck2,
  Menu,
  GraduationCap,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoRole } from "@/contexts/demo-role-context";

export interface MobileBottomNavProps {
  onOpenDrawer: () => void;
}

export function MobileBottomNav({ onOpenDrawer }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { role } = useDemoRole();

  const isStudent = role === "SISWA";

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      title: isStudent ? "Jadwal" : "Absensi",
      href: isStudent ? "/schedules" : "/attendance",
      icon: isStudent ? GraduationCap : QrCode,
      isActive: isStudent
        ? pathname.startsWith("/schedules")
        : pathname.startsWith("/attendance"),
    },
    {
      title: "Izin",
      href: "/permissions",
      icon: FileCheck2,
      isActive: pathname.startsWith("/permissions"),
    },
    ...(!isStudent
      ? [
          {
            title: "Siswa",
            href: "/students",
            icon: Users,
            isActive: pathname.startsWith("/students"),
          },
        ]
      : []),
  ];

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border shadow-lg pb-[env(safe-area-inset-bottom)]"
    >
      <div className="grid grid-flow-col auto-cols-fr items-center h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center h-full py-1 text-[11px] font-medium transition-colors relative group",
                active
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-full" />
              )}
              <div
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-xl transition-all",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="truncate max-w-[64px] text-[10px] mt-0.5">
                {item.title}
              </span>
            </Link>
          );
        })}

        {/* Menu Drawer Trigger Button */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center h-full py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors relative"
          aria-label="Buka Menu Lengkap"
        >
          <div className="flex items-center justify-center h-7 w-7 rounded-xl bg-muted/60 text-muted-foreground">
            <Menu className="h-4 w-4" />
          </div>
          <span className="truncate max-w-[64px] text-[10px] mt-0.5">
            Lainnya
          </span>
        </button>
      </div>
    </nav>
  );
}
