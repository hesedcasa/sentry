/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('agent:auth:test', () => {
  let AgentAuthTest: any
  let readAgentConfigStub: SinonStub
  let testConnectionStub: SinonStub
  let clearClientsStub: SinonStub
  let actionStartStub: SinonStub
  let actionStopStub: SinonStub

  const mockConfig = {auth: {apiKey: 'sk-ant-test', apiUrl: 'https://api.anthropic.com'}}

  beforeEach(async () => {
    readAgentConfigStub = stub().resolves(mockConfig)
    testConnectionStub = stub()
    clearClientsStub = stub()
    actionStartStub = stub()
    actionStopStub = stub()

    const imported = await esmock('../../../../src/commands/agent/auth/test.js', {
      '../../../../src/agent-config.js': {readAgentConfig: readAgentConfigStub},
      '../../../../src/agent/agent-client.js': {
        clearClients: clearClientsStub,
        testConnection: testConnectionStub,
      },
      '@oclif/core/ux': {action: {start: actionStartStub, stop: actionStopStub}},
    })
    AgentAuthTest = imported.default
  })

  it('shows success on valid connection', async () => {
    testConnectionStub.resolves({data: {reply: 'OK'}, success: true})

    const cmd = new AgentAuthTest([], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    const result = await cmd.run()

    expect(readAgentConfigStub.calledOnce).to.be.true
    expect(testConnectionStub.calledWith(mockConfig.auth)).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(actionStopStub.calledWith('✓ successful')).to.be.true
    expect(logStub.calledWith('Successful connection to Claude')).to.be.true
    expect(result.success).to.be.true
  })

  it('shows error on failed connection', async () => {
    testConnectionStub.resolves({error: '401', success: false})

    const cmd = new AgentAuthTest([], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')
    const errorStub = stub(cmd, 'error')

    await cmd.run()

    expect(actionStopStub.calledWith('✗ failed')).to.be.true
    expect(errorStub.calledWith('Failed to connect to Claude.')).to.be.true
  })

  it('returns error result when config is missing', async () => {
    readAgentConfigStub.resolves(null)

    const cmd = new AgentAuthTest([], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    const result = await cmd.run()

    expect(result.success).to.be.false
    expect(result.error).to.equal('Missing agent authentication config')
    expect(testConnectionStub.called).to.be.false
  })
})
