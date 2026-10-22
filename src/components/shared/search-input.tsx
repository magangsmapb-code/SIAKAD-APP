import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  debounceMs = 300,
  placeholder = "Cari siswa, NIS, kelas...",
  className,
  ...props
}: SearchInputProps) {
  const [internalValue, setInternalValue] = React.useState(value);

  React.useEffect(() => {
    setInternalValue(value);
  }, [value]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onChange, value]);

  const handleClear = () => {
    setInternalValue("");
    onChange("");
    if (onClear) onClear();
  };

  return (
    <div className={cn("relative flex items-center w-full", className)}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8"
        {...props}
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 rounded-sm p-0.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Hapus pencarian"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
