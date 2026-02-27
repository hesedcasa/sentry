import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../../config.js'
import {formatAsToon} from '../../../format.js'
import {clearClients, debugSourceMaps} from '../../../sentry/sentry-client.js'

export default class EventSourceMaps extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    projectSlug: Args.string({description: 'Project slug', required: true}),
    eventId: Args.string({description: 'Event ID', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Debug source maps for a Sentry event'
  static override examples = ['<%= config.bin %> <%= command.id %> my-project abc123def456']
  static override flags = {
    'exception-idx': Flags.string({description: 'Exception index', required: false}),
    'frame-idx': Flags.string({description: 'Frame index', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(EventSourceMaps)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const params: Record<string, unknown> = {}
    // eslint-disable-next-line camelcase
    if (flags['exception-idx']) params.exception_idx = flags['exception-idx']
    // eslint-disable-next-line camelcase
    if (flags['frame-idx']) params.frame_idx = flags['frame-idx']

    const result = await debugSourceMaps(config.auth, args.projectSlug, args.eventId, params)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
