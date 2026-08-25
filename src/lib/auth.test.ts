import { describe, expect, it } from 'vitest'

import { safeReturnPathname } from './auth'

describe('safeReturnPathname', () => {
  it('keeps local paths and their query strings', () => {
    expect(safeReturnPathname('/chat?checkout=cancelled')).toBe(
      '/chat?checkout=cancelled',
    )
  })

  it('rejects external and protocol-relative redirects', () => {
    expect(safeReturnPathname('https://example.com')).toBe('/chat')
    expect(safeReturnPathname('//example.com')).toBe('/chat')
  })
})
