import { describe, expect, it } from 'vitest'

import { SYSTEM_PROMPT } from './office-hours'

describe('office-hours prompt', () => {
  it('preserves the core interrogation protocol', () => {
    expect(SYSTEM_PROMPT).toContain('Ask exactly one question at a time')
    expect(SYSTEM_PROMPT).toContain('Never invent market sizes')
    expect(SYSTEM_PROMPT).toContain('use web search only after you understand')
    expect(SYSTEM_PROMPT).toContain('TARGET DISPOSITION:')
    expect(SYSTEM_PROMPT).toContain('one experiment with a time limit')
  })

  it('keeps the personality direct without becoming hostile', () => {
    expect(SYSTEM_PROMPT).toContain('blunt but fair')
    expect(SYSTEM_PROMPT).toContain('Never become cruel')
  })
})
