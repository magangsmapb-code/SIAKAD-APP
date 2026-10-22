import * as React from "react";
import { FolderOpen, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-8 text-center animate-in fade-in-50",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground shadow-inner">
        <Icon className="h-7 w-7 stroke-[1.5]" />
      </div>
      <h4 className="mt-4 text-base font-semibold text-foreground">{title}</h4>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          variant="outline"
          size="sm"
          className="mt-5"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
