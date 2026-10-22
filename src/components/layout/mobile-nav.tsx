"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  GraduationCap,
  Menu,
} from "lucide-react";
import Image from "next/image";
import { MAIN_NAVIGATION, INSTITUTION } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDemoRole } from "@/contexts/demo-role-context";

export function MobileNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const { role, academicYear } = useDemoRole();

  // Close drawer when pathname changes
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll and listen for Escape key when open
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

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
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Buka Menu Navigasi SIAKAD"
        aria-expanded={open}
        className="h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground hover:bg-muted/80 rounded-lg"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Navigasi Mobile"
        >
          {/* Backdrop with smooth blur */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Menu */}
          <div className="relative flex w-[85%] max-w-xs flex-1 flex-col bg-card border-r border-border shadow-2xl animate-in slide-in-from-left duration-250 z-10">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-border px-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-border p-1 shadow-sm shrink-0">
                  <Image
                    src="/logo.png"
                    alt="Logo SMA PB Ngrayun"
                    width={32}
                    height={32}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-none text-foreground">
                    SIAKAD
                  </h3>
                  <p className="text-[10px] font-semibold text-primary mt-0.5 uppercase tracking-wide">
                    SMA PB Ngrayun
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80"
                aria-label="Tutup Menu Navigasi"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Nav Links - Thumb Friendly (min 44px touch targets) */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {filteredNavigation.map((section, idx) => (
                <div key={idx} className="space-y-1.5">
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                    {section.group}
                  </p>
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
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3.5 py-3 min-h-[44px] text-xs font-medium transition-colors touch-target",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground active:bg-muted"
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant={isActive ? "secondary" : "default"}
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-4 font-semibold",
                                item.badge === "Live" && "bg-emerald-500 text-white animate-pulse"
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

            {/* Footer */}
            <div className="border-t border-border p-4 bg-muted/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 inline-block" />
                  <span>{INSTITUTION.shortName}</span>
                </span>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 font-medium border-border">
                  {academicYear}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {INSTITUTION.location}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
