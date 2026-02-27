/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('sentry:org:issues', () => {
  let OrgIssues: any
  let mockReadConfig: any
  let mockListOrgIssues: any
  let mockClearClients: any

  const mockAuth = {
    authToken: 'test-token',
    host: 'https://sentry.io/api/0',
    organization: 'test-org',
  }

  beforeEach(async () => {
    mockReadConfig = async () => ({auth: mockAuth})

    mockListOrgIssues = async () => ({
      data: [
        {id: '1', title: 'Error A'},
        {id: '2', title: 'Error B'},
      ],
      success: true,
    })

    mockClearClients = () => {}

    OrgIssues = await esmock('../../../../src/commands/sentry/org/issues.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: mockClearClients,
        listOrgIssues: mockListOrgIssues,
      },
    })
  })

  it('lists organization issues', async () => {
    const command = new OrgIssues.default([], createMockConfig())

    let jsonOutput: unknown
    command.logJson = (data: unknown) => {
      jsonOutput = data
    }

    await command.run()

    expect((jsonOutput as any).success).to.be.true
    expect((jsonOutput as any).data).to.have.length(2)
  })

  it('passes query parameter', async () => {
    let capturedParams: unknown
    mockListOrgIssues = async (_auth: unknown, params: unknown) => {
      capturedParams = params
      return {data: [], success: true}
    }

    OrgIssues = await esmock('../../../../src/commands/sentry/org/issues.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: mockClearClients,
        listOrgIssues: mockListOrgIssues,
      },
    })

    const command = new OrgIssues.default(['--query', 'is:unresolved'], createMockConfig())
    command.logJson = () => {}

    await command.run()

    expect((capturedParams as any).query).to.equal('is:unresolved')
  })

  it('calls clearClients after execution', async () => {
    let clearClientsCalled = false
    mockClearClients = () => {
      clearClientsCalled = true
    }

    OrgIssues = await esmock('../../../../src/commands/sentry/org/issues.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: mockClearClients,
        listOrgIssues: mockListOrgIssues,
      },
    })

    const command = new OrgIssues.default([], createMockConfig())
    command.logJson = () => {}

    await command.run()

    expect(clearClientsCalled).to.be.true
  })
})
