import * as React from "react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "primary" | "success" | "warning" | "danger" | "neutral";
  trend?: {
    value: string;
    isPositive: boolean;
    label?: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "primary",
  trend,
  className,
}: StatCardProps) {
  const colorMap = {
    primary: {
      iconBg: "bg-teal-50 text-[#0F766E] dark:bg-teal-950/60 dark:text-teal-400",
      borderAccent: "border-l-[#0F766E]",
    },
    success: {
      iconBg: "bg-[#DCFCE7] text-[#166534] dark:bg-emerald-950/60 dark:text-emerald-400",
      borderAccent: "border-l-[#166534]",
    },
    warning: {
      iconBg: "bg-[#FEF3C7] text-[#92400E] dark:bg-amber-950/60 dark:text-amber-400",
      borderAccent: "border-l-[#92400E]",
    },
    danger: {
      iconBg: "bg-[#FEE2E2] text-[#991B1B] dark:bg-rose-950/60 dark:text-rose-400",
      borderAccent: "border-l-[#991B1B]",
    },
    neutral: {
      iconBg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      borderAccent: "border-l-slate-400",
    },
  };

  const currentTheme = colorMap[variant];

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-l-4 p-5 shadow-subtle transition-all duration-200 hover:shadow-card hover:-translate-y-0.5",
        currentTheme.borderAccent,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-foreground data-tabular">
              {value}
            </span>
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
            currentTheme.iconBg
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend.isPositive ? (
            <span className="inline-flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              {trend.value}
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 font-medium text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-3.5 w-3.5" />
              {trend.value}
            </span>
          )}
          {trend.label && (
            <span className="text-muted-foreground">{trend.label}</span>
          )}
        </div>
      )}
    </Card>
  );
}
