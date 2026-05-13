import {confirm, input} from '@inquirer/prompts'
import {Command, Flags} from '@oclif/core'
import {action} from '@oclif/core/ux'
import {default as fs} from 'fs-extra'
import {default as path} from 'node:path'

import {type ApiResult} from '../../../agent/agent-api.js'
import {clearClients, testConnection} from '../../../agent/agent-client.js'

export default class AgentAuthUpdate extends Command {
  static override args = {}
  static override description = 'Update existing Claude Agent SDK authentication'
  static override enableJsonFlag = true
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    key: Flags.string({char: 'k', description: 'Anthropic API key', required: !process.stdout.isTTY}),
    url: Flags.string({char: 'u', description: 'Anthropic API base URL', required: false}),
  }

  public async run(): Promise<ApiResult | void> {
    const {flags} = await this.parse(AgentAuthUpdate)
    const configPath = path.join(this.config.configDir, 'agent-config.json')
    let config
    try {
      config = await fs.readJSON(configPath)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.toLowerCase().includes('no such file or directory')) {
        this.log('Run agent:auth:add instead')
      } else {
        this.log(msg)
      }

      return
    }

    const apiKey =
      flags.key ?? (await input({default: config.auth.apiKey, message: 'Anthropic API Key:', prefill: 'tab', required: true}))
    const apiUrl =
      flags.url ??
      (await input({
        default: config.auth.apiUrl ?? '',
        message: 'Anthropic API base URL (optional):',
        prefill: 'tab',
        required: false,
      }))
    const answer = await confirm({message: 'Override existing config?'})

    if (!answer) {
      return
    }

    const auth = {
      auth: {
        apiKey,
        apiUrl,
      },
    }

    await fs.writeJSON(configPath, auth, {
      mode: 0o600,
    })

    action.start('Authenticating')
    config = await fs.readJSON(configPath)
    const result = await testConnection(config.auth)
    clearClients()

    if (result.success) {
      action.stop('✓ successful')
      this.log('Agent authentication updated successfully')
    } else {
      action.stop('✗ failed')
      this.error('Agent authentication is invalid. Please check your API key and URL.')
    }

    return result
  }
}
