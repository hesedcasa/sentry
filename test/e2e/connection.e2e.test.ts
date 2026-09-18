import {expect} from 'chai'

import {createConfigDir, redactSecret, removeConfigDir, runCli, runCliJson} from './helpers.js'

type Failure = {error: {detail: string}; success: false}

describe('e2e: connection', () => {
  let configDir: string

  before(async () => {
    configDir = await createConfigDir()
  })

  after(async () => {
    await removeConfigDir(configDir)
  })

  it('authenticates with the default profile', async () => {
    const {code} = await runCli(['sentry', 'auth', 'test'], configDir)
    expect(code).to.equal(0)
  })

  // A synthetic secret, not the real API token: chai renders the actual
  // string in its failure message, so if this used the live token the one
  // circumstance where this test fails (a redaction regression) would print
  // the credential into the terminal and CI logs. redactSecret is a pure
  // string function, so a synthetic value proves the same property with zero
  // exposure.
  it('redacts the API token from captured output', () => {
    const secret = 'SEKRET-PLACEHOLDER-0001'
    const text = `some output embedding ${secret} in the middle of it`

    expect(redactSecret(text, secret)).to.not.include(secret)
  })

  it('leaves text untouched when there is no secret to redact', () => {
    const text = 'plain output with no secret in it'

    expect(redactSecret(text, undefined)).to.equal(text)
    expect(redactSecret(text, '')).to.equal(text)
  })

  it('fails auth test on a bad API token', async () => {
    const {code} = await runCli(['sentry', 'auth', 'test', '--profile', 'broken'], configDir)
    expect(code).to.equal(2)
  })

  it('errors on an unknown profile rather than falling back to the default', async () => {
    const {code, stdout} = await runCli(['sentry', 'org', '--profile', 'nosuch'], configDir)
    expect(code).to.equal(1)
    expect(JSON.parse(stdout)).to.deep.equal({error: 'Missing authentication config.'})
  })

  // Pinned as observed, not as desired. Unlike the reference Jira CLI, a
  // failed API call still exits 0 — the payload carries success:false and the
  // API's error detail. Changing that is out of scope; this test makes a
  // future fix a visible, deliberate change.
  it('reports success:false from a list endpoint the token cannot use', async () => {
    const {code, stdout} = await runCli(['sentry', 'org', '--profile', 'broken'], configDir)
    expect(code, 'pinned: failures exit 0 today').to.equal(0)

    const payload = JSON.parse(stdout) as Failure
    expect(payload.success).to.be.false
    expect(payload.error.detail).to.contain('Invalid token')
  })

  // Same pinned contract, one resource deep: a missing issue is a payload
  // failure, not a non-zero exit.
  it('reports success:false when a single resource does not exist', async () => {
    const {code, stdout} = await runCli(['sentry', 'issue', '999999999'], configDir)
    expect(code, 'pinned: failures exit 0 today').to.equal(0)

    const payload = JSON.parse(stdout) as Failure
    expect(payload.success).to.be.false
    expect(payload.error.detail).to.contain('does not exist')
  })

  // Pinned as observed: `sentry auth list` renders the API token in
  // plaintext. That is a finding, not a feature — this test makes a future
  // redaction fix a visible, deliberate change. The captured stdout carries
  // the real token, so it is redacted before any assertion: a failing expect
  // would otherwise interpolate the credential into chai's failure message
  // and from there into the terminal and CI logs. (runCli() redacts only its
  // own failure message; the values it hands back stay raw by design.)
  it('lists profiles including the token, in plaintext', async () => {
    const {code, stdout} = await runCli(['sentry', 'auth', 'list'], configDir)
    const redactedStdout = redactSecret(stdout, process.env.SENTRY_API_KEY)
    expect(code).to.equal(0)
    expect(redactedStdout).to.contain('authToken:')
    expect(redactedStdout).to.contain('default (default):')
  })

  it('lists org issues for the default profile', async () => {
    const payload = await runCliJson<{data: unknown[]; success: boolean}>(['sentry', 'org'], configDir)
    expect(payload.success).to.be.true
    expect(payload.data).to.be.an('array')
  })
})
