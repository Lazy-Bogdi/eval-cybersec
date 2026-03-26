import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function assetUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_ASSETS_URL || "";
  if (base) {
    return `${base.replace(/\/$/, "")}/${path}`;
  }
  return `/${path}`;
}
