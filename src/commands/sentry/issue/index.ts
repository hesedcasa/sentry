import {type ApiResult, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../../base-command.js'
import {type SentryConfig} from '../../../sentry/sentry-api.js'
import {clearClients, getIssue} from '../../../sentry/sentry-client.js'

export default class IssueGet extends BaseCommand {
  static override args = {
    issueId: Args.string({description: 'Issue ID', required: true}),
  }
  static override description = 'Retrieve a Sentry issue'
  static override examples = ['<%= config.bin %> <%= command.id %> 123456789']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {args, flags} = await this.parse(IssueGet)
    const pm = createProfileManager<SentryConfig>(this.config, flags.profile, 'sentry-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await getIssue(auth, args.issueId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    }

    return result
  }
}
