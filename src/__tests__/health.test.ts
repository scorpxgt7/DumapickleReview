import request from 'supertest'
import { describe, it, expect } from 'vitest'
import app from '../server/app'

describe('GET /api/health', () => {
  it('returns 200 and expected JSON', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('status', 'ok')
    expect(res.body).toHaveProperty('timestamp')
    const ts = new Date(res.body.timestamp)
    expect(ts.toString()).not.toBe('Invalid Date')
  })
})
