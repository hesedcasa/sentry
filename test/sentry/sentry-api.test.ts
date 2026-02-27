/* eslint-disable n/no-unsupported-features/node-builtins */
import {expect} from 'chai'
import {type SinonStub, stub} from 'sinon'

import {SentryApi} from '../../src/sentry/sentry-api.js'

describe('SentryApi', () => {
  const config = {
    authToken: 'test-token',
    host: 'https://sentry.io/api/0',
    organization: 'test-org',
  }
  let api: SentryApi
  let fetchStub: SinonStub

  beforeEach(() => {
    api = new SentryApi(config)
    fetchStub = stub(globalThis, 'fetch')
  })

  afterEach(() => {
    fetchStub.restore()
  })

  it('creates an instance with config', () => {
    expect(api).to.be.instanceOf(SentryApi)
  })

  it('clearClients does not throw', () => {
    expect(() => api.clearClients()).to.not.throw()
  })

  describe('request internals', () => {
    it('sends correct Authorization header', async () => {
      fetchStub.resolves(new Response(JSON.stringify({id: '1'}), {status: 200}))

      await api.getIssue('123')

      const [, options] = fetchStub.firstCall.args
      expect(options.headers.Authorization).to.equal('Bearer test-token')
    })

    it('sends Accept: application/json header', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      await api.getIssue('123')

      const [, options] = fetchStub.firstCall.args
      expect(options.headers.Accept).to.equal('application/json')
    })

    it('uses configured host as base URL', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      await api.getIssue('123')

      const [url] = fetchStub.firstCall.args
      expect(url).to.match(/^https:\/\/sentry\.io\/api\/0\//)
    })

    it('returns success with parsed JSON on 200 response', async () => {
      const responseData = {id: '123', title: 'Test Error'}
      fetchStub.resolves(new Response(JSON.stringify(responseData), {status: 200}))

      const result = await api.getIssue('123')

      expect(result.success).to.be.true
      expect(result.data).to.deep.equal(responseData)
      expect(result.error).to.be.undefined
    })

    it('returns success with data=true on empty response body', async () => {
      fetchStub.resolves({
        ok: true,
        status: 204,
        text: async () => '',
      })

      const result = await api.updateIssue('123', {status: 'resolved'})

      expect(result.success).to.be.true
      expect(result.data).to.equal(true)
    })

    it('returns error with parsed JSON on non-OK response with JSON body', async () => {
      const errorBody = {detail: 'Not Found'}
      fetchStub.resolves(new Response(JSON.stringify(errorBody), {status: 404}))

      const result = await api.getIssue('nonexistent')

      expect(result.success).to.be.false
      expect(result.data).to.be.undefined
      expect(result.error).to.deep.equal(errorBody)
    })

    it('returns error with raw text on non-OK response with non-JSON body', async () => {
      fetchStub.resolves(new Response('Service Unavailable', {status: 503}))

      const result = await api.getIssue('123')

      expect(result.success).to.be.false
      expect(result.error).to.equal('Service Unavailable')
    })

    it('returns error on network exception', async () => {
      fetchStub.rejects(new Error('Network timeout'))

      const result = await api.getIssue('123')

      expect(result.success).to.be.false
      expect(result.error).to.equal('Network timeout')
    })

    it('returns error on non-Error exception', async () => {
      fetchStub.rejects('string error')

      const result = await api.getIssue('123')

      expect(result.success).to.be.false
      expect(result.error).to.be.a('string')
    })

    it('sets Content-Type when body is present', async () => {
      fetchStub.resolves(new Response(JSON.stringify({id: '1'}), {status: 200}))

      await api.updateIssue('123', {status: 'resolved'})

      const [, options] = fetchStub.firstCall.args
      expect(options.headers['Content-Type']).to.equal('application/json')
    })

    it('does not set Content-Type when no body is present', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      await api.getIssue('123')

      const [, options] = fetchStub.firstCall.args
      expect(options.headers['Content-Type']).to.be.undefined
    })
  })

  describe('testConnection', () => {
    it('calls GET /organizations/:org/issues/ and returns org info on success', async () => {
      fetchStub.resolves(new Response(JSON.stringify([{id: '1'}]), {status: 200}))

      const result = await api.testConnection()

      const [url, options] = fetchStub.firstCall.args
      expect(url).to.include('/organizations/test-org/issues/')
      expect(options.method).to.equal('GET')
      expect(result.success).to.be.true
      expect((result.data as {organization: string}).organization).to.equal('test-org')
    })

    it('returns failure when request fails', async () => {
      fetchStub.resolves(new Response(JSON.stringify({detail: 'Unauthorized'}), {status: 401}))

      const result = await api.testConnection()

      expect(result.success).to.be.false
    })
  })

  describe('getIssue', () => {
    it('calls GET /organizations/:org/issues/:id', async () => {
      fetchStub.resolves(new Response(JSON.stringify({id: '123', title: 'Test'}), {status: 200}))

      await api.getIssue('123')

      const [url, options] = fetchStub.firstCall.args
      expect(url).to.equal('https://sentry.io/api/0/organizations/test-org/issues/123/')
      expect(options.method).to.equal('GET')
    })
  })

  describe('updateIssue', () => {
    it('calls PUT /organizations/:org/issues/:id with body', async () => {
      fetchStub.resolves(new Response(JSON.stringify({id: '123', status: 'resolved'}), {status: 200}))

      await api.updateIssue('123', {status: 'resolved'})

      const [url, options] = fetchStub.firstCall.args
      expect(url).to.equal('https://sentry.io/api/0/organizations/test-org/issues/123/')
      expect(options.method).to.equal('PUT')
      const body = JSON.parse(options.body)
      expect(body.status).to.equal('resolved')
    })

    it('sends all provided fields in body', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      await api.updateIssue('123', {assignedTo: 'user@example.com', hasSeen: true, status: 'resolved'})

      const [, options] = fetchStub.firstCall.args
      const body = JSON.parse(options.body)
      expect(body.status).to.equal('resolved')
      expect(body.assignedTo).to.equal('user@example.com')
      expect(body.hasSeen).to.be.true
    })
  })

  describe('listOrgIssues', () => {
    it('calls GET /organizations/:org/issues/', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listOrgIssues()

      const [url, options] = fetchStub.firstCall.args
      expect(url).to.include('/organizations/test-org/issues/')
      expect(options.method).to.equal('GET')
    })

    it('includes query params when provided', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listOrgIssues({limit: 10, query: 'is:unresolved'})

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('query=is%3Aunresolved')
      expect(url).to.include('limit=10')
    })

    it('omits query string when no params', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listOrgIssues()

      const [url] = fetchStub.firstCall.args
      expect(url).to.not.include('?')
    })
  })

  describe('getIssueEvent', () => {
    it('calls GET /organizations/:org/issues/:issueId/events/:eventId', async () => {
      fetchStub.resolves(new Response(JSON.stringify({id: 'evt1'}), {status: 200}))

      await api.getIssueEvent('123', 'latest')

      const [url, options] = fetchStub.firstCall.args
      expect(url).to.equal('https://sentry.io/api/0/organizations/test-org/issues/123/events/latest/')
      expect(options.method).to.equal('GET')
    })
  })

  describe('listIssueEvents', () => {
    it('calls GET /organizations/:org/issues/:id/events/', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listIssueEvents('123')

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('/organizations/test-org/issues/123/events/')
    })

    it('includes filter params when provided', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listIssueEvents('123', {full: true, statsPeriod: '24h'})

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('full=true')
      expect(url).to.include('statsPeriod=24h')
    })
  })

  describe('listIssueHashes', () => {
    it('calls GET /organizations/:org/issues/:id/hashes/', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listIssueHashes('123')

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('/organizations/test-org/issues/123/hashes/')
    })

    it('includes cursor when provided', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listIssueHashes('123', {cursor: 'abc'})

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('cursor=abc')
    })
  })

  describe('getTagDetails', () => {
    it('calls GET /organizations/:org/issues/:id/tags/:tagKey/', async () => {
      fetchStub.resolves(new Response(JSON.stringify({key: 'browser'}), {status: 200}))

      await api.getTagDetails('123', 'browser')

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('/organizations/test-org/issues/123/tags/browser/')
    })
  })

  describe('listTagValues', () => {
    it('calls GET /organizations/:org/issues/:id/tags/:tagKey/values/', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listTagValues('123', 'browser')

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('/organizations/test-org/issues/123/tags/browser/values/')
    })
  })

  describe('listProjectEvents', () => {
    it('calls GET /projects/:org/:projectSlug/events/', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listProjectEvents('my-project')

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('/projects/test-org/my-project/events/')
    })

    it('includes filter params when provided', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listProjectEvents('my-project', {full: true, statsPeriod: '7d'})

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('full=true')
      expect(url).to.include('statsPeriod=7d')
    })
  })

  describe('listProjectIssues', () => {
    it('calls GET /projects/:org/:projectSlug/issues/', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listProjectIssues('my-project')

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('/projects/test-org/my-project/issues/')
    })

    it('includes query when provided', async () => {
      fetchStub.resolves(new Response(JSON.stringify([]), {status: 200}))

      await api.listProjectIssues('my-project', {query: 'is:unresolved'})

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('query=is%3Aunresolved')
    })
  })

  describe('getEvent', () => {
    it('calls GET /projects/:org/:projectSlug/events/:eventId/', async () => {
      fetchStub.resolves(new Response(JSON.stringify({id: 'evt1'}), {status: 200}))

      await api.getEvent('my-project', 'abc123')

      const [url, options] = fetchStub.firstCall.args
      expect(url).to.equal('https://sentry.io/api/0/projects/test-org/my-project/events/abc123/')
      expect(options.method).to.equal('GET')
    })
  })

  describe('debugSourceMaps', () => {
    it('calls GET /projects/:org/:projectSlug/events/:eventId/source-map-debug/', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      await api.debugSourceMaps('my-project', 'abc123')

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('/projects/test-org/my-project/events/abc123/source-map-debug/')
    })

    it('includes exception_idx and frame_idx params when provided', async () => {
      fetchStub.resolves(new Response(JSON.stringify({}), {status: 200}))

      // eslint-disable-next-line camelcase
      await api.debugSourceMaps('my-project', 'abc123', {exception_idx: '0', frame_idx: '2'})

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('exception_idx=0')
      expect(url).to.include('frame_idx=2')
    })
  })
})
