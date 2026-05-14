import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, differenceInDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount.toLocaleString()}`
}

export function formatAmountRange(min: number, max: number): string {
  if (!min && !max) return 'See official listing for funding details'
  if (min === max) return formatCurrency(min)
  if (!min) return `Up to ${formatCurrency(max)}`
  if (!max) return `${formatCurrency(min)}+`
  return `${formatCurrency(min)} – ${formatCurrency(max)}`
}

export function formatDeadline(date: Date): string {
  if (!date || isNaN(date.getTime())) return 'No deadline'
  const days = differenceInDays(date, new Date())
  if (days < 0) return 'Closed'
  if (days === 0) return 'Due today'
  if (days === 1) return 'Due tomorrow'
  if (days <= 14) return `${days} days left`
  return formatDistanceToNow(date, { addSuffix: true })
}

export function getDeadlineUrgency(date: Date): 'critical' | 'warning' | 'normal' | 'closed' {
  if (!date || isNaN(date.getTime())) return 'normal'
  const days = differenceInDays(date, new Date())
  if (days < 0) return 'closed'
  if (days <= 7) return 'critical'
  if (days <= 14) return 'warning'
  return 'normal'
}

export function getDeadlineProgress(date: Date, createdAt: Date): number {
  if (!date || isNaN(date.getTime())) return 0
  if (!createdAt || isNaN(createdAt.getTime())) return 0
  const total = differenceInDays(date, createdAt)
  const remaining = differenceInDays(date, new Date())
  if (total <= 0) return 100
  const elapsed = total - remaining
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

