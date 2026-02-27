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

**Argument ordering convention:** When the first positional argument is not alphabetically first, wrap the `args` block with eslint-disable comments:

```typescript
/* eslint-disable perfectionist/sort-objects */
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
- Mocha + Chai for testing
- `esmock` for mocking dependencies
- Tests use `ts-node` for TypeScript execution (see `.mocharc.json`)
- 60-second timeout for all tests
- Use `createMockConfig()` from `test/helpers/config-mock.ts` to mock oclif's `Config` object
- When instantiating a command in tests, **the arg array order must match the `static args` definition order** exactly, since oclif assigns positional args by position

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
chore: remove jira.js dependency
```
