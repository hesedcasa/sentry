import {confirm, input} from '@inquirer/prompts'
import {Command, Flags} from '@oclif/core'
import {action} from '@oclif/core/ux'
import {default as fs} from 'fs-extra'
import {default as path} from 'node:path'

import {type ApiResult} from '../../../sentry/sentry-api.js'
import {clearClients, testConnection} from '../../../sentry/sentry-client.js'

export default class AuthUpdate extends Command {
  static override args = {}
  static override description = 'Update existing authentication'
  static override enableJsonFlag = true
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    organization: Flags.string({char: 'o', description: 'Sentry organization slug', required: !process.stdout.isTTY}),
    token: Flags.string({char: 't', description: 'Auth Token', required: !process.stdout.isTTY}),
    url: Flags.string({char: 'u', description: 'Sentry base URL', required: !process.stdout.isTTY}),
  }

  public async run(): Promise<ApiResult | void> {
    const {flags} = await this.parse(AuthUpdate)
    const configPath = path.join(this.config.configDir, 'sentry-config.json')
    let config
    try {
      config = await fs.readJSON(configPath)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.toLowerCase().includes('no such file or directory')) {
        this.log('Run auth:add instead')
      } else {
        this.log(msg)
      }

      return
    }

    const authToken =
      flags.token ??
      (await input({default: config.auth.authToken, message: 'Auth Token:', prefill: 'tab', required: true}))
    const organization =
      flags.organization ??
      (await input({default: config.auth.organization, message: 'Organization slug:', prefill: 'tab', required: true}))
    const host =
      flags.url ??
      (await input({default: config.auth.host, message: 'Sentry base URL:', prefill: 'tab', required: true}))
    const answer = await confirm({message: 'Override existing config?'})

    if (!answer) {
      return
    }

    const auth = {
      auth: {
        authToken,
        host,
        organization,
      },
    }

    await fs.writeJSON(configPath, auth, {
      mode: 0o600, // owner read/write only
    })

    action.start('Authenticating')
    config = await fs.readJSON(configPath)
    const result = await testConnection(config.auth)
    clearClients()

    if (result.success) {
      action.stop('✓ successful')
      this.log('Authentication updated successfully')
    } else {
      action.stop('✗ failed')
      this.error('Authentication is invalid. Please check your token, organization, and URL.')
    }

    return result
  }
}
