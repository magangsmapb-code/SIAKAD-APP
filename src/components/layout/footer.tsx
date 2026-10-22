"use client";

import * as React from "react";
import Image from "next/image";
import { GraduationCap, ShieldCheck, Heart } from "lucide-react";
import { INSTITUTION } from "@/lib/constants";
import { useDemoRole } from "@/contexts/demo-role-context";

export function Footer() {
  const { academicYear } = useDemoRole();

  return (
    <footer className="border-t border-border bg-card/60 px-4 py-6 sm:px-6 lg:px-8 mt-auto text-xs text-muted-foreground">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Branding & School Info */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-border p-0.5 shadow-sm shrink-0">
            <Image
              src="/logo.png"
              alt="Logo SMA PB Ngrayun"
              width={28}
              height={28}
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {INSTITUTION.systemName} &bull; {INSTITUTION.name}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {INSTITUTION.tagline} &bull; Kec. Ngrayun, Kab. Ponorogo
            </p>
          </div>
        </div>

        {/* Right: Academic Year & Status */}
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-emerald-700 dark:text-emerald-300 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Gate RFID Kiosk Aktif
          </span>
          <span className="hidden md:inline text-border">|</span>
          <span>Tahun Ajaran: <strong className="text-foreground font-semibold">{academicYear}</strong></span>
          <span className="hidden md:inline text-border">|</span>
          <span>v1.12 (SIAKAD SMA PB Ngrayun)</span>
        </div>
      </div>
    </footer>
  );
}
