"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Wrench, ShieldAlert, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface FeatureUnavailableStateProps {
  featureName: string;
  status?: "MAINTENANCE" | "DISABLED" | "UNAUTHORIZED";
  message?: string;
  onRetry?: () => void;
}

export function FeatureUnavailableState({
  featureName,
  status = "MAINTENANCE",
  message,
  onRetry,
}: FeatureUnavailableStateProps) {
  const router = useRouter();

  const isMaintenance = status === "MAINTENANCE";
  const isUnauthorized = status === "UNAUTHORIZED";

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60 border border-border shadow-sm mb-4">
        {isMaintenance ? (
          <Wrench className="h-8 w-8 text-amber-600 animate-pulse" />
        ) : isUnauthorized ? (
          <ShieldAlert className="h-8 w-8 text-destructive" />
        ) : (
          <Wrench className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="space-y-2 max-w-md">
        <div className="flex items-center justify-center gap-2">
          <Badge
            variant={isMaintenance ? "terlambat" : isUnauthorized ? "alpa" : "outline"}
            className="text-[10px] uppercase font-bold"
          >
            {isMaintenance ? "Dalam Pemeliharaan" : isUnauthorized ? "Akses Dibatasi" : "Fitur Nonaktif"}
          </Badge>
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {featureName}
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {message ||
            (isMaintenance
              ? "Modul ini sedang dalam proses pemeliharaan teknis atau penyesuaian regulasi sekolah. Silakan coba kembali beberapa saat lagi."
              : isUnauthorized
              ? "Peran akun Anda tidak memiliki hak wewenang yang diperlukan untuk modul ini."
              : "Fitur ini sedang dinonaktifkan oleh Administrator melalui Developer Feature Registry.")}
        </p>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali</span>
        </Button>

        {onRetry && (
          <Button
            size="sm"
            onClick={onRetry}
            className="gap-2 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Muat Ulang</span>
          </Button>
        )}
      </div>
    </div>
  );
}
