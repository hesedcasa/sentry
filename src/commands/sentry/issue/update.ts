import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../../config.js'
import {formatAsToon} from '../../../format.js'
import {clearClients, updateIssue} from '../../../sentry/sentry-client.js'

export default class IssueUpdate extends Command {
  static override args = {
    issueId: Args.string({description: 'Issue ID', required: true}),
  }
  static override description = 'Update a Sentry issue'
  static override examples = [
    '<%= config.bin %> <%= command.id %> 123456789 --status resolved',
    '<%= config.bin %> <%= command.id %> 123456789 --assigned-to user@example.com',
  ]
  static override flags = {
    'assigned-to': Flags.string({description: 'Assign to user (actor ID or username)', required: false}),
    'has-seen': Flags.boolean({allowNo: true, description: 'Mark issue as seen/unseen', required: false}),
    'is-bookmarked': Flags.boolean({allowNo: true, description: 'Bookmark or unbookmark issue', required: false}),
    'is-public': Flags.boolean({allowNo: true, description: 'Make issue public or private', required: false}),
    'is-subscribed': Flags.boolean({
      allowNo: true,
      description: 'Subscribe or unsubscribe from issue',
      required: false,
    }),
    status: Flags.string({
      description: 'Issue status (resolved, resolvedInNextRelease, unresolved, ignored)',
      options: ['resolved', 'resolvedInNextRelease', 'unresolved', 'ignored'],
      required: false,
    }),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(IssueUpdate)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const data: Record<string, unknown> = {}
    if (flags.status !== undefined) data.status = flags.status
    if (flags['assigned-to'] !== undefined) data.assignedTo = flags['assigned-to']
    if (flags['has-seen'] !== undefined) data.hasSeen = flags['has-seen']
    if (flags['is-bookmarked'] !== undefined) data.isBookmarked = flags['is-bookmarked']
    if (flags['is-subscribed'] !== undefined) data.isSubscribed = flags['is-subscribed']
    if (flags['is-public'] !== undefined) data.isPublic = flags['is-public']

    const result = await updateIssue(config.auth, args.issueId, data)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
