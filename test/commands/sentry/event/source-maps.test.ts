/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('event:source-maps', () => {
  let EventSourceMaps: any
  let readConfigStub: SinonStub
  let debugSourceMapsStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockConfig = {
    auth: {authToken: 'test-token', host: 'https://sentry.io/api/0', organization: 'test-org'},
  }

  const mockResult = {data: {errors: [], exceptions: []}, success: true}

  beforeEach(async () => {
    readConfigStub = stub().resolves(mockConfig)
    debugSourceMapsStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../../src/commands/sentry/event/source-maps.js', {
      '../../../../src/config.js': {readConfig: readConfigStub},
      '../../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        debugSourceMaps: debugSourceMapsStub,
      },
    })
    EventSourceMaps = imported.default
  })

  it('calls debugSourceMaps with correct args and outputs JSON', async () => {
    const cmd = new EventSourceMaps(['my-project', 'abc123def456'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(debugSourceMapsStub.calledOnce).to.be.true
    expect(debugSourceMapsStub.firstCall.args[0]).to.deep.equal(mockConfig.auth)
    expect(debugSourceMapsStub.firstCall.args[1]).to.equal('my-project')
    expect(debugSourceMapsStub.firstCall.args[2]).to.equal('abc123def456')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('passes exception-idx and frame-idx flags correctly', async () => {
    const cmd = new EventSourceMaps(['my-project', 'abc123', '--exception-idx', '0', '--frame-idx', '2'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    const params = debugSourceMapsStub.firstCall.args[3]
    expect(params.exception_idx).to.equal('0')
    expect(params.frame_idx).to.equal('2')
  })

  it('returns early when config is missing', async () => {
    readConfigStub.resolves(null)

    const cmd = new EventSourceMaps(['my-project', 'abc123def456'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(debugSourceMapsStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new EventSourceMaps(['my-project', 'abc123def456', '--toon'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(debugSourceMapsStub.calledOnce).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})
