"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Footer } from "@/components/layout/footer";
import { DemoRoleProvider } from "@/contexts/demo-role-context";
import { SchoolDataProvider } from "@/contexts/school-data-context";
import { useAuth } from "@/contexts/auth-context";

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
              {children}
            </main>
            <Footer />
          </div>
        </div>
      </SchoolDataProvider>
    </DemoRoleProvider>
  );
}
