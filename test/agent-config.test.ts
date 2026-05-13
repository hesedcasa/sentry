import {expect} from 'chai'
import fs from 'fs-extra'
import path from 'node:path'

import {readAgentConfig} from '../src/agent-config.js'

describe('agent-config', () => {
  const testConfigDir = path.join(process.cwd(), 'test-agent-config')
  const testConfigPath = path.join(testConfigDir, 'agent-config.json')

  beforeEach(async () => {
    await fs.ensureDir(testConfigDir)
  })

  afterEach(async () => {
    await fs.remove(testConfigDir)
  })

  it('reads config file when it exists', async () => {
    const testConfig = {auth: {apiKey: 'sk-ant-test', apiUrl: 'https://api.anthropic.com'}}
    await fs.writeJSON(testConfigPath, testConfig)

    const logs: string[] = []
    const result = await readAgentConfig(testConfigDir, (msg) => logs.push(msg))

    expect(result).to.deep.equal(testConfig)
    expect(logs).to.be.empty
  })

  it('returns undefined and logs "Missing" when file does not exist', async () => {
    const logs: string[] = []
    const result = await readAgentConfig(testConfigDir, (msg) => logs.push(msg))

    expect(result).to.be.undefined
    expect(logs).to.include('Missing agent authentication config')
  })

  it('logs actual error message for invalid JSON', async () => {
    await fs.writeFile(testConfigPath, 'not-json {')

    const logs: string[] = []
    const result = await readAgentConfig(testConfigDir, (msg) => logs.push(msg))

    expect(result).to.be.undefined
    expect(logs).to.have.length(1)
    expect(logs[0]).to.not.include('Missing agent authentication config')
  })
})
