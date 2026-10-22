"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient, setMemoryAccessToken, ApiError } from "@/lib/api-client";
import { toast } from "sonner";

export interface AuthUser {
  id: string;
  username: string;
  email?: string | null;
  role: "SUPER_ADMIN" | "DEVELOPER" | "ADMIN" | "SCHOOL_ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT";
  fullName: string;
  teacherId?: string;
  studentId?: string;
  classId?: string;
  teacherNip?: string;
  studentNis?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const checkSession = React.useCallback(async () => {
    try {
      const res = await apiClient.get<AuthUser>('/auth/me');
      if (res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkSession();

    // Hook unauthorized callback from apiClient
    apiClient.setOnUnauthorized(() => {
      setUser(null);
      setMemoryAccessToken(null);
      if (!pathname.includes('/login')) {
        toast.error('Sesi login telah kedaluwarsa. Silakan masuk kembali.');
        router.push('/login');
      }
    });
  }, [checkSession, pathname, router]);

  // Route protection
  React.useEffect(() => {
    if (!isLoading) {
      const isPublicPath = pathname === '/login' || pathname.startsWith('/_next') || pathname.startsWith('/api');
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = React.useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await apiClient.post<{ user: AuthUser; tokens: { accessToken: string; refreshToken: string } }>(
        '/auth/login',
        { username, password }
      );

      if (res.data?.tokens?.accessToken) {
        setMemoryAccessToken(res.data.tokens.accessToken);
      }

      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        await checkSession();
      }

      toast.success('Login Berhasil', {
        description: `Selamat datang kembali, ${res.data?.user?.fullName || username}!`,
      });

      router.push('/dashboard');
      return true;
    } catch (err: any) {
      const errorMsg = err instanceof ApiError ? err.message : 'Kredensial tidak valid atau akun dinonaktifkan';
      toast.error('Gagal Masuk', { description: errorMsg });
      throw err;
    }
  }, [checkSession, router]);

  const logout = React.useCallback(async () => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore network errors on logout
    } finally {
      setMemoryAccessToken(null);
      setUser(null);
      toast.info('Anda telah keluar dari sistem SIAKAD.');
      router.push('/login');
    }
  }, [router]);

  const refreshProfile = React.useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  const value = React.useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshProfile,
    }),
    [user, isLoading, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
