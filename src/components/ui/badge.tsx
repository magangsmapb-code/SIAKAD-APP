import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        navy: "border-navy-700 bg-navy-900 text-white",
        // Attendance status badges (Tahap 11 Design System Tokens)
        hadir:
          "border-[#BBF7D0] bg-[#DCFCE7] text-[#166534] dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300",
        terlambat:
          "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E] dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-300",
        izin:
          "border-[#BAE6FD] bg-[#E0F2FE] text-[#075985] dark:border-sky-800 dark:bg-sky-950/70 dark:text-sky-300",
        sakit:
          "border-[#E9D5FF] bg-[#F3E8FF] text-[#6B21A8] dark:border-purple-800 dark:bg-purple-950/70 dark:text-purple-300",
        alpa:
          "border-[#FECACA] bg-[#FEE2E2] text-[#991B1B] dark:border-rose-800 dark:bg-rose-950/70 dark:text-rose-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  const dotColorClass = React.useMemo(() => {
    switch (variant) {
      case "hadir":
        return "bg-[#166534]";
      case "terlambat":
        return "bg-[#92400E]";
      case "izin":
        return "bg-[#075985]";
      case "sakit":
        return "bg-[#6B21A8]";
      case "alpa":
      case "destructive":
        return "bg-[#991B1B]";
      default:
        return "bg-primary";
    }
  }, [variant]);

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dotColorClass)} />}
      <span>{children}</span>
    </div>
  );
}

export { Badge, badgeVariants };
