import {default as fs} from 'fs-extra'
import {default as path} from 'node:path'

interface AgentAuthConfig {
  apiKey: string
  apiUrl: string
}

interface AgentConfigFile {
  auth: AgentAuthConfig
}

export async function readAgentConfig(
  configDir: string,
  log: (message: string) => void,
): Promise<AgentConfigFile | undefined> {
  const configPath = path.join(configDir, 'agent-config.json')

  try {
    return await fs.readJSON(configPath)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.toLowerCase().includes('no such file or directory')) {
      log('Missing agent authentication config')
    } else {
      log(msg)
    }

    return undefined
  }
}
