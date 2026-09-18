import {expect} from 'chai'
import {execFile} from 'node:child_process'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {promisify} from 'node:util'

const execFileAsync = promisify(execFile)

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const CLI = path.join(REPO_ROOT, 'bin', 'run.js')
const SENTRY_API_ROOT = 'https://sentry.io/api/0'

export type CliResult = {
  code: number
  stderr: string
  stdout: string
}

/**
 * Reads the sandbox credentials from the environment.
 *
 * Nothing in this repo loads .env, so these must already be exported.
 *
 * @returns The API token and the Sentry API root.
 */
export function requireEnv(): {apiToken: string; host: string} {
  const apiToken = process.env.SENTRY_API_KEY

  if (!apiToken) {
    throw new Error(
      'Missing SENTRY_API_KEY. Nothing in this repo loads .env — run: set -a; . ./.env; set +a',
    )
  }

  const host = process.env.SENTRY_HOST || SENTRY_API_ROOT
  return {apiToken, host: host.endsWith('/') ? host.slice(0, -1) : host}
}

let cachedOrg: Promise<string> | undefined

/**
 * Resolves the organization the suite runs against, once per process.
 *
 * `SENTRY_ORG` pins it explicitly; without it, exactly one organization must
 * be visible to the token — guessing among many would let the suite mutate
 * the wrong org.
 *
 * @returns The organization slug.
 */
export function resolveOrg(): Promise<string> {
  cachedOrg ??= discoverOrg()
  return cachedOrg
}

async function discoverOrg(): Promise<string> {
  const {apiToken, host} = requireEnv()

  const response = await fetch(`${host}/organizations/`, {
    headers: {accept: 'application/json', authorization: `Bearer ${apiToken}`},
  })
  if (!response.ok) {
    throw new Error(`resolveOrg failed: ${response.status} ${await response.text()}`)
  }

  const orgs = (await response.json()) as Array<{slug: string}>
  const requested = process.env.SENTRY_ORG
  if (requested) {
    if (orgs.every((org) => org.slug !== requested)) {
      throw new Error(
        `SENTRY_ORG "${requested}" is not visible to this token (saw: ${orgs.map((org) => org.slug).join(', ') || 'none'})`,
      )
    }

    return requested
  }

  if (orgs.length === 1) return orgs[0]!.slug

  throw new Error(
    `Token sees ${orgs.length} organizations; set SENTRY_ORG to pick one (${orgs.map((org) => org.slug).join(', ')})`,
  )
}

/**
 * Writes a throwaway oclif config dir holding a `default` profile pointing at
 * the sandbox and a `broken` profile whose API token is invalid.
 *
 * Credentials are written as literals rather than `env:` references so the
 * suite never depends on a secret backend being reachable.
 *
 * @returns Absolute path to the config dir, to be passed to runCli().
 */
export async function createConfigDir(): Promise<string> {
  const {apiToken, host} = requireEnv()
  const organization = await resolveOrg()
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'sentry-e2e-'))
  const profile = {authToken: apiToken, host, organization}

  await fs.writeFile(
    path.join(dir, 'sentry-config.json'),
    JSON.stringify(
      {
        defaultProfile: 'default',
        profiles: {
          broken: {...profile, authToken: 'definitely-not-the-token'},
          default: profile,
        },
      },
      null,
      2,
    ),
    {mode: 0o600},
  )

  return dir
}

export async function removeConfigDir(dir: string): Promise<void> {
  await fs.rm(dir, {force: true, recursive: true})
}

/**
 * Builds the subprocess invocation for the configured host CLI.
 *
 * By default the built standalone CLI (`bin/run.js`) runs with `SENTRY_CONFIG_DIR`
 * (oclif scopes that env var by bin name). When `E2E_HOST_CLI=sdkck`, the same
 * arguments go to the `sdkck` binary instead — plugin commands are
 * topic-prefixed (`sdkck sentry org`), so the argv is host-agnostic — and
 * oclif's bin-scoped `SDKCK_*` dirs are redirected: config to the same
 * throwaway `sentry-config.json` dir the standalone leg uses, data/cache into
 * the throwaway sdkck home (`E2E_SDKCK_HOME`) that the scripts installed the
 * plugin into.
 *
 * @param args Command line arguments, e.g. ['sentry', 'org'].
 * @param configDir The dir holding sentry-config.json, from createConfigDir().
 * @returns The executable, its argv, and env overrides to layer over process.env.
 */
