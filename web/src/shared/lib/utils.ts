import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals?: number): string {
  if (!Number.isFinite(bytes)) {
    return "0 B"
  }

  const absoluteBytes = Math.abs(bytes)
  if (absoluteBytes === 0) {
    return "0 B"
  }

  const unitIndex = Math.min(
    Math.floor(Math.log(absoluteBytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  )

  const value = absoluteBytes / 1024 ** unitIndex
  const defaultDecimals = decimals ?? (unitIndex === 0
    ? 0
    : value >= 100
      ? 0
      : value >= 10
        ? 1
        : 2)
  const formattedValue = Number(value.toFixed(defaultDecimals)) * Math.sign(bytes || 1)

  return `${formattedValue} ${BYTE_UNITS[unitIndex]}`
}
