/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('project:issues', () => {
  let ProjectIssues: any
  let loadAuthConfigStub: SinonStub
  let listProjectIssuesStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub
  let createProfileManagerStub: SinonStub

  const mockAuth = {
    apiToken: 'test-token',
    host: 'https://sentry.io/api/0',
    organization: 'test-org',
  }

  const mockResult = {
    data: [
      {id: '1', title: 'TypeError'},
      {id: '2', title: 'ReferenceError'},
    ],
    success: true,
  }

  beforeEach(async () => {
    loadAuthConfigStub = stub().resolves(mockAuth)
    listProjectIssuesStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const mockProfileManager = {
      loadAuthConfig: loadAuthConfigStub,
    }

    createProfileManagerStub = stub().returns(mockProfileManager)

    const imported = await esmock('../../../../src/commands/sentry/project/issues.js', {
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        listProjectIssues: listProjectIssuesStub,
      },
      '@hesed/plugin-lib': {
        createProfileManager: createProfileManagerStub,
        formatAsToon: formatAsToonStub,
      },
    })
    ProjectIssues = imported.default
  })

  it('calls listProjectIssues with correct args and returns result', async () => {
    const cmd = new ProjectIssues(['my-project'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    const result = await cmd.run()

    expect(loadAuthConfigStub.calledOnce).to.be.true
    expect(listProjectIssuesStub.calledOnce).to.be.true
    expect(listProjectIssuesStub.firstCall.args[0]).to.deep.equal(mockAuth)
    expect(listProjectIssuesStub.firstCall.args[1]).to.equal('my-project')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(result).to.deep.equal(mockResult)
  })

  it('passes optional flags correctly', async () => {
    const cmd = new ProjectIssues(['my-project', '--query', 'is:unresolved', '--stats-period', '24h'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    await cmd.run()

    const params = listProjectIssuesStub.firstCall.args[2]
    expect(params.query).to.equal('is:unresolved')
    expect(params.statsPeriod).to.equal('24h')
  })

  it('throws error when config is missing', async () => {
    loadAuthConfigStub.resolves(null)

    const cmd = new ProjectIssues(['my-project'], {
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
    expect(listProjectIssuesStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new ProjectIssues(['my-project', '--toon'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(listProjectIssuesStub.calledOnce).to.be.true
    expect(listProjectIssuesStub.firstCall.args).to.deep.equal([mockAuth, 'my-project', {}])
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })

  it('forwards --profile flag to createProfileManager', async () => {
    const cmd = new ProjectIssues(['my-project', '--profile', 'work'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    await cmd.run()
    expect(createProfileManagerStub.firstCall.args[1]).to.equal('work')
  })
})