function hostInvocation(
  args: string[],
  configDir: string,
): {argv: string[]; command: string; env: Record<string, string>} {
  if (process.env.E2E_HOST_CLI === 'sdkck') {
    const home = process.env.E2E_SDKCK_HOME
    if (!home) {
      throw new Error(
        'E2E_HOST_CLI=sdkck requires E2E_SDKCK_HOME — set by scripts/e2e.sh or the CI workflow',
      )
    }

    return {
      argv: args,
      command: 'sdkck',
      env: {
        SDKCK_CACHE_DIR: path.join(home, 'cache'),
        SDKCK_CONFIG_DIR: configDir,
        SDKCK_DATA_DIR: path.join(home, 'data'),
      },
    }
  }

  return {argv: [CLI, ...args], command: process.execPath, env: {SENTRY_CONFIG_DIR: configDir}}
}

/**
 * Runs the host CLI as a real subprocess against the sandbox. The host is the
 * built standalone CLI unless `E2E_HOST_CLI=sdkck` (see hostInvocation()).
 * Non-zero exits are returned rather than thrown so tests can assert on
 * failure paths.
 *
 * @param args Command line arguments, e.g. ['sentry', 'org'].
 * @param configDir Value for SENTRY_CONFIG_DIR / SDKCK_CONFIG_DIR, from
 *   createConfigDir().
 * @returns The exit code and captured stdout/stderr.
 */
export async function runCli(args: string[], configDir: string): Promise<CliResult> {
  const {argv, command, env} = hostInvocation(args, configDir)
  try {
    const {stderr, stdout} = await execFileAsync(command, argv, {
      env: {...process.env, FORCE_COLOR: '0', NO_COLOR: '1', ...env},
      maxBuffer: 32 * 1024 * 1024,
    })
    return {code: 0, stderr, stdout}
  } catch (error: unknown) {
    const failure = error as {code?: number; stderr?: string; stdout?: string}
    return {code: failure.code ?? 1, stderr: failure.stderr ?? '', stdout: failure.stdout ?? ''}
  }
}

/**
 * Replaces every occurrence of `secret` in `text` with `<redacted>`.
 *
 * A missing/empty secret is a no-op rather than matching everything — an
 * empty needle would otherwise turn `replaceAll` into a full-string redaction.
 *
 * Exported (rather than a private helper) so it can be exercised directly by
 * a unit-style test without invoking a command whose output carries a real
 * token, such as `sentry auth list`.
 *
 * @param text Captured stdout/stderr that may contain the secret.
 * @param secret The value to scrub; falsy values leave `text` untouched.
 * @returns `text` with every occurrence of `secret` replaced.
 */
export function redactSecret(text: string, secret: string | undefined): string {
  return secret ? text.replaceAll(secret, '<redacted>') : text
}

/**
 * Reads the API token for redaction purposes only. Swallows the
 * "missing credentials" error from requireEnv() so that a call site with no
 * env configured still gets a (no-op) redaction rather than a thrown error.
 *
 * @returns The API token, or undefined if the environment isn't configured.
 */
function redactionToken(): string | undefined {
  try {
    return requireEnv().apiToken
  } catch {
    return undefined
  }
}

/**
 * Runs the CLI and fails the test if it exited non-zero.
 *
 * The failure message redacts the API token from stdout/stderr before it is
 * interpolated, so a failing `sentry auth …` call never prints the real token
 * into mocha's failure output or CI logs. The returned `CliResult` itself is
 * left unredacted — tests need the real values to assert on.
 *
 * @param args Command line arguments.
 * @param configDir Value for SENTRY_CONFIG_DIR.
 * @returns The successful result.
 */
export async function runCliOk(args: string[], configDir: string): Promise<CliResult> {
  const result = await runCli(args, configDir)
  const secret = redactionToken()
  const stdout = redactSecret(result.stdout, secret)
  const stderr = redactSecret(result.stderr, secret)
  expect(result.code, `\`sentry ${args.join(' ')}\` failed:\n${stdout}\n${stderr}`).to.equal(0)
  return result
}

/**
 * Runs the CLI and parses stdout as JSON.
 *
 * JSON is the default output mode (BaseCommand.jsonEnabled()), and `--json`
 * is not a declared flag — do not add one.
 *
 * @param args Command line arguments.
 * @param configDir Value for SENTRY_CONFIG_DIR.
 * @returns The parsed JSON payload.
 */
export async function runCliJson<T = unknown>(args: string[], configDir: string): Promise<T> {
  const {stdout} = await runCliOk(args, configDir)
  return JSON.parse(stdout) as T
}
