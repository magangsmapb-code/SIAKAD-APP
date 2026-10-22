"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Wifi,
} from "lucide-react";
import { MAIN_NAVIGATION, INSTITUTION } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDemoRole } from "@/contexts/demo-role-context";

import Image from "next/image";

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const { role, academicYear } = useDemoRole();

  // Filter navigation sections based on active user role
  const filteredNavigation = React.useMemo(() => {
    return MAIN_NAVIGATION.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.roles || item.roles.includes(role)
      ),
    })).filter((section) => section.items.length > 0);
  }, [role]);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out select-none",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-border p-1 shadow-sm">
            <Image
              src="/logo.png"
              alt="Logo SMA PB Ngrayun"
              width={36}
              height={36}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-bold tracking-tight text-foreground">
                SIAKAD
              </span>
              <span className="truncate text-[10px] font-semibold text-primary uppercase tracking-wider">
                SMA PB Ngrayun
              </span>
            </div>
          )}
        </Link>
        {!collapsed && (
          <span className="text-[10px] font-semibold badge-hadir px-2 py-0.5 rounded-md border border-[#BBF7D0]">
            v1.11
          </span>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {filteredNavigation.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!collapsed && (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.group}
              </p>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.title : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors duration-150 relative group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                        isActive ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    />
                    {!collapsed && (
                      <span className="flex-1 truncate">{item.title}</span>
                    )}
                    {!collapsed && item.badge && (
                      <Badge
                        variant={isActive ? "secondary" : "default"}
                        className={cn(
                          "ml-auto text-[10px] px-1.5 py-0 h-4 font-semibold",
                          item.badge === "Live" &&
                            "bg-emerald-500 text-white border-none animate-pulse"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="border-t border-border p-3">
        {!collapsed ? (
          <div className="rounded-lg bg-muted/60 p-3 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <span className="h-2 w-2 rounded-full bg-[#166534] inline-block" />
                <span>API REST v1</span>
              </span>
              <Badge variant="hadir" className="text-[10px] px-1.5 py-0 font-semibold">
                Online
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight data-tabular">
              Zona Waktu: Asia/Jakarta (WIB)
            </p>
            <p className="text-[10px] text-primary/80 font-medium pt-0.5">
              T.A. {academicYear}
            </p>
          </div>
        ) : (
          <div className="flex justify-center" title="API Backend Terhubung">
            <span
              className="h-2.5 w-2.5 rounded-full bg-[#166534]"
              title="API Backend Terhubung"
            />
          </div>
        )}

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="mt-2 flex w-full items-center justify-center rounded-md p-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label={collapsed ? "Perluas Sidebar" : "Perkecil Sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />
                <span className="text-[11px]">Sembunyikan</span>
              </div>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
