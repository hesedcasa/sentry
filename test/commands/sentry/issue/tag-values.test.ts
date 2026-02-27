/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('issue:tag-values', () => {
  let IssueTagValues: any
  let readConfigStub: SinonStub
  let listTagValuesStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockConfig = {
    auth: {authToken: 'test-token', host: 'https://sentry.io/api/0', organization: 'test-org'},
  }

  const mockResult = {
    data: [
      {count: 10, value: 'Chrome'},
      {count: 5, value: 'Firefox'},
    ],
    success: true,
  }

  beforeEach(async () => {
    readConfigStub = stub().resolves(mockConfig)
    listTagValuesStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../../src/commands/sentry/issue/tag-values.js', {
      '../../../../src/config.js': {readConfig: readConfigStub},
      '../../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        listTagValues: listTagValuesStub,
      },
    })
    IssueTagValues = imported.default
  })

  it('calls listTagValues with correct args and outputs JSON', async () => {
    const cmd = new IssueTagValues(['123456789', 'browser'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(listTagValuesStub.calledOnce).to.be.true
    expect(listTagValuesStub.firstCall.args[0]).to.deep.equal(mockConfig.auth)
    expect(listTagValuesStub.firstCall.args[1]).to.equal('123456789')
    expect(listTagValuesStub.firstCall.args[2]).to.equal('browser')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('passes cursor and environment flags correctly', async () => {
    const cmd = new IssueTagValues(['123456789', 'browser', '--cursor', 'abc', '--environment', 'production'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    const params = listTagValuesStub.firstCall.args[3]
    expect(params.cursor).to.equal('abc')
    expect(params.environment).to.deep.equal(['production'])
  })

  it('returns early when config is missing', async () => {
    readConfigStub.resolves(null)

    const cmd = new IssueTagValues(['123456789', 'browser'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(listTagValuesStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new IssueTagValues(['123456789', 'browser', '--toon'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(listTagValuesStub.calledOnce).to.be.true
    expect(listTagValuesStub.firstCall.args).to.deep.equal([mockConfig.auth, '123456789', 'browser', {}])
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})
