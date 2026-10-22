import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines conditional classnames using clsx and merges Tailwind CSS classes cleanly.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats date into Indonesian locale string: e.g. "Kamis, 15 Oktober 2026"
 */
export function formatIndonesianDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Formats time into "HH:mm WIB"
 */
export function formatIndonesianTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const time = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${time} WIB`;
}

/**
 * Formats number to Indonesian currency or numeric separator: e.g. 1.250
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num);
}
