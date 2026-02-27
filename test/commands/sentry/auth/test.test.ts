/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('auth:test', () => {
  let AuthTest: any
  let readConfigStub: SinonStub
  let testConnectionStub: SinonStub
  let clearClientsStub: SinonStub
  let actionStartStub: SinonStub
  let actionStopStub: SinonStub

  const mockConfig = {
    auth: {authToken: 'test-token', host: 'https://sentry.io/api/0', organization: 'test-org'},
  }

  beforeEach(async () => {
    readConfigStub = stub().resolves(mockConfig)
    testConnectionStub = stub()
    clearClientsStub = stub()
    actionStartStub = stub()
    actionStopStub = stub()

    const imported = await esmock('../../../../src/commands/sentry/auth/test.js', {
      '../../../../src/config.js': {readConfig: readConfigStub},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        testConnection: testConnectionStub,
      },
      '@oclif/core/ux': {action: {start: actionStartStub, stop: actionStopStub}},
    })
    AuthTest = imported.default
  })

  it('shows success on valid connection', async () => {
    testConnectionStub.resolves({data: {organization: 'test-org'}, success: true})

    const cmd = new AuthTest([], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    const result = await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(testConnectionStub.calledWith(mockConfig.auth)).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(actionStopStub.calledWith('✓ successful')).to.be.true
    expect(logStub.calledWith('Successful connection to Sentry')).to.be.true
    expect(result.success).to.be.true
  })

  it('shows error on failed connection', async () => {
    testConnectionStub.resolves({error: 'Unauthorized', success: false})

    const cmd = new AuthTest([], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')
    const errorStub = stub(cmd, 'error')

    await cmd.run()

    expect(actionStopStub.calledWith('✗ failed')).to.be.true
    expect(errorStub.calledWith('Failed to connect to Sentry.')).to.be.true
  })

  it('returns error result when config is missing', async () => {
    readConfigStub.resolves(null)

    const cmd = new AuthTest([], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    const result = await cmd.run()

    expect(result.success).to.be.false
    expect(result.error).to.equal('Missing authentication config')
    expect(testConnectionStub.called).to.be.false
  })
})
