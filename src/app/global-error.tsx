"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 font-sans">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 mb-3">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Kendala Kritis Sistem</h2>
        <p className="text-sm text-slate-600 mt-1 max-w-md">
          {error.message || "Aplikasi mengalami kendala fatal saat memuat antarmuka."}
        </p>
        <button
          onClick={() => reset()}
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700"
        >
          Muat Ulang Aplikasi
        </button>
      </body>
    </html>
  );
}
