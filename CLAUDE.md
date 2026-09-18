# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**sentry** is an Oclif-based CLI tool for interacting with the Sentry error tracking REST API. It provides access to Sentry functionality including issues, events, tags, hashes, and source map debugging.

## Development Commands

```bash
# Build
npm run build

# Run all tests
npm test

# Run a single test file
npx mocha test/path/to/test.test.ts

# Lint and format
npm run lint
npm run format

# Find dead code
npm run find-deadcode
```

## Architecture

The project follows a layered architecture with clear separation of concerns:

```
src/
├── commands/sentry/   # Oclif CLI commands (user-facing)
│   ├── auth/          # Authentication commands (add, test, update)
│   ├── issue/         # Issue commands (get, update, events, event, hashes, tag, tag-values)
│   ├── org/           # Organization commands (issues)
│   ├── project/       # Project commands (events, issues)
│   └── event/         # Event commands (get, source-maps)
├── sentry/            # Sentry REST API layer
│   ├── sentry-api.ts  # SentryApi class with core API methods (uses fetch)
│   └── sentry-client.ts  # Wrapper functions with singleton pattern
├── config.ts          # Configuration management (auth config)
└── format.ts          # Output formatting (TOON format)
```

### Key Architectural Patterns

**1. Three-Tier Command Pattern:**

- **Commands** (`src/commands/sentry/`) - Thin Oclif command wrappers that parse args/flags
- **Client Layer** (`sentry-client.ts`) - Functional wrappers with singleton pattern
- **API Layer** (`sentry-api.ts`) - Core API class using native `fetch`

**2. ApiResult Pattern:**
All API functions return `ApiResult` objects:

```typescript
interface ApiResult {
  data?: unknown
  error?: unknown
  success: boolean
}
```

**3. Singleton Client Pattern:**
`sentry-client.ts` maintains a singleton instance of `SentryApi`. Commands should call `clearClients()` after use for cleanup.

## Adding a New Command

1. Create command file in `src/commands/sentry/<category>/<name>.ts`
2. Extend `Command` from `@oclif/core`
3. Define static `args`, `flags`, `description`, and `examples`
4. In `run()` method:
   - Parse args/flags
   - Read config with `readConfig(this.config.configDir, this.log.bind(this))`
   - Call appropriate client function from `sentry-client.ts`
   - Call `clearClients()` for cleanup
   - Output with `this.logJson(result)` or `this.log(formatAsToon(result))`

**Argument ordering convention:** When the first positional argument is not alphabetically first, wrap the `args` block with eslint-disable comments. The `@eslint-community/eslint-comments/require-description` rule requires a `--` description on the disable comment:

```typescript
/* eslint-disable perfectionist/sort-objects -- positional args must stay in CLI order per CLAUDE.md convention */
static override args = {
  issueId: Args.string({description: 'Issue ID', required: true}),
  eventId: Args.string({description: 'Event ID', required: true}),
}
/* eslint-enable perfectionist/sort-objects */
```

Example pattern from `src/commands/sentry/issue/get.ts`:

```typescript
import {Args, Command, Flags} from '@oclif/core'
import {readConfig} from '../../../config.js'
import {formatAsToon} from '../../../format.js'
import {clearClients, getIssue} from '../../../sentry/sentry-client.js'

export default class IssueGet extends Command {
  static override args = {
    issueId: Args.string({description: 'Issue ID', required: true}),
  }
  static override description = 'Retrieve a Sentry issue'
  static override examples = ['<%= config.bin %> <%= command.id %> 123456789']
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(IssueGet)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) return

    const result = await getIssue(config.auth, args.issueId)
    clearClients()

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
```

## Adding New API Functions

1. Add method to `SentryApi` class in `sentry-api.ts`
2. Export wrapper function in `sentry-client.ts`
3. Use `ApiResult` return type for consistent error handling

## Configuration

Authentication config is stored in JSON at `~/.config/sentry/sentry-config.json` (platform-dependent):

```json
{
  "auth": {
    "authToken": "your-sentry-auth-token",
    "organization": "your-org-slug",
    "host": "https://sentry.io/api/0"
  }
}
```

## Testing

- Tests mirror source structure in `test/` directory
- Mocha + Chai + `sinon` for testing (sinon stubs for all dependency mocking)
- `esmock` for mocking ES module dependencies — paths in `esmock()` calls must use `.js` extensions even though source files are `.ts`
- Tests use `ts-node` for TypeScript execution (see `.mocharc.json`)
- 60-second timeout for all tests
- `npm run test:coverage` — run with c8 coverage (50% minimum threshold enforced)
- `posttest` automatically runs `npm run lint` after tests pass — a clean test run requires lint to pass too

### Test patterns

Commands are instantiated directly with `new CommandClass([...args], {configDir, root, runHook})`:

```typescript
const cmd = new IssueGet(['123456789', '--toon'], {
  configDir: '/tmp/test-config',
  root: process.cwd(),
  runHook: stub().resolves({failures: [], successes: []}),
} as any)
```

