import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(err: any, defaultMessage: string = "An unexpected error occurred."): string {
  const data = err.response?.data;
  if (!data) return err.message || defaultMessage;
  if (Array.isArray(data.errors)) {
    return data.errors.join(" · ") || data.error || defaultMessage;
  }
  if (typeof data.errors === "string") {
    return data.errors;
  }
  if (data.error) {
    return data.error;
  }
  return defaultMessage;
}
