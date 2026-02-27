/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('sentry:issue:get', () => {
  let IssueGet: any
  let mockReadConfig: any
  let mockGetIssue: any
  let mockClearClients: any

  const mockAuth = {
    authToken: 'test-token',
    host: 'https://sentry.io/api/0',
    organization: 'test-org',
  }

  const mockIssue = {
    id: '123456789',
    shortId: 'PROJ-1',
    status: 'unresolved',
    title: 'TypeError: Cannot read properties of undefined',
  }

  beforeEach(async () => {
    mockReadConfig = async () => ({auth: mockAuth})

    mockGetIssue = async () => ({
      data: mockIssue,
      success: true,
    })

    mockClearClients = () => {}

    IssueGet = await esmock('../../../../src/commands/sentry/issue/get.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: mockClearClients,
        getIssue: mockGetIssue,
      },
    })
  })

  it('retrieves an issue by ID', async () => {
    const command = new IssueGet.default(['123456789'], createMockConfig())

    let jsonOutput: unknown
    command.logJson = (data: unknown) => {
      jsonOutput = data
    }

    await command.run()

    expect((jsonOutput as any).success).to.be.true
    expect((jsonOutput as any).data.id).to.equal('123456789')
  })

  it('calls clearClients after execution', async () => {
    let clearClientsCalled = false
    mockClearClients = () => {
      clearClientsCalled = true
    }

    IssueGet = await esmock('../../../../src/commands/sentry/issue/get.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: mockClearClients,
        getIssue: mockGetIssue,
      },
    })

    const command = new IssueGet.default(['123456789'], createMockConfig())
    command.logJson = () => {}

    await command.run()

    expect(clearClientsCalled).to.be.true
  })
})
