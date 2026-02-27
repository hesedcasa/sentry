/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('project:issues', () => {
  let ProjectIssues: any
  let readConfigStub: SinonStub
  let listProjectIssuesStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockConfig = {
    auth: {authToken: 'test-token', host: 'https://sentry.io/api/0', organization: 'test-org'},
  }

  const mockResult = {
    data: [
      {id: '1', title: 'TypeError'},
      {id: '2', title: 'ReferenceError'},
    ],
    success: true,
  }

  beforeEach(async () => {
    readConfigStub = stub().resolves(mockConfig)
    listProjectIssuesStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../../src/commands/sentry/project/issues.js', {
      '../../../../src/config.js': {readConfig: readConfigStub},
      '../../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        listProjectIssues: listProjectIssuesStub,
      },
    })
    ProjectIssues = imported.default
  })

  it('calls listProjectIssues with correct args and outputs JSON', async () => {
    const cmd = new ProjectIssues(['my-project'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(listProjectIssuesStub.calledOnce).to.be.true
    expect(listProjectIssuesStub.firstCall.args[0]).to.deep.equal(mockConfig.auth)
    expect(listProjectIssuesStub.firstCall.args[1]).to.equal('my-project')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('passes optional flags correctly', async () => {
    const cmd = new ProjectIssues(['my-project', '--query', 'is:unresolved', '--stats-period', '24h'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    const params = listProjectIssuesStub.firstCall.args[2]
    expect(params.query).to.equal('is:unresolved')
    expect(params.statsPeriod).to.equal('24h')
  })

  it('returns early when config is missing', async () => {
    readConfigStub.resolves(null)

    const cmd = new ProjectIssues(['my-project'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(listProjectIssuesStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new ProjectIssues(['my-project', '--toon'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(listProjectIssuesStub.calledOnce).to.be.true
    expect(listProjectIssuesStub.firstCall.args).to.deep.equal([mockConfig.auth, 'my-project', {}])
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})
