/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('issue:hashes', () => {
  let IssueHashes: any
  let loadAuthConfigStub: SinonStub
  let listIssueHashesStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub
  let createProfileManagerStub: SinonStub

  const mockAuth = {
    apiToken: 'test-token',
    host: 'https://sentry.io/api/0',
    organization: 'test-org',
  }

  const mockResult = {data: [{id: 'hash1'}, {id: 'hash2'}], success: true}

  beforeEach(async () => {
    loadAuthConfigStub = stub().resolves(mockAuth)
    listIssueHashesStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const mockProfileManager = {
      loadAuthConfig: loadAuthConfigStub,
    }

    createProfileManagerStub = stub().returns(mockProfileManager)

    const imported = await esmock('../../../../src/commands/sentry/issue/hashes.js', {
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        listIssueHashes: listIssueHashesStub,
      },
      '@hesed/plugin-lib': {
        createProfileManager: createProfileManagerStub,
        formatAsToon: formatAsToonStub,
      },
    })
    IssueHashes = imported.default
  })

  it('calls listIssueHashes with correct args and outputs JSON', async () => {
    const cmd = new IssueHashes(['123456789'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(loadAuthConfigStub.calledOnce).to.be.true
    expect(listIssueHashesStub.calledOnce).to.be.true
    expect(listIssueHashesStub.firstCall.args[0]).to.deep.equal(mockAuth)
    expect(listIssueHashesStub.firstCall.args[1]).to.equal('123456789')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('passes cursor flag correctly', async () => {
    const cmd = new IssueHashes(['123456789', '--cursor', 'abc123'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    const params = listIssueHashesStub.firstCall.args[2]
    expect(params.cursor).to.equal('abc123')
  })

  it('throws error when config is missing', async () => {
    loadAuthConfigStub.resolves(null)

    const cmd = new IssueHashes(['123456789'], {
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
    expect(listIssueHashesStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new IssueHashes(['123456789', '--toon'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(listIssueHashesStub.calledOnce).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })

  it('forwards --profile flag to createProfileManager', async () => {
    const cmd = new IssueHashes(['123456789', '--profile', 'work'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')
    await cmd.run()
    expect(createProfileManagerStub.firstCall.args[1]).to.equal('work')
  })
})
