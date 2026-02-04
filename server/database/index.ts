import type Database from 'better-sqlite3'
import { createDatabase } from './schema'

let dbInstance: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!dbInstance) {
    dbInstance = createDatabase()
  }
  return dbInstance
}

export function resetDatabase(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}
