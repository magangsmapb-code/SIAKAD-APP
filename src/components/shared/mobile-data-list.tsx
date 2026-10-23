"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface MobileDataCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  avatar?: React.ReactNode;
  fields?: { label: string; value: React.ReactNode }[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  onClick?: () => void;
}

export function MobileDataCard({
  title,
  subtitle,
  badge,
  avatar,
  fields = [],
  actions,
  children,
  collapsible = false,
  defaultExpanded = false,
  className,
  onClick,
}: MobileDataCardProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border bg-card p-3.5 sm:p-4 shadow-sm hover:border-primary/40 transition-all duration-150 space-y-3",
        onClick && "cursor-pointer hover:bg-muted/20",
        className
      )}
    >
      {/* Header: Title + Badge */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {avatar && <div className="shrink-0">{avatar}</div>}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-foreground leading-tight truncate">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {collapsible && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-1 rounded-md text-muted-foreground hover:bg-muted"
              aria-label={expanded ? "Ciutkan rincian" : "Buka rincian"}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Structured Fields Grid */}
      {fields.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50 text-xs">
          {fields.map((f, idx) => (
            <div key={idx} className="space-y-0.5 min-w-0">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block truncate">
                {f.label}
              </span>
              <div className="font-medium text-foreground truncate">
                {f.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded details */}
      {(!collapsible || expanded) && children && (
        <div className="pt-2 border-t border-border/50 text-xs">{children}</div>
      )}

      {/* Actions footer */}
      {actions && (
        <div className="pt-2 border-t border-border/50 flex items-center justify-end gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

export function MobileDataList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-3 md:hidden", className)}>
      {children}
    </div>
  );
}
