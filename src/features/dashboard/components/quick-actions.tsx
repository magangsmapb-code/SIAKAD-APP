"use client";

import * as React from "react";
import Link from "next/link";
import {
  QrCode,
  FileCheck2,
  UserPlus,
  FileSpreadsheet,
  Settings,
  Clock,
  Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickActions({
  onOpenManualModal,
}: {
  onOpenManualModal?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold">Aksi Cepat & Pintasan</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2.5">
        <Button
          variant="outline"
          className="h-auto flex-col items-center justify-center p-3 text-center gap-2 hover:border-primary/50 hover:bg-primary/5"
          onClick={onOpenManualModal}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Clock className="h-5 w-5" />
          </div>
          <span className="text-xs font-semibold">Presensi Manual</span>
        </Button>

        <Button
          variant="outline"
          className="h-auto flex-col items-center justify-center p-3 text-center gap-2 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30"
          asChild
        >
          <Link href="/permissions">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold">Verifikasi Izin</span>
          </Link>
        </Button>

        <Button
          variant="outline"
          className="h-auto flex-col items-center justify-center p-3 text-center gap-2 hover:border-purple-500/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/30"
          asChild
        >
          <Link href="/reports">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold">Rekap Bulanan</span>
          </Link>
        </Button>

        <Button
          variant="outline"
          className="h-auto flex-col items-center justify-center p-3 text-center gap-2 hover:border-navy-500/50 hover:bg-navy-50/50 dark:hover:bg-navy-950/30"
          asChild
        >
          <Link href="/students">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-800 dark:bg-navy-950/60 dark:text-navy-300">
              <UserPlus className="h-5 w-5" />
            </div>
            <span className="text-xs font-semibold">Tambah Siswa</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
