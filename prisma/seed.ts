import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

// Load .env files
const envFiles = ['.env.local', '.env']
for (const file of envFiles) {
  const fullPath = path.join(process.cwd(), file)
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath })
    break
  }
}

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
const dbPath = dbUrl.replace('file:', '')
const adapter = new PrismaBetterSqlite3({ url: dbPath })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Default Manager user
  const passwordHash = await bcrypt.hash('Manager123!', 12)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@gaa.local' },
    update: {},
    create: {
      email: 'manager@gaa.local',
      name: 'GAA Manager',
      passwordHash,
      role: 'MANAGER',
      active: true,
    },
  })
  console.log('✓ Manager user:', manager.email)

  // 2. Season
  const season = await prisma.season.upsert({
    where: { id: 'seed-season-2026' },
    update: {},
    create: {
      id: 'seed-season-2026',
      name: 'U16 2026',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      ageCategory: 'U16',
      active: true,
    },
  })
  console.log('✓ Season:', season.name)

  // 3. Venues
  const milltown = await prisma.venue.upsert({
    where: { id: 'seed-venue-milltown' },
    update: {},
    create: {
      id: 'seed-venue-milltown',
      name: 'Milltown',
      archived: false,
    },
  })
  const allWeather = await prisma.venue.upsert({
    where: { id: 'seed-venue-allweather' },
    update: {},
    create: {
      id: 'seed-venue-allweather',
      name: 'All Weather',
      archived: false,
    },
  })
  console.log('✓ Venues: Milltown, All Weather')

  // 4. Attendance codes
  const codeDefs = [
    { code: 'P', label: 'Present',    weight: 1.0,   colour: '#16a34a', sortOrder: 1, protected: true },
    { code: 'C', label: 'County',     weight: 1.0,   colour: '#2563eb', sortOrder: 2, protected: true },
    { code: 'L', label: 'Late',       weight: 0.7,   colour: '#ca8a04', sortOrder: 3, protected: true },
    { code: 'I', label: 'Injured',    weight: 0.05,  colour: '#ea580c', sortOrder: 4, protected: true },
    { code: 'E', label: 'Excused',    weight: 0.0,   colour: '#6b7280', sortOrder: 5, protected: true },
    { code: 'U', label: 'Unexcused',  weight: -0.25, colour: '#dc2626', sortOrder: 6, protected: true },
    { code: 'X', label: 'New Joiner', weight: 0.0,   colour: '#7c3aed', sortOrder: 7, protected: true },
  ]

  for (const c of codeDefs) {
    await prisma.attendanceCode.upsert({
      where: { code: c.code },
      update: { label: c.label, weight: c.weight, colour: c.colour, sortOrder: c.sortOrder },
      create: c,
    })
  }
  console.log('✓ Attendance codes: P, C, L, I, E, U, X')

  // 5. Session types
  const sessionTypeDefs = [
    'Fitness',
    'Football',
    'Extra Football',
    'Hurling',
    'Football Match',
    'Hurling Match',
  ]

  const sessionTypes: Record<string, { id: string }> = {}
  for (const name of sessionTypeDefs) {
    const st = await prisma.sessionType.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    sessionTypes[name] = st
  }
  console.log('✓ Session types:', sessionTypeDefs.join(', '))

  // 6. Players (45)
  const playerDefs = [
    // Known players from fixture table
    { firstName: 'Charlie',   lastName: 'Barry',        codePreference: 'dual' },
    { firstName: 'Conall',    lastName: 'Daly',          codePreference: 'dual' },
    { firstName: 'Conor',     lastName: 'Beggy',         codePreference: 'dual' },
    { firstName: 'Craig',     lastName: 'Campbell',      codePreference: 'dual' },
    { firstName: 'George',    lastName: 'Davey',         codePreference: 'dual' },
    { firstName: 'Harry',     lastName: 'Greene',        codePreference: 'dual' },
    { firstName: 'John',      lastName: 'Farrell',       codePreference: 'dual' },
    { firstName: 'Josh',      lastName: 'Carolan',       codePreference: 'dual' },
    { firstName: 'Leo',       lastName: 'Garry',         codePreference: 'dual' },
    { firstName: 'Liam',      lastName: 'Ward',          codePreference: 'dual' },
    { firstName: 'Luke',      lastName: 'Moran',         codePreference: 'dual' },
    { firstName: 'PJ',        lastName: 'McDonagh',      codePreference: 'dual' },
    { firstName: 'Tadhg',     lastName: 'O Buachalla',   codePreference: 'dual' },
    // Test fixture players
    { firstName: 'Lee',       lastName: 'Byrne',         codePreference: 'dual' },
    { firstName: 'Alfie',     lastName: 'Woods',         codePreference: 'dual' },
    { firstName: 'James',     lastName: 'Dexter',        codePreference: 'dual' },
    { firstName: 'Cillian',   lastName: 'Loughran',      codePreference: 'dual' },
    { firstName: 'James',     lastName: 'Daly',          codePreference: 'dual' },
    { firstName: 'Donnacha',  lastName: 'Paget',         codePreference: 'dual' },
    { firstName: 'Conor',     lastName: 'Meehan',        codePreference: 'dual' },
    // 25 more plausible Irish names
    { firstName: 'Sean',      lastName: 'Murphy',        codePreference: 'dual' },
    { firstName: 'Ciaran',    lastName: 'Kelly',         codePreference: 'dual' },
    { firstName: 'Fionn',     lastName: "O'Brien",       codePreference: 'dual' },
    { firstName: 'Darragh',   lastName: 'Walsh',         codePreference: 'dual' },
    { firstName: 'Oisin',     lastName: 'Ryan',          codePreference: 'dual' },
    { firstName: 'Cormac',    lastName: 'Kennedy',       codePreference: 'dual' },
    { firstName: 'Ronan',     lastName: 'McCarthy',      codePreference: 'dual' },
    { firstName: 'Diarmuid',  lastName: 'Flynn',         codePreference: 'dual' },
    { firstName: 'Padraig',   lastName: "O'Connor",      codePreference: 'dual' },
    { firstName: 'Niall',     lastName: 'Sullivan',      codePreference: 'dual' },
    { firstName: 'Eoin',      lastName: 'Burke',         codePreference: 'dual' },
    { firstName: 'Cathal',    lastName: 'Doyle',         codePreference: 'dual' },
    { firstName: 'Ruairi',    lastName: 'Nolan',         codePreference: 'dual' },
    { firstName: 'Tomas',     lastName: "O'Shea",        codePreference: 'dual' },
    { firstName: 'Colm',      lastName: 'Higgins',       codePreference: 'dual' },
    { firstName: 'Killian',   lastName: 'Lynch',         codePreference: 'dual' },
    { firstName: 'Declan',    lastName: 'Brennan',       codePreference: 'dual' },
    { firstName: 'Lorcan',    lastName: 'Gallagher',     codePreference: 'dual' },
    { firstName: 'Seamus',    lastName: 'Moore',         codePreference: 'dual' },
    { firstName: 'Caolan',    lastName: 'Fitzpatrick',   codePreference: 'dual' },
    { firstName: 'Brian',     lastName: "O'Neill",       codePreference: 'dual' },
    { firstName: 'Donal',     lastName: 'Connolly',      codePreference: 'dual' },
    { firstName: 'Micheal',   lastName: 'Reilly',        codePreference: 'dual' },
    { firstName: 'Aidan',     lastName: 'Sheridan',      codePreference: 'dual' },
    { firstName: 'Fergal',    lastName: 'Dunne',         codePreference: 'dual' },
  ]

  const players: Record<string, { id: string }> = {}
  for (const p of playerDefs) {
    const key = `${p.firstName}-${p.lastName}`
    const seedId = `seed-player-${key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    const player = await prisma.player.upsert({
      where: { id: seedId },
      update: {},
      create: {
        id: seedId,
        firstName: p.firstName,
        lastName: p.lastName,
        codePreference: p.codePreference,
        joinedAt: new Date('2026-01-01'),
        positions: '[]',
      },
    })
    players[key] = player
  }
  console.log(`✓ ${playerDefs.length} players created`)

  // 7. Sessions (8 Fitness sessions)
  const fitnessTypeId = sessionTypes['Fitness'].id
  const sessionDefs = [
    { date: '2026-01-17', venueId: milltown.id },
    { date: '2026-01-24', venueId: milltown.id },
    { date: '2026-01-31', venueId: milltown.id },
    { date: '2026-02-02', venueId: allWeather.id },
    { date: '2026-02-07', venueId: milltown.id },
    { date: '2026-02-14', venueId: allWeather.id },
    { date: '2026-02-28', venueId: milltown.id },
    { date: '2026-03-07', venueId: milltown.id },
  ]

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const sessions: Array<{ id: string }> = []
  for (const s of sessionDefs) {
    const d = new Date(s.date)
    const seedId = `seed-session-${s.date}`
    const session = await prisma.session.upsert({
      where: { id: seedId },
      update: {},
      create: {
        id: seedId,
        seasonId: season.id,
        typeId: fitnessTypeId,
        date: d,
        startTime: '10:00',
        venueId: s.venueId,
        dayOfWeek: dayNames[d.getDay()],
        cancelled: false,
        locked: false,
      },
    })
    sessions.push(session)
  }
  console.log('✓ 8 Fitness sessions created')

  // 8. Attendance data for the 8 fixture players
  // Verify percentages:
  // Charlie Barry:    P×6 C×2 / 8 = (6×1.0 + 2×1.0)/8 = 100.00%
  // Lee Byrne:        P×7 L×1 / 8 = (7×1.0 + 1×0.7)/8 = 96.25%
  // Alfie Woods:      P×7 E×1 / 8 = (7×1.0 + 1×0.0)/8 = 87.50%
  // James Dexter:     P×1 C×6 U×1 / 8 = (1+6-0.25)/8 = 84.375%
  // Cillian Loughran: P×5 E×2 U×1 / 8 = (5+0+0-0.25)/8 = 59.375%
  // James Daly:       P×4 L×1 E×1 U×2 / 8 = (4+0.7+0-0.5)/8 = 52.50%
  // Donnacha Paget:   P×5 I×2 E×1 / 8 = (5+0.1+0)/8 = 63.75%
  // Conor Meehan:     P×1 E×5 U×2 / 8 = (1+0-0.5)/8 = 6.25%

  type FixtureEntry = { key: string; codes: string[] }
  const fixturePlayers: FixtureEntry[] = [
    { key: 'Charlie-Barry',    codes: ['P','P','P','P','P','P','C','C'] },
    { key: 'Lee-Byrne',        codes: ['P','P','P','P','P','P','P','L'] },
    { key: 'Alfie-Woods',      codes: ['P','P','P','P','P','P','P','E'] },
    { key: 'James-Dexter',     codes: ['P','C','C','C','C','C','C','U'] },
    { key: 'Cillian-Loughran', codes: ['P','P','P','P','P','E','E','U'] },
    { key: 'James-Daly',       codes: ['P','P','P','P','L','E','U','U'] },
    { key: 'Donnacha-Paget',   codes: ['P','P','P','P','P','I','I','E'] },
    { key: 'Conor-Meehan',     codes: ['P','E','E','E','E','E','U','U'] },
  ]

  console.log('Verifying percentages:')
  const weights: Record<string, number> = { P: 1.0, C: 1.0, L: 0.7, I: 0.05, E: 0.0, U: -0.25, X: 0 }
  for (const fp of fixturePlayers) {
    const sum = fp.codes.reduce((s, c) => s + (weights[c] ?? 0), 0)
    const pct = (sum / 8) * 100
    console.log(`  ${fp.key}: ${pct.toFixed(2)}%`)
  }

  for (const fp of fixturePlayers) {
    const player = players[fp.key]
    if (!player) {
      console.warn(`  ⚠ Player not found: ${fp.key}`)
      continue
    }

    for (let i = 0; i < sessions.length; i++) {
      const code = fp.codes[i] ?? 'P'
      await prisma.attendance.upsert({
        where: {
          sessionId_playerId: {
            sessionId: sessions[i].id,
            playerId: player.id,
          },
        },
        update: { code },
        create: {
          sessionId: sessions[i].id,
          playerId: player.id,
          code,
          recordedBy: manager.id,
        },
      })
    }
  }

  // Set remaining players to P for all sessions
  const fixtureKeys = new Set(fixturePlayers.map((f) => f.key))
  for (const [key, player] of Object.entries(players)) {
    if (fixtureKeys.has(key)) continue
    for (const session of sessions) {
      await prisma.attendance.upsert({
        where: {
          sessionId_playerId: {
            sessionId: session.id,
            playerId: player.id,
          },
        },
        update: {},
        create: {
          sessionId: session.id,
          playerId: player.id,
          code: 'P',
          recordedBy: manager.id,
        },
      })
    }
  }
  console.log('✓ Attendance records seeded')

  console.log('✅ Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
