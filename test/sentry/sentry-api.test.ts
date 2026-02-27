/* eslint-disable n/no-unsupported-features/node-builtins */
import {expect} from 'chai'

import {SentryApi} from '../../src/sentry/sentry-api.js'

describe('SentryApi', () => {
  const mockConfig = {
    authToken: 'test-token',
    host: 'https://sentry.io/api/0',
    organization: 'test-org',
  }

  let api: SentryApi
  let originalFetch: typeof globalThis.fetch

  beforeEach(() => {
    api = new SentryApi(mockConfig)
    originalFetch = globalThis.fetch
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function mockFetch(status: number, body: unknown) {
    globalThis.fetch = async () =>
      ({
        ok: status >= 200 && status < 300,
        text: async () => JSON.stringify(body),
      }) as Response
  }

  describe('testConnection', () => {
    it('returns success when connection works', async () => {
      mockFetch(200, [{id: '1'}])

      const result = await api.testConnection()

      expect(result.success).to.be.true
      expect((result.data as {organization: string}).organization).to.equal('test-org')
    })

    it('returns failure on HTTP error', async () => {
      mockFetch(401, {detail: 'Authentication credentials were not provided.'})

      const result = await api.testConnection()

      expect(result.success).to.be.false
    })
  })

  describe('getIssue', () => {
    it('returns issue data on success', async () => {
      const mockIssue = {id: '123', title: 'Test Error'}
      mockFetch(200, mockIssue)

      const result = await api.getIssue('123')

      expect(result.success).to.be.true
      expect((result.data as {id: string}).id).to.equal('123')
    })

    it('returns failure on HTTP error', async () => {
      mockFetch(404, {detail: 'Not found'})

      const result = await api.getIssue('nonexistent')

      expect(result.success).to.be.false
    })
  })

  describe('listOrgIssues', () => {
    it('returns list of issues', async () => {
      const mockIssues = [{id: '1'}, {id: '2'}]
      mockFetch(200, mockIssues)

      const result = await api.listOrgIssues()

      expect(result.success).to.be.true
      expect(result.data).to.deep.equal(mockIssues)
    })

    it('passes query params to request', async () => {
      let capturedUrl = ''
      globalThis.fetch = async (url: Request | string | URL) => {
        capturedUrl = String(url)
        return {ok: true, text: async () => '[]'} as Response
      }

      await api.listOrgIssues({limit: 10, query: 'is:unresolved'})

      expect(capturedUrl).to.include('query=is%3Aunresolved')
      expect(capturedUrl).to.include('limit=10')
    })
  })

  describe('updateIssue', () => {
    it('returns updated issue on success', async () => {
      const mockIssue = {id: '123', status: 'resolved'}
      mockFetch(200, mockIssue)

      const result = await api.updateIssue('123', {status: 'resolved'})

      expect(result.success).to.be.true
    })
  })

  describe('clearClients', () => {
    it('clears without error', () => {
      expect(() => api.clearClients()).to.not.throw()
    })
  })
})
