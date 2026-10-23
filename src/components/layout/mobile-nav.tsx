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
        aria-label="Buka Menu Navigasi"
        className="h-9 w-9 text-muted-foreground"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-card border-r border-border shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-border p-1 shadow-sm">
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
                  <p className="text-[10px] font-semibold text-primary mt-0.5">
                    SMA PB Ngrayun
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full"
                aria-label="Tutup Menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {filteredNavigation.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant={isActive ? "secondary" : "default"}
                              className="text-[10px] px-1.5 py-0"
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
            <div className="border-t border-border p-4 bg-muted/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">
                  {INSTITUTION.shortName}
                </p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
                  {academicYear}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Kec. Ngrayun, Kab. Ponorogo
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
