import path from 'node:path'
import { defineConfig } from 'prisma/config'
import * as fs from 'node:fs'

// Load .env.local or .env
function loadDotEnv() {
  const files = ['.env.local', '.env']
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(process.cwd(), file), 'utf-8')
      for (const line of content.split('\n')) {
        const match = line.match(/^([^#=]+)=(.+)$/)
        if (match) {
          const key = match[1].trim()
          const value = match[2].trim().replace(/^["']|["']$/g, '')
          if (!process.env[key]) process.env[key] = value
        }
      }
    } catch {}
  }
}

loadDotEnv()

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
})
