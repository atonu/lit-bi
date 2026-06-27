import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(err: any, defaultMessage: string = "An unexpected error occurred."): string {
  if (!err) return defaultMessage;
  
  const data = err.response?.data || (err.error || err.errors ? err : null);
  
  if (data) {
    if (Array.isArray(data.errors)) {
      return data.errors.join(" · ") || data.error || defaultMessage;
    }
    if (typeof data.errors === "string") {
      return data.errors;
    }
    if (data.error) {
      return data.error;
    }
  }
  
  return err.message || defaultMessage;
}
