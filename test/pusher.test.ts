import { describe, expect, it } from 'vitest'
import { validateSubscriptionKeys, normalizeSubscriptionKeys } from '~/server/pusher/utils/key-validation'
import { successResponse, errorResponse } from '~/server/pusher/utils/response'
import { NotificationResultProcessor } from '~/server/pusher/services/result-processor.service'

// Generate valid p256dh (65 bytes) and auth (16 bytes) keys in base64url format
function makeValidKeys() {
  const p256dh = Buffer.alloc(65, 0x04).toString('base64url')
  const auth = Buffer.alloc(16, 0xab).toString('base64url')
  return { p256dh, auth }
}

describe('pusher key-validation', () => {
  describe('validateSubscriptionKeys', () => {
    it('should accept valid keys', () => {
      const keys = makeValidKeys()
      expect(() => validateSubscriptionKeys(keys)).not.toThrow()
    })

    it('should reject null keys', () => {
      expect(() => validateSubscriptionKeys(null as any)).toThrow('Keys must be an object')
    })

    it('should reject missing p256dh', () => {
      const keys = { p256dh: '', auth: 'abc' }
      expect(() => validateSubscriptionKeys(keys)).toThrow('p256dh key is required')
    })

    it('should reject missing auth', () => {
      const keys = { p256dh: 'abc', auth: '' }
      expect(() => validateSubscriptionKeys(keys)).toThrow('auth key is required')
    })

    it('should reject non-string p256dh', () => {
      const keys = { p256dh: 123 as any, auth: 'abc' }
      expect(() => validateSubscriptionKeys(keys)).toThrow('p256dh key is required and must be a string')
    })

    it('should reject non-string auth', () => {
      const keys = { p256dh: 'abc', auth: 123 as any }
      expect(() => validateSubscriptionKeys(keys)).toThrow('auth key is required and must be a string')
    })

    it('should reject invalid base64url characters in p256dh', () => {
      const keys = { p256dh: 'invalid!!!key', auth: 'abc' }
      expect(() => validateSubscriptionKeys(keys)).toThrow('p256dh key must be a valid base64url string')
    })

    it('should reject invalid base64url characters in auth', () => {
      const keys = makeValidKeys()
      keys.auth = 'invalid!!!key'
      expect(() => validateSubscriptionKeys(keys)).toThrow('auth key must be a valid base64url string')
    })

    it('should reject p256dh that decodes to wrong byte length', () => {
      // 32 bytes instead of 65
      const keys = {
        p256dh: Buffer.alloc(32, 0x01).toString('base64url'),
        auth: Buffer.alloc(16, 0xab).toString('base64url'),
      }
      expect(() => validateSubscriptionKeys(keys)).toThrow('p256dh key must decode to exactly 65 bytes')
    })

    it('should reject auth that decodes to wrong byte length', () => {
      const keys = {
        p256dh: Buffer.alloc(65, 0x04).toString('base64url'),
        auth: Buffer.alloc(8, 0xab).toString('base64url'),
      }
      expect(() => validateSubscriptionKeys(keys)).toThrow('auth key must decode to exactly 16 bytes')
    })
  })

  describe('normalizeSubscriptionKeys', () => {
    it('should return trimmed keys when valid', () => {
      const keys = makeValidKeys()
      const normalized = normalizeSubscriptionKeys(keys)
      expect(normalized.p256dh).toBe(keys.p256dh.trim())
      expect(normalized.auth).toBe(keys.auth.trim())
    })

    it('should throw for invalid keys', () => {
      expect(() => normalizeSubscriptionKeys({ p256dh: '', auth: '' })).toThrow()
    })
  })
})

describe('pusher response helpers', () => {
  describe('successResponse', () => {
    it('should return default success response', () => {
      const result = successResponse()
      expect(result).toEqual({
        status_code: 200,
        message: 'Success',
        data: undefined,
      })
    })

    it('should include data when provided', () => {
      const data = { id: 1, name: 'test' }
      const result = successResponse(data)
      expect(result.data).toEqual(data)
      expect(result.status_code).toBe(200)
    })

    it('should use custom message and status code', () => {
      const result = successResponse({ ok: true }, 'Created', 201)
      expect(result.status_code).toBe(201)
      expect(result.message).toBe('Created')
      expect(result.data).toEqual({ ok: true })
    })
  })

  describe('errorResponse', () => {
    it('should return default error response', () => {
      const result = errorResponse('something broke')
      expect(result).toEqual({
        status_code: 500,
        message: 'An error occurred',
        error: 'something broke',
      })
    })

    it('should use custom message and status code', () => {
      const result = errorResponse('not found', 'Resource missing', 404)
      expect(result.status_code).toBe(404)
      expect(result.message).toBe('Resource missing')
      expect(result.error).toBe('not found')
    })
  })
})

