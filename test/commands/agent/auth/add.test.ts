/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('agent:auth:add', () => {
  let AgentAuthAdd: any
  let testConnectionStub: SinonStub
  let clearClientsStub: SinonStub
  let fsStub: Record<string, SinonStub>
  let actionStartStub: SinonStub
  let actionStopStub: SinonStub

  beforeEach(async () => {
    testConnectionStub = stub()
    clearClientsStub = stub()
    actionStartStub = stub()
    actionStopStub = stub()
    fsStub = {
      createFile: stub().resolves(),
      pathExists: stub().resolves(false),
      readJSON: stub().resolves({auth: {apiKey: 'sk-ant', apiUrl: ''}}),
      writeJSON: stub().resolves(),
    }

    const imported = await esmock('../../../../src/commands/agent/auth/add.js', {
      '../../../../src/agent/agent-client.js': {
        clearClients: clearClientsStub,
        testConnection: testConnectionStub,
      },
      '@inquirer/prompts': {input: stub().resolves('sk-ant-from-prompt')},
      '@oclif/core/ux': {action: {start: actionStartStub, stop: actionStopStub}},
      'fs-extra': {default: fsStub},
    })
    AgentAuthAdd = imported.default
  })

  it('writes config and shows success on valid auth', async () => {
    testConnectionStub.resolves({data: {apiUrl: 'default'}, success: true})

    const cmd = new AgentAuthAdd(['--key', 'sk-ant-test', '--url', 'https://api.anthropic.com'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    const result = await cmd.run()

    expect(fsStub.writeJSON.calledOnce).to.be.true
    const writtenData = fsStub.writeJSON.firstCall.args[1]
    expect(writtenData.auth.apiKey).to.equal('sk-ant-test')
    expect(writtenData.auth.apiUrl).to.equal('https://api.anthropic.com')
    expect(testConnectionStub.calledOnce).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(actionStopStub.calledWith('✓ successful')).to.be.true
    expect(logStub.calledWith('Agent authentication added successfully')).to.be.true
    expect(result.success).to.be.true
  })

  it('writes config with owner-only permissions', async () => {
    testConnectionStub.resolves({data: {}, success: true})

    const cmd = new AgentAuthAdd(['--key', 'sk-ant'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writeOptions = fsStub.writeJSON.firstCall.args[2]
    expect(writeOptions.mode).to.equal(0o600)
  })

  it('shows error on failed auth test', async () => {
    testConnectionStub.resolves({error: '401', success: false})

    const cmd = new AgentAuthAdd(['--key', 'bad-key'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')
    const errorStub = stub(cmd, 'error')

    await cmd.run()

    expect(actionStopStub.calledWith('✗ failed')).to.be.true
    expect(errorStub.calledWith('Agent authentication is invalid. Please check your API key and URL.')).to.be.true
  })
})
