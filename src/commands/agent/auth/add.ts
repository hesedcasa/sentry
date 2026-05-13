import {input} from '@inquirer/prompts'
import {Command, Flags} from '@oclif/core'
import {action} from '@oclif/core/ux'
import {default as fs} from 'fs-extra'
import {default as path} from 'node:path'

import {type ApiResult} from '../../../agent/agent-api.js'
import {clearClients, testConnection} from '../../../agent/agent-client.js'

export default class AgentAuthAdd extends Command {
  static override args = {}
  static override description = 'Add Claude Agent SDK authentication'
  static override enableJsonFlag = true
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    key: Flags.string({char: 'k', description: 'Anthropic API key', required: !process.stdout.isTTY}),
    url: Flags.string({char: 'u', default: '', description: 'Anthropic API base URL (blank for default)', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {flags} = await this.parse(AgentAuthAdd)

    const apiKey = flags.key ?? (await input({message: 'Anthropic API Key:', required: true}))
    const apiUrl = flags.url ?? (await input({default: '', message: 'Anthropic API base URL (optional):', required: false}))
    const configPath = path.join(this.config.configDir, 'agent-config.json')
    const auth = {
      auth: {
        apiKey,
        apiUrl,
      },
    }

    const exists = await fs.pathExists(configPath)

    if (!exists) {
      await fs.createFile(configPath)
    }

    await fs.writeJSON(configPath, auth, {
      mode: 0o600,
    })

    action.start('Authenticating')
    const config = await fs.readJSON(configPath)
    const result = await testConnection(config.auth)
    clearClients()

    if (result.success) {
      action.stop('✓ successful')
      this.log('Agent authentication added successfully')
    } else {
      action.stop('✗ failed')
      this.error('Agent authentication is invalid. Please check your API key and URL.')
    }

    return result
  }
}
