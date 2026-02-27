import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../../config.js'
import {formatAsToon} from '../../../format.js'
import {clearClients, listIssueEvents} from '../../../sentry/sentry-client.js'

export default class IssueEvents extends Command {
  static override args = {
    issueId: Args.string({description: 'Issue ID', required: true}),
  }
  static override description = "List a Sentry issue's events"
  static override examples = ['<%= config.bin %> <%= command.id %> 123456789']
  static override flags = {
    cursor: Flags.string({description: 'Pagination cursor', required: false}),
    end: Flags.string({description: 'End date (ISO-8601)', required: false}),
    environment: Flags.string({description: 'Filter by environment', multiple: true, required: false}),
    full: Flags.boolean({description: 'Include full event body', required: false}),
    start: Flags.string({description: 'Start date (ISO-8601)', required: false}),
    'stats-period': Flags.string({description: 'Time period (e.g. 24h, 7d)', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(IssueEvents)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const params: Record<string, unknown> = {}
    if (flags.cursor) params.cursor = flags.cursor
    if (flags.end) params.end = flags.end
    if (flags.environment) params.environment = flags.environment
    if (flags.full) params.full = flags.full
    if (flags.start) params.start = flags.start
    if (flags['stats-period']) params.statsPeriod = flags['stats-period']

    const result = await listIssueEvents(config.auth, args.issueId, params)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
