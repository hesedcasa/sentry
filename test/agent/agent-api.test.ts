/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import {stub} from 'sinon'

import {AgentApi} from '../../src/agent/agent-api.js'

function makeQueryStub(messages: any[]): any {
  return stub().returns({
    async *[Symbol.asyncIterator]() {
      for (const m of messages) yield m
    },
  })
}

describe('AgentApi', () => {
  const config = {apiKey: 'sk-ant-test', apiUrl: 'https://api.anthropic.com'}

  describe('ask', () => {
    it('returns final result text and collected tool names on success', async () => {
      const queryFn = makeQueryStub([
        {
          message: {
            content: [
              {text: 'Thinking...'},
              {name: 'Read'},
            ],
          },
          type: 'assistant',
        },
        {result: 'Done!', subtype: 'success', type: 'result'},
      ])

      const api = new AgentApi(config, queryFn)
      const result = await api.ask('Hello there')

      expect(result.success).to.be.true
      expect(result.data).to.deep.equal({result: 'Done!', toolsUsed: ['Read']})
    })

    it('passes ANTHROPIC_API_KEY and ANTHROPIC_BASE_URL via env option', async () => {
      const queryFn = makeQueryStub([{result: 'ok', subtype: 'success', type: 'result'}])
      const api = new AgentApi(config, queryFn)

      await api.ask('hi')

      const callArgs = queryFn.firstCall.args[0]
      expect(callArgs.prompt).to.equal('hi')
      expect(callArgs.options.env.ANTHROPIC_API_KEY).to.equal('sk-ant-test')
      expect(callArgs.options.env.ANTHROPIC_BASE_URL).to.equal('https://api.anthropic.com')
    })

    it('does not explicitly override ANTHROPIC_BASE_URL when apiUrl is empty', async () => {
      const original = process.env.ANTHROPIC_BASE_URL
      delete process.env.ANTHROPIC_BASE_URL
      try {
        const queryFn = makeQueryStub([{result: 'ok', subtype: 'success', type: 'result'}])
        const api = new AgentApi({apiKey: 'sk-ant-test', apiUrl: ''}, queryFn)

        await api.ask('hi')

        const callArgs = queryFn.firstCall.args[0]
        expect(callArgs.options.env.ANTHROPIC_API_KEY).to.equal('sk-ant-test')
        expect(callArgs.options.env.ANTHROPIC_BASE_URL).to.be.undefined
      } finally {
        if (original !== undefined) process.env.ANTHROPIC_BASE_URL = original
      }
    })

    it('invokes onText and onToolUse callbacks', async () => {
      const onText = stub()
      const onToolUse = stub()
      const queryFn = makeQueryStub([
        {message: {content: [{text: 'hello'}, {name: 'Glob'}]}, type: 'assistant'},
        {result: 'ok', subtype: 'success', type: 'result'},
      ])

      const api = new AgentApi(config, queryFn)
      await api.ask('hi', {onText, onToolUse})

      expect(onText.calledWith('hello')).to.be.true
      expect(onToolUse.calledWith('Glob')).to.be.true
    })

    it('returns error when result subtype is not success', async () => {
      const queryFn = makeQueryStub([{subtype: 'error_max_turns', type: 'result'}])
      const api = new AgentApi(config, queryFn)

      const result = await api.ask('hi')

      expect(result.success).to.be.false
      expect(String(result.error)).to.include('error_max_turns')
    })

    it('returns error when iteration throws', async () => {
      const queryFn = stub().returns({
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.reject(new Error('connection refused')),
        }),
      })
      const api = new AgentApi(config, queryFn as any)

      const result = await api.ask('hi')

      expect(result.success).to.be.false
      expect(result.error).to.equal('connection refused')
    })

    it('forwards systemPrompt and allowedTools options', async () => {
      const queryFn = makeQueryStub([{result: 'ok', subtype: 'success', type: 'result'}])
      const api = new AgentApi(config, queryFn)

      await api.ask('hi', {allowedTools: ['Read', 'Glob'], systemPrompt: 'You are concise.'})

      const callArgs = queryFn.firstCall.args[0]
      expect(callArgs.options.allowedTools).to.deep.equal(['Read', 'Glob'])
      expect(callArgs.options.systemPrompt).to.equal('You are concise.')
    })
  })

  describe('testConnection', () => {
    it('returns success when ask succeeds', async () => {
      const queryFn = makeQueryStub([
        {message: {content: [{text: 'OK'}]}, type: 'assistant'},
        {result: 'OK', subtype: 'success', type: 'result'},
      ])

      const api = new AgentApi(config, queryFn)
      const result = await api.testConnection()

      expect(result.success).to.be.true
      expect((result.data as any).reply).to.equal('OK')
      expect((result.data as any).apiUrl).to.equal('https://api.anthropic.com')
    })

    it('returns "default" apiUrl label when none configured', async () => {
      const queryFn = makeQueryStub([{result: 'OK', subtype: 'success', type: 'result'}])
      const api = new AgentApi({apiKey: 'k', apiUrl: ''}, queryFn)

      const result = await api.testConnection()

      expect(result.success).to.be.true
      expect((result.data as any).apiUrl).to.equal('default')
    })

    it('propagates failure from ask', async () => {
      const queryFn = stub().returns({
        [Symbol.asyncIterator]: () => ({
          next: () => Promise.reject(new Error('401 unauthorized')),
        }),
      })
      const api = new AgentApi(config, queryFn as any)

      const result = await api.testConnection()
      expect(result.success).to.be.false
      expect(result.error).to.equal('401 unauthorized')
    })
  })

  describe('clearClients', () => {
    it('does not throw', () => {
      const api = new AgentApi(config, makeQueryStub([]))
      expect(() => api.clearClients()).to.not.throw()
    })
  })
})
