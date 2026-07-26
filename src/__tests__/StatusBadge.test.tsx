import React from 'react'
import { renderToString } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import React from 'react'
import StatusBadge from '../components/StatusBadge'

describe('StatusBadge', () => {
  const cases: Array<[string, string, string]> = [
    ['success', 'Success label', 'bg-green-100'],
    ['warning', 'Warn', 'bg-yellow-100'],
    ['error', 'Err', 'bg-red-100'],
    ['info', 'Info', 'bg-blue-100']
  ]

  cases.forEach(([status, label, expectedClass]) => {
    it(`renders ${status} with correct label and class`, () => {
      const html = renderToString(<StatusBadge status={status as any} label={label} />)
      expect(html).toContain(label)
      expect(html).toContain(expectedClass)
    })
  })
})
