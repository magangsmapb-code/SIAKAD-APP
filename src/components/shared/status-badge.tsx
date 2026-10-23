"use client";

import * as React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Info, ShieldCheck, Wrench, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SemanticStatus =
  | "HADIR"
  | "TERLAMBAT"
  | "IZIN"
  | "SAKIT"
  | "ALPA"
  | "MENUNGGU"
  | "DISETUJUI"
  | "DITOLAK"
  | "AKTIF"
  | "NON_AKTIF"
  | "MUTASI"
  | "LULUS"
  | "MAINTENANCE"
  | "ACTIVE"
  | "IMPLEMENTED"
  | "IN_PROGRESS"
  | "NOT_IMPLEMENTED";

export interface StatusBadgeProps {
  status: SemanticStatus | string;
  label?: string;
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  label,
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const normalized = (status || "").toUpperCase();

  switch (normalized) {
    case "HADIR":
    case "DISETUJUI":
    case "AKTIF":
    case "ACTIVE":
    case "IMPLEMENTED":
      return (
        <Badge
          variant="hadir"
          className={cn("text-[11px] font-semibold gap-1 py-0.5", className)}
        >
          {showIcon && <CheckCircle2 className="h-3 w-3 shrink-0" />}
          <span>
            {label ||
              (normalized === "HADIR"
                ? "Hadir"
                : normalized === "DISETUJUI"
                ? "Disetujui"
                : normalized === "AKTIF" || normalized === "ACTIVE"
                ? "Aktif"
                : "Telah Diimplementasi")}
          </span>
        </Badge>
      );

    case "TERLAMBAT":
    case "MENUNGGU":
    case "IN_PROGRESS":
      return (
        <Badge
          variant="terlambat"
          className={cn("text-[11px] font-semibold gap-1 py-0.5", className)}
        >
          {showIcon && <Clock className="h-3 w-3 shrink-0" />}
          <span>
            {label ||
              (normalized === "TERLAMBAT"
                ? "Terlambat"
                : normalized === "MENUNGGU"
                ? "Menunggu"
                : "Sedang Dikerjakan")}
          </span>
        </Badge>
      );

    case "IZIN":
    case "MUTASI":
      return (
        <Badge
          variant="izin"
          className={cn("text-[11px] font-semibold gap-1 py-0.5", className)}
        >
          {showIcon && <Info className="h-3 w-3 shrink-0" />}
          <span>
            {label || (normalized === "IZIN" ? "Izin" : "Mutasi")}
          </span>
        </Badge>
      );

    case "SAKIT":
    case "MAINTENANCE":
      return (
        <Badge
          variant="sakit"
          className={cn("text-[11px] font-semibold gap-1 py-0.5", className)}
        >
          {showIcon && (normalized === "MAINTENANCE" ? <Wrench className="h-3 w-3 shrink-0" /> : <AlertTriangle className="h-3 w-3 shrink-0" />)}
          <span>
            {label || (normalized === "SAKIT" ? "Sakit" : "Maintenance")}
          </span>
        </Badge>
      );

    case "ALPA":
    case "DITOLAK":
    case "NON_AKTIF":
    case "NOT_IMPLEMENTED":
      return (
        <Badge
          variant="alpa"
          className={cn("text-[11px] font-semibold gap-1 py-0.5", className)}
        >
          {showIcon && <XCircle className="h-3 w-3 shrink-0" />}
          <span>
            {label ||
              (normalized === "ALPA"
                ? "Alpa"
                : normalized === "DITOLAK"
                ? "Ditolak"
                : normalized === "NON_AKTIF"
                ? "Non-Aktif"
                : "Belum Diimplementasi")}
          </span>
        </Badge>
      );

    case "LULUS":
      return (
        <Badge
          variant="navy"
          className={cn("text-[11px] font-semibold gap-1 py-0.5", className)}
        >
          {showIcon && <ShieldCheck className="h-3 w-3 shrink-0" />}
          <span>{label || "Lulus"}</span>
        </Badge>
      );

    default:
      return (
        <Badge
          variant="outline"
          className={cn("text-[11px] font-medium py-0.5", className)}
        >
          {label || status}
        </Badge>
      );
  }
}
