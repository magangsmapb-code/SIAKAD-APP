"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Lock, User, GraduationCap, ShieldCheck, School } from "lucide-react";
import { loginSchema, LoginInput } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { INSTITUTION } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "admin",
      password: "admin123",
      rememberMe: true,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      await login(data.username, data.password);
    } catch (err: any) {
      setErrorMsg(err.message || "Kombinasi NIP/Username dan kata sandi tidak cocok.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-border p-2 shadow-sm">
          <Image
            src="/logo.png"
            alt="Logo SMA PB Ngrayun"
            width={48}
            height={48}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        <div className="pt-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {INSTITUTION.systemName}
          </h2>
          <p className="text-xs font-semibold text-primary mt-0.5">
            {INSTITUTION.name}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
            {INSTITUTION.tagline}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            NIP / NIS / Username
          </label>
          <Input
            {...register("username")}
            placeholder="Masukkan NIP atau NIS"
            error={!!errors.username}
            disabled={isLoading}
            autoComplete="username"
          />
          {errors.username && (
            <p className="text-[11px] text-destructive">
              {errors.username.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            Kata Sandi
          </label>
          <Input
            type="password"
            {...register("password")}
            placeholder="••••••••"
            error={!!errors.password}
            disabled={isLoading}
            autoComplete="current-password"
          />
          {errors.password && (
            <p className="text-[11px] text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={rememberMe}
              onCheckedChange={(checked) => setValue("rememberMe", !!checked)}
            />
            <span className="text-muted-foreground text-xs">
              Ingat akun saya
            </span>
          </label>
          <button
            type="button"
            className="text-primary hover:underline font-medium text-xs"
            onClick={() => alert("Silakan hubungi Administrator IT SMA PB Ngrayun untuk reset kata sandi.")}
          >
            Lupa sandi?
          </button>
        </div>

        <Button
          type="submit"
          className="w-full gap-2 mt-2 h-10 font-semibold"
          isLoading={isLoading}
        >
          <LogIn className="h-4 w-4" />
          Masuk ke SIAKAD
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-4 text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Sistem Presensi Terverifikasi KCD Wilayah Ponorogo</span>
        </div>
      </div>
    </div>
  );
}
