"use client";

import * as React from "react";
import { DemoRoleType, DemoUser, DEMO_USERS, ACADEMIC_YEARS } from "@/lib/constants";

interface DemoRoleContextValue {
  role: DemoRoleType;
  setRole: (role: DemoRoleType) => void;
  currentUser: DemoUser;
  academicYear: string;
  setAcademicYear: (year: string) => void;
}

const DemoRoleContext = React.createContext<DemoRoleContextValue | undefined>(undefined);

export function DemoRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = React.useState<DemoRoleType>("ADMIN");
  const [academicYear, setAcademicYearState] = React.useState<string>("2026/2027 Ganjil");

  // Sync from localStorage safely on mount
  React.useEffect(() => {
    try {
      const storedRole = localStorage.getItem("siakad_demo_role") as DemoRoleType;
      if (storedRole && DEMO_USERS[storedRole]) {
        setRoleState(storedRole);
      }
      const storedYear = localStorage.getItem("siakad_academic_year");
      if (storedYear) {
        setAcademicYearState(storedYear);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setRole = React.useCallback((newRole: DemoRoleType) => {
    setRoleState(newRole);
    try {
      localStorage.setItem("siakad_demo_role", newRole);
    } catch {
      // Ignore
    }
  }, []);

  const setAcademicYear = React.useCallback((newYear: string) => {
    setAcademicYearState(newYear);
    try {
      localStorage.setItem("siakad_academic_year", newYear);
    } catch {
      // Ignore
    }
  }, []);

  const currentUser = DEMO_USERS[role] || DEMO_USERS.ADMIN;

  const value = React.useMemo(
    () => ({
      role,
      setRole,
      currentUser,
      academicYear,
      setAcademicYear,
    }),
    [role, setRole, currentUser, academicYear, setAcademicYear]
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
