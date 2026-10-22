"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Footer } from "@/components/layout/footer";
import { DemoRoleProvider, useDemoRole } from "@/contexts/demo-role-context";
import { SchoolDataProvider } from "@/contexts/school-data-context";
import { useAuth } from "@/contexts/auth-context";
import { MAIN_NAVIGATION } from "@/lib/constants";
import { Button } from "@/components/ui/button";

function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, currentUser } = useDemoRole();

  const matchingItem = React.useMemo(() => {
    const allItems = MAIN_NAVIGATION.flatMap((s) => s.items);
    return allItems.find(
      (item) => pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
    );
  }, [pathname]);

  const isAllowed = React.useMemo(() => {
    if (!matchingItem || !matchingItem.roles) return true;
    return matchingItem.roles.includes(role);
  }, [matchingItem, role]);

  if (!isAllowed) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-1.5 max-w-md">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Akses Ditolak (403 Forbidden)
          </h2>
          <p className="text-xs text-muted-foreground">
            Akun Anda dengan peran <strong>{currentUser.roleLabel}</strong> tidak memiliki wewenang untuk membuka halaman ini ({pathname}).
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard")} className="gap-2">
          Kembali ke Dashboard
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs font-medium text-muted-foreground animate-pulse">
            Memverifikasi sesi pengguna SIAKAD...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <DemoRoleProvider>
      <SchoolDataProvider>
        <div className="flex min-h-screen bg-background">
          {/* Desktop Sidebar (hidden on mobile) */}
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            className="hidden md:flex min-h-screen sticky top-0 h-screen shrink-0"
          />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col min-w-0">
            <Topbar />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in-50 duration-200">
              <RouteGuard>{children}</RouteGuard>
            </main>
            <Footer />
          </div>
        </div>
      </SchoolDataProvider>
    </DemoRoleProvider>
  );
}
