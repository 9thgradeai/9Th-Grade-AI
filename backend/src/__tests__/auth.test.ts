import { describe, it, expect } from 'vitest'

describe('Authentication', () => {
  it('signs and verifies a token', async () => {
    const mod = await import('../middleware/auth')
    const token = mod.signToken({ userId: 'user_1', email: 'test@example.com' })
    const payload = mod.verifyToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.userId).toBe('user_1')
    expect(payload?.email).toBe('test@example.com')
  })

  it('rejects an invalid token', async () => {
    const mod = await import('../middleware/auth')
    const payload = mod.verifyToken('invalid.token.here')
    expect(payload).toBeNull()
  })

  it('hashes a token deterministically', async () => {
    const mod = await import('../middleware/auth')
    const hash1 = mod.hashToken('mytoken')
    const hash2 = mod.hashToken('mytoken')
    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe('mytoken')
  })
})
