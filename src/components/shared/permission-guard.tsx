"use client";

import * as React from "react";
import { useDemoRole } from "@/contexts/demo-role-context";
import { DemoRoleType } from "@/lib/constants";

export interface PermissionGuardProps {
  roles?: (DemoRoleType | string)[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  roles,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { role } = useDemoRole();

  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  const isAllowed = roles.includes(role);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
