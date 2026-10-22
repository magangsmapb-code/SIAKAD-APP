"use client";

import * as React from "react";
import { Download, FilterX, SlidersHorizontal } from "lucide-react";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface FilterOption {
  label: string;
  value: string;
}

export interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter?: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
  };
  classFilter?: {
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
  };
  onExport?: () => void;
  exportLabel?: string;
  onResetFilters?: () => void;
  hasActiveFilters?: boolean;
  extraActions?: React.ReactNode;
  className?: string;
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Cari data...",
  statusFilter,
  classFilter,
  onExport,
  exportLabel = "Ekspor",
  onResetFilters,
  hasActiveFilters = false,
  extraActions,
  className,
}: TableToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="w-full sm:w-72">
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>

        {classFilter && (
          <div className="w-full sm:w-40">
            <Select
              value={classFilter.value}
              onValueChange={classFilter.onChange}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue
                  placeholder={classFilter.placeholder || "Pilih Kelas"}
                />
              </SelectTrigger>
              <SelectContent>
                {classFilter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {statusFilter && (
          <div className="w-full sm:w-44">
            <Select
              value={statusFilter.value}
              onValueChange={statusFilter.onChange}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue
                  placeholder={statusFilter.placeholder || "Semua Status"}
                />
              </SelectTrigger>
              <SelectContent>
                {statusFilter.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {hasActiveFilters && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <FilterX className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto">
        {extraActions}
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="h-9 gap-1.5 text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
            {exportLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
