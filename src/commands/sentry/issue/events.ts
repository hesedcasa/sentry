import {type ApiResult, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../../base-command.js'
import {type SentryConfig} from '../../../sentry/sentry-api.js'
import {clearClients, listIssueEvents} from '../../../sentry/sentry-client.js'

export default class IssueEvents extends BaseCommand {
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
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    start: Flags.string({description: 'Start date (ISO-8601)', required: false}),
    'stats-period': Flags.string({description: 'Time period (e.g. 24h, 7d)', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {args, flags} = await this.parse(IssueEvents)
    const pm = createProfileManager<SentryConfig>(this.config, flags.profile, 'sentry-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const params: Record<string, unknown> = {}
    if (flags.cursor) params.cursor = flags.cursor
    if (flags.end) params.end = flags.end
    if (flags.environment) params.environment = flags.environment
    if (flags.full) params.full = flags.full
    if (flags.start) params.start = flags.start
    if (flags['stats-period']) params.statsPeriod = flags['stats-period']

    const result = await listIssueEvents(auth, args.issueId, params)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    }

    return result
  }
}
