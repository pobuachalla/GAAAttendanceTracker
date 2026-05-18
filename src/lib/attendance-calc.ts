/**
 * Attendance calculation functions
 * Formula: (P×1.0 + C×1.0 + L×0.7 + I×0.05 + E×0.0 + U×-0.25) / N
 * - X sessions excluded from both numerator and denominator
 * - Cancelled sessions excluded from denominator
 * - Sessions before player.joinedAt count as X (excluded)
 */

export interface CodeWeights {
  [code: string]: number
}

export const DEFAULT_WEIGHTS: CodeWeights = {
  P: 1.0,
  C: 1.0,
  L: 0.7,
  I: 0.05,
  E: 0.0,
  U: -0.25,
  X: 0, // excluded from calc
}

export interface AttendanceEntry {
  code: string
  sessionCancelled?: boolean
}

export interface CodeBreakdown {
  P: number
  C: number
  L: number
  I: number
  E: number
  U: number
  X: number
  [key: string]: number
}

export interface PlayerStats {
  percentage: number
  n: number
  breakdown: CodeBreakdown
  weightedSum: number
}

/**
 * Calculate attendance percentage for a player given their attendance entries.
 * Each entry is: { code, sessionCancelled }
 */
export function calcPlayerStats(
  entries: AttendanceEntry[],
  weights: CodeWeights = DEFAULT_WEIGHTS
): PlayerStats {
  const breakdown: CodeBreakdown = { P: 0, C: 0, L: 0, I: 0, E: 0, U: 0, X: 0 }

  let weightedSum = 0
  let n = 0

  for (const entry of entries) {
    const code = entry.code.toUpperCase()

    // Increment breakdown
    if (code in breakdown) {
      breakdown[code as keyof CodeBreakdown]++
    } else {
      breakdown[code] = (breakdown[code] ?? 0) + 1
    }

    // Skip cancelled sessions
    if (entry.sessionCancelled) continue

    // X sessions excluded from numerator and denominator
    if (code === 'X') continue

    const w = weights[code] ?? 0
    weightedSum += w
    n++
  }

  const percentage = n > 0 ? (weightedSum / n) * 100 : 0

  return {
    percentage,
    n,
    breakdown,
    weightedSum,
  }
}

export interface RankedPlayer {
  id: string
  firstName: string
  lastName: string
  displayName?: string | null
  percentage: number
  rank: number
  n: number
  breakdown: CodeBreakdown
}

/**
 * Rank players by attendance %.
 * Ties share the same rank; next rank skips.
 * Secondary sort: lastName ASC, firstName ASC.
 */
export function rankPlayers(
  players: Array<{
    id: string
    firstName: string
    lastName: string
    displayName?: string | null
    percentage: number
    n: number
    breakdown: CodeBreakdown
  }>
): RankedPlayer[] {
  const sorted = [...players].sort((a, b) => {
    if (b.percentage !== a.percentage) return b.percentage - a.percentage
    if (a.lastName !== b.lastName) return a.lastName.localeCompare(b.lastName)
    return a.firstName.localeCompare(b.firstName)
  })

  let rank = 1
  return sorted.map((p, i) => {
    if (i > 0 && sorted[i].percentage !== sorted[i - 1].percentage) {
      rank = i + 1
    }
    return { ...p, rank }
  })
}

/**
 * Format a percentage as a string with 2 decimal places.
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}
