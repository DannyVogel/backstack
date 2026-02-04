import { afterAll, beforeAll } from 'vitest'
import { resetDatabase } from '~/server/database/index'

beforeAll(() => {
  // Setup test environment
  console.log('Setting up test environment...')
})

afterAll(() => {
  // Clean up database connections
  resetDatabase()
  console.log('Test environment cleaned up.')
})
