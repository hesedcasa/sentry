/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('auth:add', () => {
  let AuthAdd: any
  let testConnectionStub: SinonStub
  let clearClientsStub: SinonStub
  let fsStub: Record<string, SinonStub>
  let actionStartStub: SinonStub
  let actionStopStub: SinonStub

  beforeEach(async () => {
    testConnectionStub = stub()
    clearClientsStub = stub()
    actionStartStub = stub()
    actionStopStub = stub()
    fsStub = {
      createFile: stub().resolves(),
      pathExists: stub().resolves(false),
      readJSON: stub().resolves({auth: {authToken: 'tok', host: 'https://sentry.io/api/0', organization: 'my-org'}}),
      writeJSON: stub().resolves(),
    }

    const imported = await esmock('../../../../src/commands/sentry/auth/add.js', {
      '../../../../src/sentry/sentry-client.js': {
        clearClients: clearClientsStub,
        testConnection: testConnectionStub,
      },
      '@inquirer/prompts': {input: stub().resolves('https://sentry.io/api/0')},
      '@oclif/core/ux': {action: {start: actionStartStub, stop: actionStopStub}},
      'fs-extra': {default: fsStub},
    })
    AuthAdd = imported.default
  })

  it('writes config and shows success on valid auth', async () => {
    testConnectionStub.resolves({data: {organization: 'my-org'}, success: true})

    const cmd = new AuthAdd(['--token', 'my-token', '--organization', 'my-org', '--url', 'https://sentry.io/api/0'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    const result = await cmd.run()

    expect(fsStub.pathExists.calledOnce).to.be.true
    expect(fsStub.createFile.calledOnce).to.be.true
    expect(fsStub.writeJSON.calledOnce).to.be.true
    const writtenData = fsStub.writeJSON.firstCall.args[1]
    expect(writtenData.auth.authToken).to.equal('my-token')
    expect(writtenData.auth.organization).to.equal('my-org')
    expect(testConnectionStub.calledOnce).to.be.true
    expect(clearClientsStub.calledOnce).to.be.true
    expect(actionStopStub.calledWith('✓ successful')).to.be.true
    expect(logStub.calledWith('Authentication added successfully')).to.be.true
    expect(result.success).to.be.true
  })

  it('does not create file if config already exists', async () => {
    fsStub.pathExists.resolves(true)
    testConnectionStub.resolves({data: {}, success: true})

    const cmd = new AuthAdd(['--token', 'tok', '--organization', 'my-org'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    expect(fsStub.createFile.called).to.be.false
    expect(fsStub.writeJSON.calledOnce).to.be.true
  })

  it('shows error on failed auth test', async () => {
    testConnectionStub.resolves({error: 'Unauthorized', success: false})

    const cmd = new AuthAdd(['--token', 'bad', '--organization', 'my-org'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')
    const errorStub = stub(cmd, 'error')

    await cmd.run()

    expect(actionStopStub.calledWith('✗ failed')).to.be.true
    expect(errorStub.calledWith('Authentication is invalid. Please check your token, organization, and URL.')).to.be
      .true
  })

  it('writes config with owner-only permissions', async () => {
    testConnectionStub.resolves({data: {}, success: true})

    const cmd = new AuthAdd(['--token', 'tok', '--organization', 'my-org'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'log')

    await cmd.run()

    const writeOptions = fsStub.writeJSON.firstCall.args[2]
    expect(writeOptions.mode).to.equal(0o600)
  })
})
