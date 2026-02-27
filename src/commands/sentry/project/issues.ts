import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../../config.js'
import {formatAsToon} from '../../../format.js'
import {clearClients, listProjectIssues} from '../../../sentry/sentry-client.js'

export default class ProjectIssues extends Command {
  static override args = {
    projectSlug: Args.string({description: 'Project slug', required: true}),
  }
  static override description = "List a Sentry project's issues"
  static override examples = [
    '<%= config.bin %> <%= command.id %> my-project',
    '<%= config.bin %> <%= command.id %> my-project --query "is:unresolved"',
  ]
  static override flags = {
    cursor: Flags.string({description: 'Pagination cursor', required: false}),
    query: Flags.string({description: 'Search query (e.g. "is:unresolved")', required: false}),
    'short-id-lookup': Flags.boolean({description: 'Enable short ID lookup', required: false}),
    'stats-period': Flags.string({description: 'Time period (e.g. 24h, 7d)', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ProjectIssues)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const params: Record<string, unknown> = {}
    if (flags.cursor) params.cursor = flags.cursor
    if (flags.query) params.query = flags.query
    if (flags['short-id-lookup']) params.shortIdLookup = flags['short-id-lookup']
    if (flags['stats-period']) params.statsPeriod = flags['stats-period']

    const result = await listProjectIssues(config.auth, args.projectSlug, params)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
