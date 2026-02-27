/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('project:events', () => {
  let ProjectEvents: any
  let readConfigStub: SinonStub
  let listProjectEventsStub: SinonStub
  let clearClientsStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockConfig = {
    auth: {authToken: 'test-token', host: 'https://sentry.io/api/0', organization: 'test-org'},
  }

  const mockResult = {data: [{eventID: 'evt1'}, {eventID: 'evt2'}], success: true}

  beforeEach(async () => {
    readConfigStub = stub().resolves(mockConfig)
    listProjectEventsStub = stub().resolves(mockResult)
    clearClientsStub = stub()
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../../src/commands/sentry/project/events.js', {
      '../../../../src/config.js': {readConfig: readConfigStub},
      '../../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        listProjectEvents: listProjectEventsStub,
      },
    })
    ProjectEvents = imported.default
  })

  it('calls listProjectEvents with correct args and outputs JSON', async () => {
    const cmd = new ProjectEvents(['my-project'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(listProjectEventsStub.calledOnce).to.be.true
    expect(listProjectEventsStub.firstCall.args[0]).to.deep.equal(mockConfig.auth)
    expect(listProjectEventsStub.firstCall.args[1]).to.equal('my-project')
    expect(clearClientsStub.calledOnce).to.be.true
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('passes optional flags correctly', async () => {
    const cmd = new ProjectEvents(['my-project', '--full', '--stats-period', '7d'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    const params = listProjectEventsStub.firstCall.args[2]
    expect(params.full).to.be.true
    expect(params.statsPeriod).to.equal('7d')
  })

  it('returns early when config is missing', async () => {
    readConfigStub.resolves(null)

    const cmd = new ProjectEvents(['my-project'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(listProjectEventsStub.called).to.be.false
    expect(clearClientsStub.called).to.be.false
    expect(logJsonStub.called).to.be.false
  })

  it('outputs TOON format when --toon flag is used', async () => {
    const cmd = new ProjectEvents(['my-project', '--toon'], {
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(listProjectEventsStub.calledOnce).to.be.true
    expect(listProjectEventsStub.firstCall.args).to.deep.equal([mockConfig.auth, 'my-project', {}])
    expect(clearClientsStub.calledOnce).to.be.true
    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })
})
