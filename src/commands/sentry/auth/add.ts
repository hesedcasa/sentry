import {input} from '@inquirer/prompts'
import {Command, Flags} from '@oclif/core'
import {action} from '@oclif/core/ux'
import {default as fs} from 'fs-extra'
import {default as path} from 'node:path'

import {type ApiResult} from '../../../sentry/sentry-api.js'
import {clearClients, testConnection} from '../../../sentry/sentry-client.js'

export default class AuthAdd extends Command {
  static override args = {}
  static override description = 'Add Sentry authentication'
  static override enableJsonFlag = true
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    organization: Flags.string({char: 'o', description: 'Sentry organization slug:', required: !process.stdout.isTTY}),
    token: Flags.string({char: 't', description: 'Auth Token:', required: !process.stdout.isTTY}),
    url: Flags.string({
      char: 'u',
      default: 'https://sentry.io/api/0',
      description: 'Sentry base URL:',
      required: false,
    }),
  }

  public async run(): Promise<ApiResult> {
    const {flags} = await this.parse(AuthAdd)

    const authToken = flags.token ?? (await input({message: 'Auth Token:', required: true}))
    const organization = flags.organization ?? (await input({message: 'Organization slug:', required: true}))
    const host = await input({default: 'https://sentry.io/api/0', message: 'Sentry base URL:', required: true})
    const configPath = path.join(this.config.configDir, 'sentry-config.json')
    const auth = {
      auth: {
        authToken,
        host,
        organization,
      },
    }

    const exists = await fs.pathExists(configPath)

    if (!exists) {
      await fs.createFile(configPath)
    }

    await fs.writeJSON(configPath, auth, {
      mode: 0o600, // owner read/write only
    })

    action.start('Authenticating')
    const config = await fs.readJSON(configPath)
    const result = await testConnection(config.auth)
    clearClients()

    if (result.success) {
      action.stop('✓ successful')
      this.log('Authentication added successfully')
    } else {
      action.stop('✗ failed')
      this.error('Authentication is invalid. Please check your token, organization, and URL.')
    }

    return result
  }
}
