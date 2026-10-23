"use client";

import * as React from "react";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface FilterPanelProps {
  children: React.ReactNode;
  activeCount?: number;
  onReset?: () => void;
  className?: string;
}

export function FilterPanel({
  children,
  activeCount = 0,
  onReset,
  className,
}: FilterPanelProps) {
  const [mobileExpanded, setMobileExpanded] = React.useState(false);

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Mobile Toggle Bar */}
      <div className="flex items-center justify-between sm:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="gap-2 text-xs h-9 font-medium"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          <span>Filter Data</span>
          {activeCount > 0 && (
            <Badge variant="default" className="h-4 px-1.5 text-[10px] font-bold">
              {activeCount}
            </Badge>
          )}
        </Button>

        {activeCount > 0 && onReset && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs h-9 text-muted-foreground hover:text-foreground gap-1"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Filter Items Container: hidden on mobile unless toggled; flex on sm+ */}
      <div
        className={cn(
          "transition-all duration-200",
          mobileExpanded
            ? "block rounded-xl border border-border bg-muted/30 p-3 space-y-2.5 sm:space-y-0"
            : "hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2.5"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2.5 flex-1">
          {children}
        </div>

        {activeCount > 0 && onReset && (
          <div className="hidden sm:flex items-center shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs h-9 text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
