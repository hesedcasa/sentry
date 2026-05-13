/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('agent:auth:update', () => {
  let AgentAuthUpdate: any
  let testConnectionStub: SinonStub
  let clearClientsStub: SinonStub
  let confirmStub: SinonStub
  let fsStub: Record<string, SinonStub>
  let actionStartStub: SinonStub
  let actionStopStub: SinonStub

  const existing = {auth: {apiKey: 'old-key', apiUrl: 'https://old.example.com'}}

  beforeEach(async () => {
    testConnectionStub = stub()
    clearClientsStub = stub()
    confirmStub = stub().resolves(true)
    actionStartStub = stub()
    actionStopStub = stub()
    fsStub = {
      readJSON: stub().resolves(existing),
      writeJSON: stub().resolves(),
    }

    const imported = await esmock('../../../../src/commands/agent/auth/update.js', {
      '../../../../src/agent/agent-client.js': {
        clearClients: clearClientsStub,
        testConnection: testConnectionStub,
      },
      '@inquirer/prompts': {confirm: confirmStub, input: stub().resolves('prompted')},
      '@oclif/core/ux': {action: {start: actionStartStub, stop: actionStopStub}},
      'fs-extra': {default: fsStub},
    })
    AgentAuthUpdate = imported.default
  })

  it('writes new config when confirmed', async () => {
    testConnectionStub.resolves({data: {}, success: true})

    const cmd = new AgentAuthUpdate(['--key', 'new-key', '--url', 'https://new.example.com'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(fsStub.writeJSON.calledOnce).to.be.true
    const written = fsStub.writeJSON.firstCall.args[1]
    expect(written.auth.apiKey).to.equal('new-key')
    expect(written.auth.apiUrl).to.equal('https://new.example.com')
    expect(logStub.calledWith('Agent authentication updated successfully')).to.be.true
  })

  it('skips write when user declines confirmation', async () => {
    confirmStub.resolves(false)

    const cmd = new AgentAuthUpdate(['--key', 'new-key', '--url', 'https://new.example.com'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    expect(fsStub.writeJSON.called).to.be.false
    expect(testConnectionStub.called).to.be.false
  })

  it('logs hint when no existing config file', async () => {
    fsStub.readJSON.rejects(new Error('ENOENT: no such file or directory'))

    const cmd = new AgentAuthUpdate(['--key', 'new'], {
      configDir: '/tmp/test-agent-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(logStub.calledWith('Run agent:auth:add instead')).to.be.true
    expect(fsStub.writeJSON.called).to.be.false
  })
})
