import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Terjadi Kesalahan",
  message = "Gagal memuat data presensi. Silakan periksa koneksi atau coba beberapa saat lagi.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center animate-in fade-in-50",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6 stroke-[1.8]" />
      </div>
      <h4 className="mt-3 text-base font-semibold text-destructive">{title}</h4>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5 border-destructive/30 hover:bg-destructive/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Muat Ulang
        </Button>
      )}
    </div>
  );
}
