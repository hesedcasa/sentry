/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('sentry-client', () => {
  const mockConfig = {
    authToken: 'test-token',
    host: 'https://sentry.io/api/0',
    organization: 'test-org',
  }
  const mockResult = {data: {test: true}, success: true}
  let clearClients: any
  let testConnectionFn: any
  let listOrgIssuesFn: any
  let getIssueFn: any
  let updateIssueFn: any
  let listIssueEventsFn: any
  let getIssueEventFn: any
  let listIssueHashesFn: any
  let getTagDetailsFn: any
  let listTagValuesFn: any
  let listProjectEventsFn: any
  let listProjectIssuesFn: any
  let getEventFn: any
  let debugSourceMapsFn: any

  let mockApiInstance: Record<string, SinonStub>
  let SentryApiStub: SinonStub

  beforeEach(async () => {
    mockApiInstance = {
      clearClients: stub(),
      debugSourceMaps: stub().resolves(mockResult),
      getEvent: stub().resolves(mockResult),
      getIssue: stub().resolves(mockResult),
      getIssueEvent: stub().resolves(mockResult),
      getTagDetails: stub().resolves(mockResult),
      listIssueEvents: stub().resolves(mockResult),
      listIssueHashes: stub().resolves(mockResult),
      listOrgIssues: stub().resolves(mockResult),
      listProjectEvents: stub().resolves(mockResult),
      listProjectIssues: stub().resolves(mockResult),
      listTagValues: stub().resolves(mockResult),
      testConnection: stub().resolves(mockResult),
      updateIssue: stub().resolves(mockResult),
    }
    SentryApiStub = stub().returns(mockApiInstance)

    const mod = await esmock('../../src/sentry/sentry-client.js', {
      '../../src/sentry/sentry-api.js': {SentryApi: SentryApiStub},
    })

    clearClients = mod.clearClients
    testConnectionFn = mod.testConnection
    listOrgIssuesFn = mod.listOrgIssues
    getIssueFn = mod.getIssue
    updateIssueFn = mod.updateIssue
    listIssueEventsFn = mod.listIssueEvents
    getIssueEventFn = mod.getIssueEvent
    listIssueHashesFn = mod.listIssueHashes
    getTagDetailsFn = mod.getTagDetails
    listTagValuesFn = mod.listTagValues
    listProjectEventsFn = mod.listProjectEvents
    listProjectIssuesFn = mod.listProjectIssues
    getEventFn = mod.getEvent
    debugSourceMapsFn = mod.debugSourceMaps
  })

  afterEach(() => {
    clearClients()
  })

  it('clearClients does not throw', () => {
    expect(() => clearClients()).to.not.throw()
  })

  describe('singleton pattern', () => {
    it('reuses the same SentryApi instance on subsequent calls', async () => {
      await testConnectionFn(mockConfig)
      await testConnectionFn(mockConfig)

      expect(SentryApiStub.calledOnce).to.be.true
    })

    it('creates a new instance after clearClients', async () => {
      await testConnectionFn(mockConfig)
      clearClients()
      await testConnectionFn(mockConfig)

      expect(SentryApiStub.calledTwice).to.be.true
    })
  })

  describe('testConnection', () => {
    it('delegates to SentryApi.testConnection', async () => {
      const result = await testConnectionFn(mockConfig)
      expect(mockApiInstance.testConnection.calledOnce).to.be.true
      expect(result).to.deep.equal(mockResult)
    })
  })

  describe('listOrgIssues', () => {
    it('delegates with params', async () => {
      const params = {limit: 10, query: 'is:unresolved'}
      await listOrgIssuesFn(mockConfig, params)
      expect(mockApiInstance.listOrgIssues.calledWith(params)).to.be.true
    })

    it('delegates with no params', async () => {
      await listOrgIssuesFn(mockConfig)
      expect(mockApiInstance.listOrgIssues.calledOnce).to.be.true
      expect(mockApiInstance.listOrgIssues.firstCall.args[0]).to.be.undefined
    })
  })

  describe('getIssue', () => {
    it('delegates with issueId', async () => {
      await getIssueFn(mockConfig, '123')
      expect(mockApiInstance.getIssue.calledWith('123')).to.be.true
    })
  })

  describe('updateIssue', () => {
    it('delegates with issueId and data', async () => {
      const data = {status: 'resolved'}
      await updateIssueFn(mockConfig, '123', data)
      expect(mockApiInstance.updateIssue.calledWith('123', data)).to.be.true
    })
  })

  describe('listIssueEvents', () => {
    it('delegates with issueId and params', async () => {
      const params = {full: true, statsPeriod: '24h'}
      await listIssueEventsFn(mockConfig, '123', params)
      expect(mockApiInstance.listIssueEvents.calledWith('123', params)).to.be.true
    })
  })

  describe('getIssueEvent', () => {
    it('delegates with issueId and eventId', async () => {
      await getIssueEventFn(mockConfig, '123', 'latest')
      expect(mockApiInstance.getIssueEvent.calledWith('123', 'latest')).to.be.true
    })
  })

  describe('listIssueHashes', () => {
    it('delegates with issueId and params', async () => {
      const params = {cursor: 'abc'}
      await listIssueHashesFn(mockConfig, '123', params)
      expect(mockApiInstance.listIssueHashes.calledWith('123', params)).to.be.true
    })
  })

  describe('getTagDetails', () => {
    it('delegates with issueId, tagKey, and params', async () => {
      const params = {environment: ['production']}
      await getTagDetailsFn(mockConfig, '123', 'browser', params)
      expect(mockApiInstance.getTagDetails.calledWith('123', 'browser', params)).to.be.true
    })
  })

  describe('listTagValues', () => {
    it('delegates with issueId, tagKey, and params', async () => {
      const params = {cursor: 'abc'}
      await listTagValuesFn(mockConfig, '123', 'browser', params)
      expect(mockApiInstance.listTagValues.calledWith('123', 'browser', params)).to.be.true
    })
  })

  describe('listProjectEvents', () => {
    it('delegates with projectSlug and params', async () => {
      const params = {full: true, statsPeriod: '7d'}
      await listProjectEventsFn(mockConfig, 'my-project', params)
      expect(mockApiInstance.listProjectEvents.calledWith('my-project', params)).to.be.true
    })
  })

  describe('listProjectIssues', () => {
    it('delegates with projectSlug and params', async () => {
      const params = {query: 'is:unresolved'}
      await listProjectIssuesFn(mockConfig, 'my-project', params)
      expect(mockApiInstance.listProjectIssues.calledWith('my-project', params)).to.be.true
    })
  })

  describe('getEvent', () => {
    it('delegates with projectSlug and eventId', async () => {
      await getEventFn(mockConfig, 'my-project', 'abc123')
      expect(mockApiInstance.getEvent.calledWith('my-project', 'abc123')).to.be.true
    })
  })

  describe('debugSourceMaps', () => {
    it('delegates with projectSlug, eventId, and params', async () => {
      // eslint-disable-next-line camelcase
      const params = {exception_idx: '0', frame_idx: '2'}
      await debugSourceMapsFn(mockConfig, 'my-project', 'abc123', params)
      expect(mockApiInstance.debugSourceMaps.calledWith('my-project', 'abc123', params)).to.be.true
    })
  })
})
