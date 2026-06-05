import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Command, Flags} from '@oclif/core'

import {type SentryConfig} from '../../../sentry/sentry-api.js'
import {clearClients, getIssueEvent} from '../../../sentry/sentry-client.js'

export default class IssueEvent extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    issueId: Args.string({description: 'Issue ID', required: true}),
    eventId: Args.string({description: 'Event ID (latest, oldest, recommended, or event ID)', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Retrieve a specific event from a Sentry issue'
  static override examples = [
    '<%= config.bin %> <%= command.id %> 123456789 latest',
    '<%= config.bin %> <%= command.id %> 123456789 abc123def456',
  ]
  static override flags = {
    profile: Flags.string({description: 'Profile name to use', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(IssueEvent)
    const pm = createProfileManager<SentryConfig>(this.config, flags.profile)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await getIssueEvent(auth, args.issueId, args.eventId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
