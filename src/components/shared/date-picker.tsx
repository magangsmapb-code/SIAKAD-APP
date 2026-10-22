import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  label?: string;
}

export function DatePicker({
  value,
  onChange,
  className,
  label,
}: DatePickerProps) {
  const handleQuickPreset = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const dateStr = d.toISOString().split("T")[0];
    onChange(dateStr);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {label && (
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      )}
      <div className="relative flex items-center">
        <CalendarIcon className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="hidden sm:flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs px-2.5"
          onClick={() => handleQuickPreset(0)}
        >
          Hari Ini
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs px-2.5"
          onClick={() => handleQuickPreset(-1)}
        >
          Kemarin
        </Button>
      </div>
    </div>
  );
}
