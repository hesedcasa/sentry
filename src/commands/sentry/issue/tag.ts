import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../../config.js'
import {formatAsToon} from '../../../format.js'
import {clearClients, getTagDetails} from '../../../sentry/sentry-client.js'

export default class IssueTag extends Command {
  static override args = {
    issueId: Args.string({description: 'Issue ID', required: true}),
    tagKey: Args.string({description: 'Tag key (e.g. browser, url, user)', required: true}),
  }
  static override description = 'Retrieve tag details for a Sentry issue'
  static override examples = ['<%= config.bin %> <%= command.id %> 123456789 browser']
  static override flags = {
    environment: Flags.string({description: 'Filter by environment', multiple: true, required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(IssueTag)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const params: Record<string, unknown> = {}
    if (flags.environment) params.environment = flags.environment

    const result = await getTagDetails(config.auth, args.issueId, args.tagKey, params)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
