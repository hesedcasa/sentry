import {Command, Flags} from '@oclif/core'

import {readConfig} from '../../../config.js'
import {formatAsToon} from '../../../format.js'
import {clearClients, listOrgIssues} from '../../../sentry/sentry-client.js'

export default class OrgIssues extends Command {
  static override args = {}
  static override description = "List a Sentry organization's issues"
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --query "is:unresolved" --limit 50',
  ]
  static override flags = {
    cursor: Flags.string({description: 'Pagination cursor', required: false}),
    end: Flags.string({description: 'End date (ISO-8601)', required: false}),
    environment: Flags.string({description: 'Filter by environment', multiple: true, required: false}),
    limit: Flags.integer({description: 'Maximum number of results', required: false}),
    project: Flags.integer({description: 'Filter by project ID', multiple: true, required: false}),
    query: Flags.string({description: 'Search query (e.g. "is:unresolved")', required: false}),
    sort: Flags.string({description: 'Sort order', required: false}),
    start: Flags.string({description: 'Start date (ISO-8601)', required: false}),
    'stats-period': Flags.string({description: 'Time period (e.g. 24h, 7d)', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(OrgIssues)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const params: Record<string, unknown> = {}
    if (flags.cursor) params.cursor = flags.cursor
    if (flags.end) params.end = flags.end
    if (flags.environment) params.environment = flags.environment
    if (flags.limit !== undefined) params.limit = flags.limit
    if (flags.project) params.project = flags.project
    if (flags.query) params.query = flags.query
    if (flags.sort) params.sort = flags.sort
    if (flags.start) params.start = flags.start
    if (flags['stats-period']) params.statsPeriod = flags['stats-period']

    const result = await listOrgIssues(config.auth, params)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
