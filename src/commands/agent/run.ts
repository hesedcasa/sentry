import {Args, Command, Flags} from '@oclif/core'

import {readAgentConfig} from '../../agent-config.js'
import {type UsageSummary} from '../../agent/agent-api.js'
import {clearClients, run} from '../../agent/agent-client.js'
import {formatUsageSummary} from '../../agent/usage.js'
import {formatAsToon} from '../../format.js'

/* eslint-disable perfectionist/sort-objects */
export default class AgentRun extends Command {
  static override args = {
    name: Args.string({description: 'Slash command (e.g. /help) or skill name', required: true}),
    input: Args.string({description: 'Additional input to forward to the agent', required: false}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Execute a slash command or skill by name'
  static override examples = [
    '<%= config.bin %> <%= command.id %> /help',
    '<%= config.bin %> <%= command.id %> review "this branch"',
    '<%= config.bin %> <%= command.id %> /clear --stream',
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
    const {args, flags} = await this.parse(AgentRun)
    const config = await readAgentConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const allowedTools = flags['allow-tools']
      ? flags['allow-tools']
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : []

    const result = await run(config.auth, args.name, args.input, {
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
