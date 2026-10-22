import Link from "next/link";
import { GraduationCap, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-lg mb-4">
        <GraduationCap className="h-8 w-8" />
      </div>
      <span className="font-mono text-4xl font-extrabold text-primary">404</span>
      <h1 className="text-xl font-bold text-foreground mt-2">Halaman Tidak Ditemukan</h1>
      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
        Maaf, halaman atau rute yang Anda tuju tidak tersedia di sistem SIAKAD SMA Pemberdayaan Bangsa Ngrayun.
      </p>
      <div className="mt-6 flex items-center gap-2">
        <Button asChild size="sm" className="gap-1.5 text-xs">
          <Link href="/dashboard">
            <Home className="h-3.5 w-3.5" />
            Kembali ke Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
