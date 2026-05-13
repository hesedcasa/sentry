/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('agent:ask', () => {
  let AgentAsk: any
  let readAgentConfigStub: SinonStub
  let askStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockConfig = {auth: {apiKey: 'sk-ant-test', apiUrl: 'https://api.anthropic.com'}}
  const mockUsage = {costUsd: 0.0123, durationMs: 4321, inputTokens: 1500, numTurns: 3, outputTokens: 250}
  const mockResult = {
    data: {result: 'The capital of France is Paris.', toolsUsed: [], usage: mockUsage},
    success: true,
  }

  beforeEach(async () => {
    readAgentConfigStub = stub().resolves(mockConfig)
    askStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../src/commands/agent/ask.js', {
      '../../../src/agent-config.js': {readAgentConfig: readAgentConfigStub},
      '../../../src/agent/agent-client.js': {ask: askStub, clearClients: clearClientsStub},
      '../../../src/format.js': {formatAsToon: formatAsToonStub},
    })
    AgentAsk = imported.default
  })

  it('calls ask with the prompt, outputs JSON, and appends token summary', async () => {
    const cmd = new AgentAsk(['What is the capital of France?'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(readAgentConfigStub.calledOnce).to.be.true
    expect(askStub.calledOnce).to.be.true
    expect(askStub.firstCall.args[0]).to.deep.equal(mockConfig.auth)
    expect(askStub.firstCall.args[1]).to.equal('What is the capital of France?')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('Tokens: 1500 in / 250 out | cost: $0.0123 | turns: 3 | duration: 4.3s')).to.be.true
  })

  it('does not log a summary line when result has no usage', async () => {
    askStub.resolves({data: {result: 'hi', toolsUsed: []}, success: true})

    const cmd = new AgentAsk(['hi'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')
    stub(cmd, 'logJson')

    await cmd.run()

    const summaryCalls = logStub.getCalls().filter((c) => String(c.args[0] ?? '').startsWith('Tokens: '))
    expect(summaryCalls).to.have.length(0)
  })

  it('returns early when config is missing', async () => {
    readAgentConfigStub.resolves(null)

    const cmd = new AgentAsk(['hi'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(askStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('parses --allow-tools into an array', async () => {
    const cmd = new AgentAsk(['list files', '--allow-tools', 'Read, Glob , Edit'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    const opts = askStub.firstCall.args[2]
    expect(opts.allowedTools).to.deep.equal(['Read', 'Glob', 'Edit'])
  })

  it('passes --system as systemPrompt', async () => {
    const cmd = new AgentAsk(['hi', '--system', 'Be brief.'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    const opts = askStub.firstCall.args[2]
    expect(opts.systemPrompt).to.equal('Be brief.')
  })

  it('wires onText callback when --stream is set', async () => {
    const cmd = new AgentAsk(['hi', '--stream'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')
    stub(cmd, 'logJson')

    await cmd.run()

    const opts = askStub.firstCall.args[2]
    expect(opts.onText).to.be.a('function')
    expect(opts.onToolUse).to.be.a('function')

    opts.onText('hello-stream')
    expect(logStub.calledWith('hello-stream')).to.be.true
    opts.onToolUse('Read')
    expect(logStub.calledWith('[tool: Read]')).to.be.true
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new AgentAsk(['hi', '--toon'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})
