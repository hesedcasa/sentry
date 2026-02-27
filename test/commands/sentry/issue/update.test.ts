/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('issue:update', () => {
  let IssueUpdate: any
  let readConfigStub: SinonStub
  let updateIssueStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockConfig = {
    auth: {authToken: 'test-token', host: 'https://sentry.io/api/0', organization: 'test-org'},
  }

  const mockResult = {data: {id: '123456789', status: 'resolved'}, success: true}

  beforeEach(async () => {
    readConfigStub = stub().resolves(mockConfig)
    updateIssueStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../../src/commands/sentry/issue/update.js', {
      '../../../../src/config.js': {readConfig: readConfigStub},
      '../../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        updateIssue: updateIssueStub,
      },
    })
    IssueUpdate = imported.default
  })

  it('calls updateIssue with correct args and outputs JSON', async () => {
    const cmd = new IssueUpdate(['123456789', '--status', 'resolved'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(updateIssueStub.calledOnce).to.be.true
    expect(updateIssueStub.firstCall.args[0]).to.deep.equal(mockConfig.auth)
    expect(updateIssueStub.firstCall.args[1]).to.equal('123456789')
    expect(updateIssueStub.firstCall.args[2]).to.deep.equal({status: 'resolved'})
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('passes assigned-to flag correctly', async () => {
    const cmd = new IssueUpdate(['123456789', '--assigned-to', 'user@example.com'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(updateIssueStub.firstCall.args[2]).to.deep.equal({assignedTo: 'user@example.com'})
  })

  it('returns early when config is missing', async () => {
    readConfigStub.resolves(null)

    const cmd = new IssueUpdate(['123456789', '--status', 'resolved'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(updateIssueStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new IssueUpdate(['123456789', '--status', 'resolved', '--toon'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(updateIssueStub.calledOnce).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})
