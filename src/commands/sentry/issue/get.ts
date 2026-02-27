import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../../config.js'
import {formatAsToon} from '../../../format.js'
import {clearClients, getIssue} from '../../../sentry/sentry-client.js'

export default class IssueGet extends Command {
  static override args = {
    issueId: Args.string({description: 'Issue ID', required: true}),
  }
  static override description = 'Retrieve a Sentry issue'
  static override examples = ['<%= config.bin %> <%= command.id %> 123456789']
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(IssueGet)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const result = await getIssue(config.auth, args.issueId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
