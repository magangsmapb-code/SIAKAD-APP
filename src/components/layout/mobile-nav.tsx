"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Menu,
  Sparkles,
  ShieldAlert,
  User,
  LogOut,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import { MAIN_NAVIGATION, INSTITUTION, DEMO_USERS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDemoRole } from "@/contexts/demo-role-context";
import { useAuth } from "@/contexts/auth-context";

export interface MobileNavProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerClassName?: string;
}

export function MobileNav({
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  triggerClassName,
}: MobileNavProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled && setControlledOpen) {
      setControlledOpen(val);
    } else {
      setInternalOpen(val);
    }
  };

  const pathname = usePathname();
  const { role, currentUser, academicYear } = useDemoRole();
  const { user } = useAuth();

  // Close drawer when route changes
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
      {!isControlled && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label="Buka Menu Navigasi"
          className={cn("h-10 w-10 text-muted-foreground hover:text-foreground", triggerClassName)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop with fade-in */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-card border-r border-border shadow-2xl animate-in slide-in-from-left duration-250 z-10">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-border px-4 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-border p-1 shadow-sm">
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

              {/* Accessible Close Button */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-10 w-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Tutup Menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Active User Card in Drawer */}
            <div className="p-3 border-b border-border/70 bg-primary/5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                  {currentUser.avatarFallback}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {currentUser.roleLabel} • {currentUser.identifier}
                  </p>
                </div>
              </div>
            </div>

            {/* Nav Links */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {filteredNavigation.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors min-h-[42px]",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant={isActive ? "secondary" : "default"}
                              className="text-[10px] px-1.5 py-0 font-semibold"
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

              {/* Developer Center quick link for super_admin / developer */}
              {(user?.role === "SUPER_ADMIN" || user?.role === "DEVELOPER") && (
                <div className="pt-2 border-t border-border/70">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 rounded-lg p-2.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="truncate">Developer Governance</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-3.5 bg-muted/20 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">
                  {INSTITUTION.shortName}
                </p>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium bg-background">
                  {academicYear}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                {INSTITUTION.location}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
