import {query, type SDKMessage} from '@anthropic-ai/claude-agent-sdk'

export interface ApiResult {
  data?: unknown
  error?: unknown
  success: boolean
}

export interface AgentConfig {
  apiKey: string
  apiUrl: string
}

export interface AskOptions {
  allowedTools?: string[]
  onText?: (text: string) => void
  onToolUse?: (toolName: string) => void
  systemPrompt?: string
}

interface AskResult {
  result: string
  toolsUsed: string[]
}

type QueryFn = typeof query

/**
 * Claude Agent SDK client. Wraps the SDK's `query()` async generator
 * and surfaces a simple ask/testConnection API consistent with the
 * project's ApiResult pattern.
 */
export class AgentApi {
  private config: AgentConfig
  private queryFn: QueryFn

  constructor(config: AgentConfig, queryFn: QueryFn = query) {
    this.config = config
    this.queryFn = queryFn
  }

  /**
   * Send a natural-language prompt to the agent and collect the full result.
   */
  async ask(prompt: string, options?: AskOptions): Promise<ApiResult> {
    try {
      const iterator = this.queryFn({
        options: {
          allowedTools: options?.allowedTools,
          env: this.buildEnv(),
          permissionMode: 'bypassPermissions',
          systemPrompt: options?.systemPrompt,
        },
        prompt,
      })

      const toolsUsed: string[] = []
      let finalText = ''
      let errorSubtype: string | undefined

      for await (const message of iterator as AsyncIterable<SDKMessage>) {
        if (message.type === 'assistant') {
          this.handleAssistantMessage(message, toolsUsed, options)
        } else if (message.type === 'result') {
          if (message.subtype === 'success') {
            finalText = message.result
          } else {
            errorSubtype = message.subtype
          }
        }
      }

      if (errorSubtype) {
        return {error: `Agent run ended with subtype: ${errorSubtype}`, success: false}
      }

      return {data: {result: finalText, toolsUsed} satisfies AskResult, success: true}
    } catch (error: unknown) {
      return {error: error instanceof Error ? error.message : String(error), success: false}
    }
  }

  /**
   * Clear client (no persistent client to dispose for the SDK wrapper).
   */
  clearClients(): void {}

  /**
   * Verify agent credentials by issuing a minimal prompt.
   */
  async testConnection(): Promise<ApiResult> {
    const result = await this.ask('Reply with exactly the word OK and nothing else.', {
      allowedTools: [],
    })

    if (!result.success) return result

    return {
      data: {apiUrl: this.config.apiUrl || 'default', reply: (result.data as AskResult).result},
      success: true,
    }
  }

  private buildEnv(): Record<string, string | undefined> {
    const env: Record<string, string | undefined> = {
      ...process.env,
      ANTHROPIC_API_KEY: this.config.apiKey,
    }
    if (this.config.apiUrl) {
      env.ANTHROPIC_BASE_URL = this.config.apiUrl
    }

    return env
  }

  private handleAssistantMessage(message: SDKMessage & {type: 'assistant'}, toolsUsed: string[], options?: AskOptions): void {
    const content = message.message?.content
    if (!Array.isArray(content)) return

    for (const block of content) {
      if (!block || typeof block !== 'object') continue

      if ('text' in block && typeof block.text === 'string') {
        options?.onText?.(block.text)
      } else if ('name' in block && typeof block.name === 'string') {
        toolsUsed.push(block.name)
        options?.onToolUse?.(block.name)
      }
    }
  }
}
