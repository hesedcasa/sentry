/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('issue:tag', () => {
  let IssueTag: any
  let readConfigStub: SinonStub
  let getTagDetailsStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockConfig = {
    auth: {authToken: 'test-token', host: 'https://sentry.io/api/0', organization: 'test-org'},
  }

  const mockResult = {data: {key: 'browser', totalValues: 42}, success: true}

  beforeEach(async () => {
    readConfigStub = stub().resolves(mockConfig)
    getTagDetailsStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../../src/commands/sentry/issue/tag.js', {
      '../../../../src/config.js': {readConfig: readConfigStub},
      '../../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        getTagDetails: getTagDetailsStub,
      },
    })
    IssueTag = imported.default
  })

  it('calls getTagDetails with correct args and outputs JSON', async () => {
    const cmd = new IssueTag(['123456789', 'browser'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(getTagDetailsStub.calledOnce).to.be.true
    expect(getTagDetailsStub.firstCall.args[0]).to.deep.equal(mockConfig.auth)
    expect(getTagDetailsStub.firstCall.args[1]).to.equal('123456789')
    expect(getTagDetailsStub.firstCall.args[2]).to.equal('browser')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('passes environment flag correctly', async () => {
    const cmd = new IssueTag(['123456789', 'browser', '--environment', 'production'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    const params = getTagDetailsStub.firstCall.args[3]
    expect(params.environment).to.deep.equal(['production'])
  })

  it('returns early when config is missing', async () => {
    readConfigStub.resolves(null)

    const cmd = new IssueTag(['123456789', 'browser'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(getTagDetailsStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new IssueTag(['123456789', 'browser', '--toon'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(getTagDetailsStub.calledOnce).to.be.true
    expect(getTagDetailsStub.firstCall.args).to.deep.equal([mockConfig.auth, '123456789', 'browser', {}])
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})
