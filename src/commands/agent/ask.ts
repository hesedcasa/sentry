import {Args, Command, Flags} from '@oclif/core'

import {readAgentConfig} from '../../agent-config.js'
import {type UsageSummary} from '../../agent/agent-api.js'
import {ask, clearClients} from '../../agent/agent-client.js'
import {formatUsageSummary} from '../../agent/usage.js'
import {formatAsToon} from '../../format.js'

export default class AgentAsk extends Command {
  static override args = {
    prompt: Args.string({description: 'Natural-language prompt to send to the agent', required: true}),
  }
  static override description = 'Ask the Claude agent a natural-language question'
  static override examples = [
    '<%= config.bin %> <%= command.id %> "What is the capital of France?"',
    '<%= config.bin %> <%= command.id %> "List files in src" --allow-tools Read,Glob',
  ]
  static override flags = {
    'allow-tools': Flags.string({
      description: 'Comma-separated list of tools the agent may use (e.g. Read,Edit,Glob)',
      required: false,
    }),
    stream: Flags.boolean({description: 'Stream assistant text as it arrives', required: false}),
    system: Flags.string({description: 'Custom system prompt for the agent', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(AgentAsk)
    const config = await readAgentConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const allowedTools = flags['allow-tools']
      ? flags['allow-tools']
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : []

    const result = await ask(config.auth, args.prompt, {
      allowedTools,
      onText: flags.stream ? (text) => this.log(text) : undefined,
      onToolUse: flags.stream ? (name) => this.log(`[tool: ${name}]`) : undefined,
      systemPrompt: flags.system,
    })
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }

    const usage = (result.data as undefined | {usage?: UsageSummary})?.usage
    const summary = formatUsageSummary(usage)
    if (summary) this.log(summary)
  }
}
