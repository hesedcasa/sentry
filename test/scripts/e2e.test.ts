import {expect} from 'chai'
import {spawnSync} from 'node:child_process'
import {chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import path from 'node:path'

// Exercises the Infisical re-exec at the top of scripts/e2e.sh offline: a fake
// `infisical` on PATH records how it was called, and its `run` exits without
// re-running the script, so nothing is built and nothing reaches Sentry.
describe('scripts/e2e.sh Infisical bootstrap', () => {
  if (process.platform === 'win32') return

  const script = path.resolve('scripts/e2e.sh')
  const {workspaceId} = JSON.parse(readFileSync('.infisical.json', 'utf8'))
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), 'e2e-sh-'))
    const fake = path.join(dir, 'infisical')
    writeFileSync(
      fake,
      `#!/usr/bin/env bash
log="${dir}/$1"
printf '%s\\n' "$@" > "$log.args"
{
  echo "id=\${INFISICAL_UNIVERSAL_AUTH_CLIENT_ID:-}"
  echo "secret=\${INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET:-}"
  echo "token=\${INFISICAL_TOKEN:-}"
} > "$log.env"
if [ "$1" = login ]; then echo fake-token; fi
`,
    )
    chmodSync(fake, 0o755)
  })

  afterEach(() => {
    rmSync(dir, {force: true, recursive: true})
  })

  function runScript(env: Record<string, string>) {
    return spawnSync('bash', [script, '--keep'], {
      encoding: 'utf8',
      env: {HOME: dir, PATH: [dir, path.dirname(process.execPath), '/usr/bin', '/bin'].join(':'), ...env},
    })
  }

  const read = (file: string) => readFileSync(path.join(dir, file), 'utf8').trim().split('\n')

  it('logs in through the environment, never through arguments', () => {
    const result = runScript({
      INFISICAL_UNIVERSAL_AUTH_CLIENT_ID: 'the-client-id',
      INFISICAL_UNIVERSAL_AUTH_CLIENT_SECRET: 'the-client-secret',
    })
    expect(result.status, result.stderr).to.equal(0)

    const loginArgs = read('login.args')
    expect(loginArgs).to.include('--method=universal-auth')
    expect(loginArgs.join(' ')).to.not.include('the-client-id')
    expect(loginArgs.join(' ')).to.not.include('the-client-secret')
    expect(read('login.env')).to.include.members(['id=the-client-id', 'secret=the-client-secret'])

    const runArgs = read('run.args')
    expect(runArgs.slice(0, 4)).to.deep.equal(['run', '--silent', '--projectId', workspaceId])
    expect(runArgs.slice(4)).to.deep.equal(['--', script, '--keep'])
    expect(read('run.env')).to.include('token=fake-token')
  })

  it('relies on the interactive login when no machine identity is set', () => {
    const result = runScript({})
    expect(result.status, result.stderr).to.equal(0)

    expect(() => read('login.args')).to.throw()
    expect(read('run.args')).to.deep.equal(['run', '--silent', '--', script, '--keep'])
  })
})
