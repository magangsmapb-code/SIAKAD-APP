"use client";

import * as React from "react";
import { BookOpen, History, Radio, ShieldAlert } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionList } from "./session-list";
import { AttendanceHistoryRecap } from "./attendance-history-recap";
import { LiveAttendanceFeed } from "./live-attendance-feed";
import { AttendanceAnomalyReview } from "./attendance-anomaly-review";

export function AttendanceHub() {
  const [activeHubTab, setActiveHubTab] = React.useState<string>("sessions");

  return (
    <div className="space-y-6">
      {/* Hub Header Navigation Tabs */}
      <Tabs value={activeHubTab} onValueChange={setActiveHubTab} className="space-y-6">
        <div className="border-b pb-3">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full sm:w-auto h-auto p-1 bg-muted/70 gap-1">
            <TabsTrigger
              value="sessions"
              className="text-xs sm:text-sm font-semibold py-2.5 px-3 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BookOpen className="h-4 w-4 text-primary" />
              Sesi Absensi Kelas
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="text-xs sm:text-sm font-semibold py-2.5 px-3 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <History className="h-4 w-4 text-emerald-600" />
              Riwayat & Rekapitulasi
            </TabsTrigger>
            <TabsTrigger
              value="live-rfid"
              className="text-xs sm:text-sm font-semibold py-2.5 px-3 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Radio className="h-4 w-4 text-blue-600 animate-pulse" />
              Monitoring RFID
            </TabsTrigger>
            <TabsTrigger
              value="anomalies"
              className="text-xs sm:text-sm font-semibold py-2.5 px-3 gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm text-rose-600 dark:text-rose-400"
            >
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              Audit Anomali
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Sesi Absensi Kelas */}
        <TabsContent value="sessions" className="m-0 focus-visible:outline-none">
          <SessionList />
        </TabsContent>

        {/* Tab 2: Riwayat & Rekapitulasi */}
        <TabsContent value="history" className="m-0 focus-visible:outline-none">
          <AttendanceHistoryRecap />
        </TabsContent>

        {/* Tab 3: Monitoring Gerbang RFID */}
        <TabsContent value="live-rfid" className="m-0 focus-visible:outline-none">
          <LiveAttendanceFeed />
        </TabsContent>

        {/* Tab 4: Audit & Anomali Keamanan */}
        <TabsContent value="anomalies" className="m-0 focus-visible:outline-none">
          <AttendanceAnomalyReview />
        </TabsContent>
      </Tabs>
    </div>
  );
}
