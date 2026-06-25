/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('issue:get', () => {
  let IssueGet: any
  let loadAuthConfigStub: SinonStub
  let getIssueStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub
  let createProfileManagerStub: SinonStub

  const mockAuth = {
    apiToken: 'test-token',
    host: 'https://sentry.io/api/0',
    organization: 'test-org',
  }

  const mockResult = {data: {id: '123456789', status: 'unresolved', title: 'TypeError'}, success: true}

  beforeEach(async () => {
    loadAuthConfigStub = stub().resolves(mockAuth)
    getIssueStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const mockProfileManager = {
      loadAuthConfig: loadAuthConfigStub,
    }

    createProfileManagerStub = stub().returns(mockProfileManager)

    const imported = await esmock('../../../../src/commands/sentry/issue/get.js', {
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        getIssue: getIssueStub,
      },
      '@hesed/plugin-lib': {
        createProfileManager: createProfileManagerStub,
        formatAsToon: formatAsToonStub,
      },
    })
    IssueGet = imported.default
  })

  it('calls getIssue with correct args and returns result', async () => {
    const cmd = new IssueGet(['123456789'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    const result = await cmd.run()

    expect(loadAuthConfigStub.calledOnce).to.be.true
    expect(getIssueStub.calledOnce).to.be.true
    expect(getIssueStub.firstCall.args).to.deep.equal([mockAuth, '123456789'])
    expect(clearClientsStub.calledOnce).to.be.true
    expect(result).to.deep.equal(mockResult)
  })

  it('throws error when config is missing', async () => {
    loadAuthConfigStub.resolves(null)

    const cmd = new IssueGet(['123456789'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    try {
      await cmd.run()
      expect.fail('Should have thrown error')
    } catch (error: any) {
      expect(error.message).to.include('Missing authentication config.')
    }

    expect(loadAuthConfigStub.calledOnce).to.be.true
    expect(getIssueStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new IssueGet(['123456789', '--toon'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(getIssueStub.calledOnce).to.be.true
    expect(getIssueStub.firstCall.args).to.deep.equal([mockAuth, '123456789'])
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })

  it('forwards --profile flag to createProfileManager', async () => {
    const cmd = new IssueGet(['123456789', '--profile', 'work'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    await cmd.run()
    expect(createProfileManagerStub.firstCall.args[1]).to.equal('work')
  })
})
