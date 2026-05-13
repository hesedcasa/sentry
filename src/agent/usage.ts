import {type UsageSummary} from './agent-api.js'

export function formatUsageSummary(usage: undefined | UsageSummary): string {
  if (!usage) return ''

  const cost = usage.costUsd.toFixed(4)
  const seconds = (usage.durationMs / 1000).toFixed(1)

  return `Tokens: ${usage.inputTokens} in / ${usage.outputTokens} out | cost: $${cost} | turns: ${usage.numTurns} | duration: ${seconds}s`
}
