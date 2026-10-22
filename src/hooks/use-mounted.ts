"use client";

import * as React from "react";

/**
 * Hook to determine if the component has mounted on the client.
 * Essential for preventing hydration mismatches and Radix portal unmount issues.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
