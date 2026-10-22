"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("SIAKAD Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold text-foreground">Terjadi Kendala Sistem</h2>
      <p className="text-xs text-muted-foreground mt-1 max-w-md">
        {error.message || "Gagal memproses permintaan Anda. Silakan coba kembali."}
      </p>
      <Button
        onClick={() => reset()}
        variant="outline"
        size="sm"
        className="mt-4 gap-1.5 text-xs"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Muat Ulang Komponen
      </Button>
    </div>
  );
}
