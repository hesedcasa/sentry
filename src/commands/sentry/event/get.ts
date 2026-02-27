import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../../config.js'
import {formatAsToon} from '../../../format.js'
import {clearClients, getEvent} from '../../../sentry/sentry-client.js'

export default class EventGet extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    projectSlug: Args.string({description: 'Project slug', required: true}),
    eventId: Args.string({description: 'Event ID', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Retrieve a Sentry event for a project'
  static override examples = ['<%= config.bin %> <%= command.id %> my-project abc123def456']
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(EventGet)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const result = await getEvent(config.auth, args.projectSlug, args.eventId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
