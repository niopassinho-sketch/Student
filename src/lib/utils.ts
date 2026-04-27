import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function parseTimeToMinutes(timeStr: any): number {
  if (!timeStr) return 0;
  
  // If it's already a number, assume it's minutes
  if (typeof timeStr === 'number') return timeStr;
  
  // Ensure it's a string
  const str = String(timeStr);
  
  // Replace common separators with colon
  const cleanedTimeStr = str.replace(/[,.]/g, ':');
  const parts = cleanedTimeStr.split(':');
  
  if (parts.length === 1) {
    // Only minutes
    const val = parseInt(parts[0], 10);
    return val || 0;
  }
  
  // HH:MM
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const total = hours * 60 + minutes;
  return total;
}

export function formatMinutesToHours(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}
