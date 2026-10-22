import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { BreadcrumbItem } from "@/types";

export interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className = "" }: BreadcrumbNavProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs ${className}`}>
      <ol className="flex items-center space-x-1.5 text-muted-foreground">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center hover:text-foreground transition-colors p-1 rounded-sm"
            aria-label="Kembali ke Dashboard"
          >
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <li className="text-muted-foreground/60">
                <ChevronRight className="h-3.5 w-3.5" />
              </li>
              <li>
                {isLast || !item.href ? (
                  <span
                    className="font-semibold text-foreground select-none"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition-colors hover:underline"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
