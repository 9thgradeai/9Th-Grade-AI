import { describe, it, expect, vi } from 'vitest'
import { computePercentile } from '../lib/score'

// Mock prisma
vi.mock('../app', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}))

describe('Percentile computation', () => {
  it('returns 85 when no results exist', async () => {
    const { prisma } = await import('../app')
    ;(prisma.$queryRaw as any).mockResolvedValue([{ percentile: null }])

    const result = await computePercentile('exam_1', 50)
    expect(result).toBe(85)
  })

  it('computes percentile from results', async () => {
    const { prisma } = await import('../app')
    ;(prisma.$queryRaw as any).mockResolvedValue([{ percentile: 75 }])

    const result = await computePercentile('exam_1', 80)
    expect(result).toBe(75)
  })
})
