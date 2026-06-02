/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('issue:events', () => {
  let IssueEvents: any
  let loadAuthConfigStub: SinonStub
  let listIssueEventsStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockAuth = {
    apiToken: 'test-token',
    host: 'https://sentry.io/api/0',
    organization: 'test-org',
  }

  const mockResult = {data: [{eventID: 'evt1'}, {eventID: 'evt2'}], success: true}

  beforeEach(async () => {
    loadAuthConfigStub = stub().resolves(mockAuth)
    listIssueEventsStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const mockProfileManager = {
      loadAuthConfig: loadAuthConfigStub,
    }

    const imported = await esmock('../../../../src/commands/sentry/issue/events.js', {
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        listIssueEvents: listIssueEventsStub,
      },
      '@hesed/plugin-lib': {
        createProfileManager: stub().returns(mockProfileManager),
        formatAsToon: formatAsToonStub,
      },
    })
    IssueEvents = imported.default
  })

  it('calls listIssueEvents with correct args and outputs JSON', async () => {
    const cmd = new IssueEvents(['123456789'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(loadAuthConfigStub.calledOnce).to.be.true
    expect(listIssueEventsStub.calledOnce).to.be.true
    expect(listIssueEventsStub.firstCall.args[0]).to.deep.equal(mockAuth)
    expect(listIssueEventsStub.firstCall.args[1]).to.equal('123456789')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('passes optional flags correctly', async () => {
    const cmd = new IssueEvents(['123456789', '--full', '--stats-period', '24h'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    const params = listIssueEventsStub.firstCall.args[2]
    expect(params.full).to.be.true
    expect(params.statsPeriod).to.equal('24h')
  })

  it('throws error when config is missing', async () => {
    loadAuthConfigStub.resolves(null)

    const cmd = new IssueEvents(['123456789'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    try {
      await cmd.run()
      expect.fail('Should have thrown error')
    } catch (error: any) {
      expect(error.message).to.include('Missing authentication config.')
    }

    expect(loadAuthConfigStub.calledOnce).to.be.true
    expect(listIssueEventsStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new IssueEvents(['123456789', '--toon'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(listIssueEventsStub.calledOnce).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})