describe('pusher NotificationResultProcessor', () => {
  it('should start with empty results', () => {
    const processor = new NotificationResultProcessor()
    const [total, successful, failed] = processor.getSummary()
    expect(total).toBe(0)
    expect(successful).toBe(0)
    expect(failed).toBe(0)
  })

  it('should track successful results', () => {
    const processor = new NotificationResultProcessor()
    processor.addResult({ device_id: 'dev-1', success: true })
    processor.addResult({ device_id: 'dev-2', success: true })

    const [total, successful, failed] = processor.getSummary()
    expect(total).toBe(2)
    expect(successful).toBe(2)
    expect(failed).toBe(0)
  })

  it('should track failed results', () => {
    const processor = new NotificationResultProcessor()
    processor.addResult({ device_id: 'dev-1', success: false, error: 'timeout' })
    processor.addResult({ device_id: 'dev-2', success: false, error: 'not found' })

    const [total, successful, failed] = processor.getSummary()
    expect(total).toBe(2)
    expect(successful).toBe(0)
    expect(failed).toBe(2)
  })

  it('should track mixed results', () => {
    const processor = new NotificationResultProcessor()
    processor.addResult({ device_id: 'dev-1', success: true })
    processor.addResult({ device_id: 'dev-2', success: false, error: 'timeout' })
    processor.addResult({ device_id: 'dev-3', success: true })

    const [total, successful, failed] = processor.getSummary()
    expect(total).toBe(3)
    expect(successful).toBe(2)
    expect(failed).toBe(1)
  })

  describe('getStatusCodeAndMessage', () => {
    it('should return 200 when all succeed', () => {
      const processor = new NotificationResultProcessor()
      processor.addResult({ device_id: 'dev-1', success: true })
      processor.addResult({ device_id: 'dev-2', success: true })

      const [code, message] = processor.getStatusCodeAndMessage()
      expect(code).toBe(200)
      expect(message).toBe('All notifications sent successfully')
    })

    it('should return 500 when all fail', () => {
      const processor = new NotificationResultProcessor()
      processor.addResult({ device_id: 'dev-1', success: false, error: 'err' })
      processor.addResult({ device_id: 'dev-2', success: false, error: 'err' })

      const [code, message] = processor.getStatusCodeAndMessage()
      expect(code).toBe(500)
      expect(message).toBe('All notifications failed')
    })

    it('should return 207 for partial success', () => {
      const processor = new NotificationResultProcessor()
      processor.addResult({ device_id: 'dev-1', success: true })
      processor.addResult({ device_id: 'dev-2', success: false, error: 'err' })

      const [code, message] = processor.getStatusCodeAndMessage()
      expect(code).toBe(207)
      expect(message).toContain('1 notifications sent')
      expect(message).toContain('1 failed')
    })
  })

  describe('getResponseData', () => {
    it('should return structured response data', () => {
      const processor = new NotificationResultProcessor()
      processor.addResult({ device_id: 'dev-1', success: true })
      processor.addResult({ device_id: 'dev-2', success: false, error: 'timeout' })

      const data = processor.getResponseData()

      expect(data.summary).toEqual({ total: 2, successful: 1, failed: 1 })
      expect(data.results).toHaveLength(2)
      expect(data.results[0]).toEqual({ device_id: 'dev-1', success: true })
      expect(data.results[1]).toEqual({ device_id: 'dev-2', success: false, error: 'timeout' })
    })

    it('should omit error field from successful results', () => {
      const processor = new NotificationResultProcessor()
      processor.addResult({ device_id: 'dev-1', success: true })

      const data = processor.getResponseData()
      expect(data.results[0]).not.toHaveProperty('error')
    })
  })
})
