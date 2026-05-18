import { format } from 'date-fns'

/**
 * Format a date as dd/MM/yyyy
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  try {
    return format(new Date(date), 'dd/MM/yyyy')
  } catch {
    return ''
  }
}

/**
 * Get the day of week name from a date
 */
export function getDayOfWeek(date: Date | string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date(date).getDay()]
}

/**
 * Colour mapping for attendance codes
 */
export const CODE_COLOURS: Record<string, string> = {
  P: '#16a34a',
  C: '#2563eb',
  L: '#ca8a04',
  I: '#ea580c',
  E: '#6b7280',
  U: '#dc2626',
  X: '#7c3aed',
}

export const CODE_BG_CLASSES: Record<string, string> = {
  P: 'bg-green-600 text-white',
  C: 'bg-blue-600 text-white',
  L: 'bg-yellow-600 text-white',
  I: 'bg-orange-600 text-white',
  E: 'bg-gray-500 text-white',
  U: 'bg-red-600 text-white',
  X: 'bg-purple-700 text-white',
}

export const CODE_LABELS: Record<string, string> = {
  P: 'Present',
  C: 'County',
  L: 'Late',
  I: 'Injured',
  E: 'Excused',
  U: 'Unexcused',
  X: 'New Joiner',
}

export const QUICK_CODES = ['P', 'C', 'L', 'I', 'E', 'U']
export const ALL_CODES = ['P', 'C', 'L', 'I', 'E', 'U', 'X']

/**
 * Check if within 48 hours of session
 */
export function isWithin48Hours(sessionDate: Date | string): boolean {
  const session = new Date(sessionDate)
  const now = new Date()
  const diffMs = now.getTime() - session.getTime()
  return diffMs <= 48 * 60 * 60 * 1000
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
