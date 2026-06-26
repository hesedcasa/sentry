import {type ApiResult, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Flags} from '@oclif/core'

import {BaseCommand} from '../../../base-command.js'
import {type SentryConfig} from '../../../sentry/sentry-api.js'
import {clearClients, getEvent} from '../../../sentry/sentry-client.js'

export default class EventGet extends BaseCommand {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    projectSlug: Args.string({description: 'Project slug', required: true}),
    eventId: Args.string({description: 'Event ID', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Retrieve a Sentry event for a project'
  static override examples = ['<%= config.bin %> <%= command.id %> my-project abc123def456']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {args, flags} = await this.parse(EventGet)
    const pm = createProfileManager<SentryConfig>(this.config, flags.profile, 'sentry-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await getEvent(auth, args.projectSlug, args.eventId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    }

    return result
  }
}
