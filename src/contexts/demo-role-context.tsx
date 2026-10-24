"use client";

import * as React from "react";
import { DemoRoleType, DemoUser, DEMO_USERS } from "@/lib/constants";
import { useAuth } from "@/contexts/auth-context";

export function mapBackendRoleToAppRole(backendRole?: string): DemoRoleType {
  switch (backendRole) {
    case "STUDENT":
      return "SISWA";
    case "TEACHER":
      return "GURU";
    case "PRINCIPAL":
      return "KEPALA_SEKOLAH";
    case "DEVELOPER":
      return "DEVELOPER";
    case "SUPER_ADMIN":
    case "ADMIN":
    case "SCHOOL_ADMIN":
    default:
      return "ADMIN";
  }
}

interface DemoRoleContextValue {
  role: DemoRoleType;
  setRole: (role: DemoRoleType) => void;
  currentUser: DemoUser;
  academicYear: string;
  setAcademicYear: (year: string) => void;
  isSimulatedRole: boolean;
}

const DemoRoleContext = React.createContext<DemoRoleContextValue | undefined>(undefined);

export function DemoRoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [academicYear, setAcademicYearState] = React.useState<string>("2026/2027 Ganjil");
  const [simulatedRole, setSimulatedRoleState] = React.useState<DemoRoleType | null>(null);

  // Sync academic year from localStorage safely on mount
  React.useEffect(() => {
    try {
      const storedYear = localStorage.getItem("siakad_academic_year");
      if (storedYear) {
        setAcademicYearState(storedYear);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Compute active role strictly from authenticated user when logged in
  const role: DemoRoleType = React.useMemo(() => {
    if (!user) {
      return simulatedRole || "ADMIN";
    }

    // Only SUPER_ADMIN / DEVELOPER can simulate other roles
    if (user.role === "SUPER_ADMIN" || user.role === "DEVELOPER") {
      return simulatedRole || mapBackendRoleToAppRole(user.role);
    }

    // For all other users (STUDENT, TEACHER, PRINCIPAL, ADMIN), lock strictly to their real role
    return mapBackendRoleToAppRole(user.role);
  }, [user, simulatedRole]);

  const setRole = React.useCallback(
    (newRole: DemoRoleType) => {
      // Security check: non-super-admins cannot switch roles
      if (user && user.role !== "SUPER_ADMIN" && user.role !== "DEVELOPER") {
        console.warn("Role switching is restricted for non-super-admin accounts.");
        return;
      }
      setSimulatedRoleState(newRole);
      try {
        localStorage.setItem("siakad_demo_role", newRole);
      } catch {
        // Ignore
      }
    },
    [user]
  );

  const setAcademicYear = React.useCallback((newYear: string) => {
    setAcademicYearState(newYear);
    try {
      localStorage.setItem("siakad_academic_year", newYear);
    } catch {
      // Ignore
    }
  }, []);

  // Build authentic currentUser profile
  const currentUser: DemoUser = React.useMemo(() => {
    if (user) {
      const appRole = role;
      const roleLabel =
        user.role === "DEVELOPER"
          ? "Developer & Core Engineer"
          : user.role === "STUDENT"
          ? "Siswa"
          : user.role === "TEACHER"
          ? "Guru & Wali Kelas"
          : user.role === "PRINCIPAL"
          ? "Kepala Sekolah"
          : "Admin / Tata Usaha";

      return {
        id: user.id || "usr-authenticated",
        name: user.fullName || user.username,
        role: appRole,
        roleLabel,
        identifier: user.studentNis || user.teacherNip || user.username,
        email: user.email || `${user.username}@smapbngrayun.sch.id`,
        title:
          user.role === "DEVELOPER"
            ? "Lead System Architect & Core Platform Engineer"
            : user.role === "STUDENT"
            ? `Siswa (NIS: ${user.studentNis || user.username})`
            : user.role === "TEACHER"
            ? `Pendidik (NIP: ${user.teacherNip || user.username})`
            : user.role === "PRINCIPAL"
            ? "Kepala Sekolah SMA PB Ngrayun"
            : "Staf Tata Usaha / Admin",
        avatarFallback: (user.fullName || user.username)
          .split(" ")
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase(),
        assignedClass: user.classId || "X MIPA 1",
      };
    }
    return DEMO_USERS[role] || DEMO_USERS.ADMIN;
  }, [user, role]);

  const isSimulatedRole = !!simulatedRole && (user?.role === "SUPER_ADMIN" || user?.role === "DEVELOPER");

  const value = React.useMemo(
    () => ({
      role,
      setRole,
      currentUser,
      academicYear,
      setAcademicYear,
      isSimulatedRole,
    }),
    [role, setRole, currentUser, academicYear, setAcademicYear, isSimulatedRole]
  );

  return (
    <DemoRoleContext.Provider value={value}>
      {children}
    </DemoRoleContext.Provider>
  );
}

export function useDemoRole() {
  const context = React.useContext(DemoRoleContext);
  if (!context) {
    throw new Error("useDemoRole must be used within a DemoRoleProvider");
  }
  return context;
}
