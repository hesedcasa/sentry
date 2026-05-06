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
    profile: Flags.string({char: 'p', default: 'default', description: 'Profile name', required: false}),
    token: Flags.string({char: 't', description: 'Auth Token', required: !process.stdout.isTTY}),
    url: Flags.string({char: 'u', description: 'Sentry base URL', required: !process.stdout.isTTY}),
  }

  public async run(): Promise<ApiResult | void> {
    const {flags} = await this.parse(AuthUpdate)
    const profileName = flags.profile
    const configPath = path.join(this.config.configDir, 'sentry-config.json')

    let raw: Record<string, unknown>
    try {
      raw = await fs.readJSON(configPath)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.toLowerCase().includes('no such file or directory')) {
        this.log('Run auth:add instead')
      } else {
        this.log(msg)
      }

      return
    }

    let currentProfile: Record<string, unknown> | undefined
    let existingProfiles: Record<string, unknown> = {}

    if (raw.profiles) {
      existingProfiles = raw.profiles as Record<string, unknown>
      currentProfile = existingProfiles[profileName] as Record<string, unknown> | undefined
    } else if (raw.auth && profileName === 'default') {
      currentProfile = raw.auth as Record<string, unknown>
    }

    if (!currentProfile) {
      this.log(`Profile '${profileName}' not found. Run auth:add instead`)
      return
    }

    const authToken =
      flags.token ??
      (await input({default: currentProfile.authToken as string, message: 'Auth Token:', prefill: 'tab', required: true}))
    const organization =
      flags.organization ??
      (await input({default: currentProfile.organization as string, message: 'Organization slug:', prefill: 'tab', required: true}))
    const host =
      flags.url ??
      (await input({default: currentProfile.host as string, message: 'Sentry base URL:', prefill: 'tab', required: true}))
    const answer = await confirm({message: 'Override existing config?'})

    if (!answer) {
      return
    }

    const profileData = {
      authToken,
      host,
      organization,
    }
    const config = {profiles: {...existingProfiles, [profileName]: profileData}}

    await fs.writeJSON(configPath, config, {
      mode: 0o600,
    })

    action.start('Authenticating')
    const result = await testConnection(profileData)
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
