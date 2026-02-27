/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'

import {createMockConfig} from '../../../helpers/config-mock.js'

describe('sentry:auth:test', () => {
  let AuthTest: any
  let mockReadConfig: any
  let mockTestConnection: any
  let mockClearClients: any
  let mockAction: any
  let logMessages: string[]

  const mockAuth = {
    authToken: 'test-token',
    host: 'https://sentry.io/api/0',
    organization: 'test-org',
  }

  beforeEach(async () => {
    logMessages = []

    mockReadConfig = async () => ({auth: mockAuth})

    mockTestConnection = async () => ({
      data: {organization: 'test-org'},
      success: true,
    })

    mockClearClients = () => {}

    mockAction = {
      start() {},
      stop() {},
    }

    AuthTest = await esmock('../../../../src/commands/sentry/auth/test.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: mockClearClients,
        testConnection: mockTestConnection,
      },
      '@oclif/core/ux': {action: mockAction},
    })
  })

  it('reports successful connection', async () => {
    const command = new AuthTest.default([], createMockConfig())

    command.log = (msg: string) => {
      logMessages.push(msg)
    }

    const result = await command.run()

    expect(result.success).to.be.true
    expect(logMessages).to.include('Successful connection to Sentry')
  })

  it('returns error when config is missing', async () => {
    mockReadConfig = async () => {}

    AuthTest = await esmock('../../../../src/commands/sentry/auth/test.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: mockClearClients,
        testConnection: mockTestConnection,
      },
      '@oclif/core/ux': {action: mockAction},
    })

    const command = new AuthTest.default([], createMockConfig())
    command.log = () => {}

    const result = await command.run()

    expect(result.success).to.be.false
  })

  it('calls clearClients after execution', async () => {
    let clearClientsCalled = false
    mockClearClients = () => {
      clearClientsCalled = true
    }

    AuthTest = await esmock('../../../../src/commands/sentry/auth/test.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/sentry/sentry-client.js': {
        clearClients: mockClearClients,
        testConnection: mockTestConnection,
      },
      '@oclif/core/ux': {action: mockAction},
    })

    const command = new AuthTest.default([], createMockConfig())
    command.log = () => {}

    await command.run()

    expect(clearClientsCalled).to.be.true
  })
})
