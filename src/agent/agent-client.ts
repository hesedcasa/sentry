import {AgentApi, type AgentConfig, type ApiResult, type AskOptions} from './agent-api.js'

let agentApi: AgentApi | null = null

function initAgent(config: AgentConfig): AgentApi {
  if (!agentApi) {
    agentApi = new AgentApi(config)
  }

  return agentApi
}

export function clearClients(): void {
  if (agentApi) {
    agentApi.clearClients()
    agentApi = null
  }
}

export async function ask(config: AgentConfig, prompt: string, options?: AskOptions): Promise<ApiResult> {
  const api = initAgent(config)
  return api.ask(prompt, options)
}

export async function list(config: AgentConfig): Promise<ApiResult> {
  const api = initAgent(config)
  return api.list()
}

export async function testConnection(config: AgentConfig): Promise<ApiResult> {
  const api = initAgent(config)
  return api.testConnection()
}
