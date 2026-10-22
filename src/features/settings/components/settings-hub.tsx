"use client";

import * as React from "react";
import { Settings, Database, Terminal, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsForm } from "./settings-form";
import { AuditLogView } from "./audit-log-view";
import { DeveloperDashboardView } from "./developer-dashboard-view";

export function SettingsHub() {
  const [activeTab, setActiveTab] = React.useState<string>("settings");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-border pb-3">
          <TabsList className="grid grid-cols-1 sm:grid-cols-3 w-full sm:w-auto h-auto p-1 bg-muted/70 gap-1">
            <TabsTrigger
              value="settings"
              className="text-xs sm:text-sm font-semibold py-2.5 px-4 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
            >
              <Settings className="h-4 w-4" />
              <span>Konfigurasi Sekolah</span>
            </TabsTrigger>
            <TabsTrigger
              value="audit-logs"
              className="text-xs sm:text-sm font-semibold py-2.5 px-4 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
            >
              <Database className="h-4 w-4" />
              <span>Jejak Audit Aktivitas</span>
            </TabsTrigger>
            <TabsTrigger
              value="developer"
              className="text-xs sm:text-sm font-semibold py-2.5 px-4 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
            >
              <Terminal className="h-4 w-4" />
              <span>Developer Dashboard</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="settings" className="m-0 focus-visible:outline-none">
          <SettingsForm />
        </TabsContent>

        <TabsContent value="audit-logs" className="m-0 focus-visible:outline-none">
          <AuditLogView />
        </TabsContent>

        <TabsContent value="developer" className="m-0 focus-visible:outline-none">
          <DeveloperDashboardView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
