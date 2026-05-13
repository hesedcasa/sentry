/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('agent:list', () => {
  let AgentList: any
  let readAgentConfigStub: SinonStub
  let listStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockConfig = {auth: {apiKey: 'sk-ant-test', apiUrl: 'https://api.anthropic.com'}}
  const mockData = {
    agents: ['code-reviewer'],
    commands: ['help', 'clear'],
    mcpServers: [{name: 'github', status: 'connected'}],
    skills: ['init', 'review'],
    tools: ['Read', 'Edit'],
  }
  const mockResult = {data: mockData, success: true}

  beforeEach(async () => {
    readAgentConfigStub = stub().resolves(mockConfig)
    listStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../src/commands/agent/list.js', {
      '../../../src/agent-config.js': {readAgentConfig: readAgentConfigStub},
      '../../../src/agent/agent-client.js': {clearClients: clearClientsStub, list: listStub},
      '../../../src/format.js': {formatAsToon: formatAsToonStub},
    })
    AgentList = imported.default
  })

  it('lists all categories by default and outputs JSON', async () => {
    const cmd = new AgentList([], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readAgentConfigStub.calledOnce).to.be.true
    expect(listStub.calledOnceWith(mockConfig.auth)).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('returns early when config is missing', async () => {
    readAgentConfigStub.resolves(null)

    const cmd = new AgentList([], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(listStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('--only filters to requested keys', async () => {
    const cmd = new AgentList(['--only', 'skills,commands'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    const output = logJsonStub.firstCall.args[0]
    expect(output).to.deep.equal({
      data: {commands: ['help', 'clear'], skills: ['init', 'review']},
      success: true,
    })
  })

  it('--only with unknown key returns full result', async () => {
    const cmd = new AgentList(['--only', 'bogus'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('does not filter when result is unsuccessful', async () => {
    listStub.resolves({error: 'boom', success: false})

    const cmd = new AgentList(['--only', 'skills'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(logJsonStub.firstCall.args[0]).to.deep.equal({error: 'boom', success: false})
  })

  it('outputs TOON format when --toon is used', async () => {
    const cmd = new AgentList(['--toon'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(formatAsToonStub.calledOnce).to.be.true
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})
