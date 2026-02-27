import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../../config.js'
import {formatAsToon} from '../../../format.js'
import {clearClients, listIssueHashes} from '../../../sentry/sentry-client.js'

export default class IssueHashes extends Command {
  static override args = {
    issueId: Args.string({description: 'Issue ID', required: true}),
  }
  static override description = "List a Sentry issue's hashes"
  static override examples = ['<%= config.bin %> <%= command.id %> 123456789']
  static override flags = {
    cursor: Flags.string({description: 'Pagination cursor', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(IssueHashes)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const params: Record<string, unknown> = {}
    if (flags.cursor) params.cursor = flags.cursor

    const result = await listIssueHashes(config.auth, args.issueId, params)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
