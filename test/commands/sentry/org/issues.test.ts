/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('org:issues', () => {
  let OrgIssues: any
  let loadAuthConfigStub: SinonStub
  let listOrgIssuesStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockAuth = {
    apiToken: 'test-token',
    host: 'https://sentry.io/api/0',
    organization: 'test-org',
  }

  const mockResult = {
    data: [
      {id: '1', title: 'Error A'},
      {id: '2', title: 'Error B'},
    ],
    success: true,
  }

  beforeEach(async () => {
    loadAuthConfigStub = stub().resolves(mockAuth)
    listOrgIssuesStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const mockProfileManager = {
      loadAuthConfig: loadAuthConfigStub,
    }

    const imported = await esmock('../../../../src/commands/sentry/org/issues.js', {
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        listOrgIssues: listOrgIssuesStub,
      },
      '@hesed/plugin-lib': {
        createProfileManager: stub().returns(mockProfileManager),
        formatAsToon: formatAsToonStub,
      },
    })
    OrgIssues = imported.default
  })

  it('calls listOrgIssues with correct args and outputs JSON', async () => {
    const cmd = new OrgIssues([], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(loadAuthConfigStub.calledOnce).to.be.true
    expect(listOrgIssuesStub.calledOnce).to.be.true
    expect(listOrgIssuesStub.firstCall.args[0]).to.deep.equal(mockAuth)
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('passes optional flags correctly', async () => {
    const cmd = new OrgIssues(['--query', 'is:unresolved', '--limit', '25'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(listOrgIssuesStub.calledOnce).to.be.true
    const params = listOrgIssuesStub.firstCall.args[1]
    expect(params.query).to.equal('is:unresolved')
    expect(params.limit).to.equal(25)
  })

  it('throws error when config is missing', async () => {
    loadAuthConfigStub.resolves(null)

    const cmd = new OrgIssues([], {
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
    expect(listOrgIssuesStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new OrgIssues(['--toon'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(listOrgIssuesStub.calledOnce).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})