All dependencies are mocked via `esmock` with sinon stubs in `beforeEach`:

```typescript
const imported = await esmock('../../../../src/commands/sentry/issue/get.js', {
  '../../../../src/config.js': {readConfig: readConfigStub},
  '../../../../src/sentry/sentry-client.js': {clearClients: clearClientsStub, getIssue: getIssueStub},
})
IssueGet = imported.default
```

- When instantiating a command in tests, **the arg array order must match the `static args` definition order** exactly, since oclif assigns positional args by position
- `configDir` is needed in the constructor options for any command that calls `readConfig`

### Linting quirks

- The `unicorn/no-useless-undefined` rule flags `stub.calledWith(undefined)` — use `stub.firstCall.args[0] === undefined` instead
- Every `eslint-disable` comment needs a `--` description (`@eslint-community/eslint-comments/require-description`), and unused disable directives are reported as errors
- `eslint.config.mjs` relaxes the stricter `eslint-config-oclif@7` rules: type-aware rules are disabled for `test/**`, plus targeted per-directory rule overrides for `src/**`. Add new relaxations there rather than sprinkling inline disables

### End-to-end tests

`test/e2e/**` runs the built `bin/run.js` as a real subprocess against the live
Sentry organization. It is excluded from `npm test` and needs credentials
exported first, because nothing in this repo loads `.env`:

```bash
set -a; . ./.env; set +a
npm run test:e2e              # build, run, then sweep
npm run test:e2e -- --keep    # leave sandboxes behind for inspection
npm run e2e:mocha             # run without rebuilding
npm run e2e:sweep             # delete sandboxes older than an hour
```

`e2e:sweep` also deletes the _current_ run's sandboxes when `E2E_RUN_ID` is set
— `scripts/e2e.sh` and the CI workflow both set it, so a mocha killed before
its `after` hooks ran (a job timeout, a local Ctrl-C) still gets cleaned up
instead of waiting an hour for the stale sweep to reach it.

Rules specific to this suite:

- **Fixtures are created with raw `fetch` in `test/e2e/fixtures.ts`, never
  through the CLI** — they are the oracle the CLI is checked against. Events
  are ingested through the project's default client-key DSN (the envelope
  endpoint rejects bearer tokens).
- **Every sandbox is named `e2e-sandbox-<run id>`** (plus a per-file suffix).
  Both cleanup paths filter the org project listing by that prefix —
  structurally, once — so nothing outside `e2e-sandbox-*` is ever created or
  deleted. Deleting the project is the cleanup: Sentry has no issue-delete API.
- **Seeded events must differ in their exception value**, or Sentry groups
  them into one issue. Issue grouping and the issue's event listing stabilize
  at slightly different times — tests poll via `waitForIssues` /
  `waitForIssueEvents` rather than reading once.
- **Never assert on error message text.** Assert on exit codes, `success`,
  and the API `detail` substring.
- **Assignment keys on the user id** — `--assigned-to user:<user id>`, from
  the nested `user.id` of `/organizations/{org}/users/`, not the member id.

Pinned-as-observed CLI behaviour (deliberate-change markers, not bugs to work
around silently):

- API failures carry `success: false` in the JSON payload but still **exit 0**
  (`sentry org --profile broken` → `{error: {detail: 'Invalid token'},
  success: false}`).
- `sentry issue update` prints nothing in JSON mode; success is read from the
  exit code plus a read-back.
- `sentry project events` answers `[]` for envelope-ingested error events even
  when the same event is visible via the issue it grouped into.
- `sentry auth list` renders the API token in plaintext.
- `sentry org issues --cursor` is not surfaced in the payload, so pagination
  round-trips are untestable end-to-end; `--limit` is covered instead.

## Output Formatting

- Default: JSON via `this.logJson()`
- TOON format: Custom token-oriented format via `formatAsToon()` (using `@toon-format/toon`)
- Use `--toon` flag to enable TOON output

## Dependencies

- **@oclif/core** - CLI framework
- **@toon-format/toon** - TOON output format
- **@inquirer/prompts** - Interactive prompts
- **fs-extra** - File system utilities

## Important Notes

- All command files use ES modules (`.js` extensions in imports)
- API uses native `fetch` (Node.js 18+) — no axios dependency
- Pre-commit hook runs format and dead code detection
- Uses `shx` for cross-platform shell commands
- Node.js >=18.0.0 required
- Published as npm package `sentry`

## Commit Message Convention

**Always use Conventional Commits format** for all commit messages and PR titles:

- `feat:` - New features or capabilities
- `fix:` - Bug fixes
- `docs:` - Documentation changes only
- `refactor:` - Code refactoring without changing functionality
- `test:` - Adding or modifying tests
- `chore:` - Maintenance tasks, dependency updates, build configuration

**Examples:**

```
feat: add list-org-issues command
fix: handle connection timeout errors gracefully
docs: update configuration examples in README
refactor: extract query string building into helper
test: add integration tests for sentry API
chore: remove test.js dependency
```
