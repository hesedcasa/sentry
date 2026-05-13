import {expect} from 'chai'

import {formatUsageSummary} from '../../src/agent/usage.js'

describe('formatUsageSummary', () => {
  it('returns an empty string when usage is undefined', () => {
    // eslint-disable-next-line unicorn/no-useless-undefined
    expect(formatUsageSummary(undefined)).to.equal('')
  })

  it('renders a single-line summary with rounded cost and duration', () => {
    const out = formatUsageSummary({
      costUsd: 0.012_345,
      durationMs: 4321,
      inputTokens: 1500,
      numTurns: 3,
      outputTokens: 250,
    })

    expect(out).to.equal('Tokens: 1500 in / 250 out | cost: $0.0123 | turns: 3 | duration: 4.3s')
  })

  it('handles zero values', () => {
    const out = formatUsageSummary({costUsd: 0, durationMs: 0, inputTokens: 0, numTurns: 0, outputTokens: 0})
    expect(out).to.equal('Tokens: 0 in / 0 out | cost: $0.0000 | turns: 0 | duration: 0.0s')
  })
})
