import { LoginForm } from "@/features/auth/components/login-form";
import { INSTITUTION } from "@/lib/constants";

export const metadata = {
  title: "Masuk Sistem Presensi",
  description: `Masuk ke akun SIAKAD ${INSTITUTION.name}`,
};

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F8FAFC] via-[#F0FDFA]/60 to-slate-100 dark:from-slate-950 dark:via-teal-950/20 dark:to-slate-900">
      {/* Decorative academic background circles */}
      <div className="absolute top-10 left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center">
        <LoginForm />
        <footer className="mt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} {INSTITUTION.name}.</p>
          <p className="text-[11px] mt-0.5 text-muted-foreground/80">{INSTITUTION.location}</p>
        </footer>
      </div>
    </main>
  );
}
