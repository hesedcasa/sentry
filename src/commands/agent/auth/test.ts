import {Command} from '@oclif/core'
import {action} from '@oclif/core/ux'

import {readAgentConfig} from '../../../agent-config.js'
import {type ApiResult} from '../../../agent/agent-api.js'
import {clearClients, testConnection} from '../../../agent/agent-client.js'

export default class AgentAuthTest extends Command {
  static override args = {}
  static override description = 'Test Claude Agent SDK authentication and connection'
  static override enableJsonFlag = true
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {}

  public async run(): Promise<ApiResult> {
    const config = await readAgentConfig(this.config.configDir, this.log.bind(this))
    if (!config) {
      return {
        error: 'Missing agent authentication config',
        success: false,
      }
    }

    action.start('Authenticating connection')
    const result = await testConnection(config.auth)
    clearClients()

    if (result.success) {
      action.stop('✓ successful')
      this.log('Successful connection to Claude')
    } else {
      action.stop('✗ failed')
      this.error('Failed to connect to Claude.')
    }

    return result
  }
}
