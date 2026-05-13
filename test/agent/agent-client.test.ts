/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('agent-client', () => {
  const mockConfig = {apiKey: 'sk-ant-test', apiUrl: 'https://api.anthropic.com'}
  const mockResult = {data: {result: 'hi', toolsUsed: []}, success: true}

  let clearClients: any
  let askFn: any
  let testConnectionFn: any
  let mockApiInstance: Record<string, SinonStub>
  let AgentApiStub: SinonStub

  beforeEach(async () => {
    mockApiInstance = {
      ask: stub().resolves(mockResult),
      clearClients: stub(),
      testConnection: stub().resolves(mockResult),
    }
    AgentApiStub = stub().returns(mockApiInstance)

    const mod = await esmock('../../src/agent/agent-client.js', {
      '../../src/agent/agent-api.js': {AgentApi: AgentApiStub},
    })

    clearClients = mod.clearClients
    askFn = mod.ask
    testConnectionFn = mod.testConnection
  })

  afterEach(() => {
    clearClients()
  })

  it('clearClients does not throw when no client exists', () => {
    expect(() => clearClients()).to.not.throw()
  })

  describe('singleton pattern', () => {
    it('reuses the same AgentApi instance across calls', async () => {
      await askFn(mockConfig, 'hi')
      await askFn(mockConfig, 'there')

      expect(AgentApiStub.calledOnce).to.be.true
    })

    it('creates a new instance after clearClients', async () => {
      await askFn(mockConfig, 'hi')
      clearClients()
      await askFn(mockConfig, 'again')

      expect(AgentApiStub.calledTwice).to.be.true
    })
  })

  describe('ask', () => {
    it('delegates to AgentApi.ask with prompt and options', async () => {
      const opts = {allowedTools: ['Read']}
      const result = await askFn(mockConfig, 'do a thing', opts)

      expect(mockApiInstance.ask.calledOnceWith('do a thing', opts)).to.be.true
      expect(result).to.deep.equal(mockResult)
    })
  })

  describe('testConnection', () => {
    it('delegates to AgentApi.testConnection', async () => {
      const result = await testConnectionFn(mockConfig)
      expect(mockApiInstance.testConnection.calledOnce).to.be.true
      expect(result).to.deep.equal(mockResult)
    })
  })
})
