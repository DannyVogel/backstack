import { describe, expect, it } from 'vitest'

describe('example service', () => {
  it('should have test environment configured', () => {
    expect(process.env.NITRO_EXAMPLE_API_KEY).toBe('test_example_key')
  })

  it('should have database path configured', () => {
    expect(process.env.NITRO_DATABASE_PATH).toBe('./data/test.db')
  })
})
