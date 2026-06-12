// Bronco test: 1200m shuttle (0-20-0, 0-40-0, 0-60-0) × 5 reps
export const BRONCO_DISTANCE = 1200 // metres

export function calcMAS(timeSeconds: number): number {
  return parseFloat(((BRONCO_DISTANCE / timeSeconds) * 3.6).toFixed(2))
}

export interface TrainingZones {
  recovery: number       // 65% MAS
  aerobicThreshold: number  // 80% MAS
  hise: number           // 90% MAS (High Intensity Speed Endurance)
}

export function calcZones(mas: number): TrainingZones {
  return {
    recovery: parseFloat((mas * 0.65).toFixed(2)),
    aerobicThreshold: parseFloat((mas * 0.80).toFixed(2)),
    hise: parseFloat((mas * 0.90).toFixed(2)),
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toFixed(1).padStart(4, '0')}`
}

export function parseTimeInput(input: string): number | null {
  // Accept m:ss.s or plain seconds
  const colonMatch = input.match(/^(\d+):(\d{1,2}(?:\.\d)?)$/)
  if (colonMatch) {
    return parseFloat(colonMatch[1]) * 60 + parseFloat(colonMatch[2])
  }
  const plain = parseFloat(input)
  return isNaN(plain) ? null : plain
}
