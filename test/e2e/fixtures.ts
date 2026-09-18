import {randomBytes, randomUUID} from 'node:crypto'

import {requireEnv, resolveOrg} from './helpers.js'

/**
 * One run id per mocha process, so concurrent runs never delete each other's
 * sandboxes.
 *
 * E2E_RUN_ID overrides it so a *separate* process can address this run's
 * sandboxes by name — `scripts/e2e.sh` and the CI workflow both set it, which
 * is what lets their post-run sweep reclaim sandboxes a killed mocha never got
 * to clean up.
 */
export const RUN_ID = process.env.E2E_RUN_ID || randomBytes(4).toString('hex')
/** Name/slug prefix carried by every sandbox ever created, so crashed runs can be reclaimed later. */
export const RUN_PREFIX = 'e2e-sandbox-'
/** The name (and therefore slug) shared by this run's sandboxes. */
export const RUN_NAME = RUN_PREFIX + sanitizeSlug(RUN_ID)

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .split('')
    .map((char) => (/^[a-z0-9-]$/.test(char) ? char : '-'))
    .join('')
}

export type Sandbox = {
  organization: string
  projectId: number
  projectSlug: string
  teamSlug: string
}

export type SeededIssue = {
  id: string
  title: string
}

type SentryResponse = {body: unknown; link: string | undefined; status: number}

/**
 * Sandboxes created by this process, as a fallback for `cleanupRun`.
 *
 * The organization project listing has no indexing lag, but listing by name in
 * a different process (the post-run sweep) can only match the run name and its
 * suffixed variants — the tracked set is what makes cleanup exact for this
 * process.
 */
const created = new Set<string>()

async function call(method: string, endpoint: string, body?: unknown): Promise<SentryResponse> {
  const {apiToken, host} = requireEnv()

  const response = await fetch(host + endpoint, {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${apiToken}`,
      ...(body !== undefined && {'content-type': 'application/json'}),
    },
    method,
  })

  const text = await response.text()
  return {
    body: text ? JSON.parse(text) : null,
    link: response.headers.get('link') ?? undefined,
    status: response.status,
  }
}

/**
 * Extracts the next page's cursor from a Sentry `Link` response header, or
 * undefined when the response is the last page.
 *
 * Sentry paginates with a header shaped like:
 * `<https://sentry.io/api/0/...?cursor=0:100:0>; rel="next"; results="true"`.
 * The `results` attribute is the real end-of-pages signal: the final page's
 * response still carries a `rel="next"` link, but marked `results="false"` —
 * following that one anyway would request the same empty page forever.
 */
function nextCursor(link: string | undefined): string | undefined {
  if (!link) return undefined

  for (const part of link.split(',')) {
    if (!part.includes('rel="next"') || part.includes('results="false"')) continue

    const url = /<([^>]+)>/.exec(part)?.[1]
    return url ? (new URL(url).searchParams.get('cursor') ?? undefined) : undefined
  }

  return undefined
}

/**
 * Creates a sandbox team + project for this run via the REST API directly.
 *
 * Fixtures are never created through the CLI: they are the oracle the CLI is
 * checked against, so they must not share its code path.
 *
 * The team and the project share one name, so deleting a sandbox by slug
 * removes both even from a process that never saw the creation response.
 * An optional suffix lets each suite file own a distinct sandbox — project
 * slugs are organization-unique, so a second unnamed sandbox would collide
 * with the first.
 *
 * @param suffix Optional distinguishing suffix, sanitized into the name.
 * @returns The created sandbox.
 */
export async function createSandbox(suffix?: string): Promise<Sandbox> {
  const organization = await resolveOrg()
  const name = suffix ? `${RUN_NAME}-${sanitizeSlug(suffix)}` : RUN_NAME

  const teamResponse = await call('POST', `/organizations/${organization}/teams/`, {name})
  if (teamResponse.status !== 201) {
    throw new Error(`createSandbox team failed: ${teamResponse.status} ${JSON.stringify(teamResponse.body)}`)
  }

  const teamSlug = (teamResponse.body as {slug: string}).slug

  const projectResponse = await call('POST', `/teams/${organization}/${teamSlug}/projects/`, {
    name,
    platform: 'node',
  })
  if (projectResponse.status !== 201) {
    // The team is ours and useless without its project — reclaim it before failing.
    await call('DELETE', `/organizations/${organization}/teams/${teamSlug}/`)
    throw new Error(`createSandbox project failed: ${projectResponse.status} ${JSON.stringify(projectResponse.body)}`)
  }

  const project = projectResponse.body as {id: number; slug: string}
  created.add(project.slug)

  return {organization, projectId: project.id, projectSlug: project.slug, teamSlug}
}

/**
 * Ingests one synthetic error event into the sandbox via the project's
 * default client key DSN — the same envelope path a real SDK uses.
 *
 * @param projectSlug The sandbox project's slug.
 * @param overrides Extra or replacement fields for the event payload.
 * @returns The ingested event's id.
 */
export async function seedEvent(
  projectSlug: string,
  overrides: Record<string, unknown> = {},
): Promise<{eventId: string}> {
  const organization = await resolveOrg()

  const keys = await call('GET', `/projects/${organization}/${projectSlug}/keys/`)
  if (keys.status !== 200 || !Array.isArray(keys.body) || keys.body.length === 0) {
    throw new Error(`seedEvent keys failed: ${keys.status} ${JSON.stringify(keys.body)}`)
  }

  const dsnUrl = new URL((keys.body[0] as {dsn: {public: string}}).dsn.public)

  const eventId = randomUUID().replaceAll('-', '')
  const payload = {
    environment: 'e2e',
    exception: {values: [{type: 'Error', value: `[e2e ${RUN_ID}] fixture`}]},
    level: 'error',
    logger: 'e2e',
    message: {formatted: `[e2e ${RUN_ID}] fixture`},
    platform: 'node',
    tags: {e2e_run: RUN_ID},
    ...overrides,
  }
  const envelope = [
    JSON.stringify({event_id: eventId, sent_at: new Date().toISOString()}),
    JSON.stringify({type: 'event'}),
    JSON.stringify(payload),
  ].join('\n')

  const ingestResponse = await fetch(
    `${dsnUrl.origin}/api/${dsnUrl.pathname.replaceAll('/', '')}/envelope/?sentry_key=${dsnUrl.username}`,
    {body: `${envelope}\n`, headers: {'content-type': 'application/x-sentry-envelope'}, method: 'POST'},
  )
  if (!ingestResponse.ok) {
    throw new Error(`seedEvent ingest failed: ${ingestResponse.status} ${await ingestResponse.text()}`)
  }

  return {eventId}
}

/**
 * Polls until the expected number of issues is visible in the sandbox project.
 *
 * Sentry groups ingested events asynchronously — a seeded event took roughly
 * six seconds to surface as an issue — so a single read would race.
 *
 * @param projectSlug The sandbox project's slug.
 * @param expected How many issues should be visible.
 * @returns The visible issues.
 * @throws {Error} If the deadline passes before `expected` issues are visible
 *   — a silent return here would let a `before` hook "succeed" with nothing
 *   seeded and defer the real failure into a confusing assertion error later.
 */
export async function waitForIssues(projectSlug: string, expected: number): Promise<SeededIssue[]> {
  const organization = await resolveOrg()
  // Below mocha's 60-second per-test timeout (package.json): this deadline
  // must lose the race against it on purpose, so a slow ingest surfaces as
  // this descriptive error instead of a generic "timeout of 60000ms exceeded".
  const deadline = Date.now() + 45_000
  let issues: SeededIssue[] = []

  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop -- sequential polling is the point: each check must follow the previous wait
    const response = await call('GET', `/projects/${organization}/${projectSlug}/issues/`)
    if (response.status !== 200) {
      throw new Error(`waitForIssues failed: ${response.status} ${JSON.stringify(response.body)}`)
    }

    issues = (response.body as Array<{id: string; title: string}>).map((issue) => ({
      id: issue.id,
      title: issue.title,
    }))
    if (issues.length >= expected) return issues
    // eslint-disable-next-line no-await-in-loop -- see above
    await new Promise((resolve) => {
      setTimeout(resolve, 1500)
    })
  }

  throw new Error(`waitForIssues: expected ${expected} issue(s) in "${projectSlug}", but saw ${issues.length}`)
}

/**
 * Polls until an issue's event listing is non-empty.
 *
 * Issue grouping and its event listing stabilize at slightly different times
 * — an issue can be visible while `issues/{id}/events/` still answers [] —
 * so a single read after `waitForIssues` would race.
 *
 * @param issueId The issue id.
 * @param expected How many events should be visible.
 * @returns The visible event ids.
 * @throws {Error} If the deadline passes before `expected` events are visible.
 */
export async function waitForIssueEvents(issueId: string, expected = 1): Promise<string[]> {
  const deadline = Date.now() + 30_000
  let eventIds: string[] = []

  while (Date.now() < deadline) {
    // eslint-disable-next-line no-await-in-loop -- sequential polling is the point
    eventIds = await issueEventIds(issueId)
    if (eventIds.length >= expected) return eventIds
    // eslint-disable-next-line no-await-in-loop -- see above
    await new Promise((resolve) => {
      setTimeout(resolve, 1500)
    })
  }

  throw new Error(`waitForIssueEvents: expected ${expected} event(s) on issue ${issueId}, but saw ${eventIds.length}`)
}

/**
 * Finds an assignable actor for lifecycle tests.
 *
 * Assignment keys on the *user* id (`user:<userId>`); the member listing's
 * outer id is a different one — an earlier `user:<memberId>` variant is
 * rejected with "User does not exist" — so the nested user id is the one to
 * hand out.
 *
 * @returns An actor reference in the `user:<id>` form `--assigned-to` accepts.
 */
export async function findAssignee(): Promise<string> {
  const organization = await resolveOrg()
  const {body, status} = await call('GET', `/organizations/${organization}/users/`)
  if (status !== 200 || !Array.isArray(body) || body.length === 0) {
    throw new Error(`findAssignee failed: ${status} ${JSON.stringify(body)}`)
  }

  const user = (body[0] as {id: string; user?: {id?: string};}).user ?? {id: body[0].id}
  if (!user.id) {
    throw new Error('findAssignee: member listing carried no user id')
  }

  return `user:${user.id}`
}

/**
 * Reads an issue's event ids straight from the REST API.
 *
 * The oracle-side counterpart of `sentry issue events` — a test that needs to
 * know which events belong to an issue asks here, not through the CLI.
 *
 * @param issueId The issue id.
 * @returns The event ids visible on the issue.
 */
export async function issueEventIds(issueId: string): Promise<string[]> {
  const organization = await resolveOrg()
  const {body, status} = await call('GET', `/organizations/${organization}/issues/${issueId}/events/`)
  if (status !== 200) {
    throw new Error(`issueEventIds failed: ${status} ${JSON.stringify(body)}`)
  }

  return (body as Array<{id: string}>).map((event) => event.id)
}

/**
 * Reads a sandbox project's HTTP status straight from the REST API.
 *
 * @param projectSlug The project slug.
 * @returns The status code: 200 if the project is there, 404 once it is gone.
 */
export async function projectHttpStatus(projectSlug: string): Promise<number> {
  const organization = await resolveOrg()
  const {status} = await call('GET', `/projects/${organization}/${projectSlug}/`)
  return status
}

/**
 * Deletes a sandbox project and its team, tolerating either being already
 * gone (deleting a project cascades to its team server-side, which can still
 * be pending deletion from an earlier delete).
 *
 * @param projectSlug The sandbox project's slug.
 */
export async function deleteSandbox(projectSlug: string): Promise<void> {
  const organization = await resolveOrg()

  const project = await call('DELETE', `/projects/${organization}/${projectSlug}/`)
  if (project.status !== 204 && project.status !== 404) {
    throw new Error(`deleteSandbox project ${projectSlug} failed: ${project.status}`)
  }

  const team = await call('DELETE', `/organizations/${organization}/teams/${projectSlug}/`)
  if (team.status !== 204 && team.status !== 404) {
    throw new Error(`deleteSandbox team ${projectSlug} failed: ${team.status}`)
  }

  created.delete(projectSlug)
}

/**
 * Deletes every sandbox created by this process, plus any project carrying
 * this run's name or one of its suffixed per-suite variants (`RUN_NAME-read`,
 * `RUN_NAME-lifecycle`, …).
 *
 * The name-based half still matters — with E2E_RUN_ID set, a sweep running in
 * a different process than mocha has an empty `created` set and the run name
 * is all it has to go on. Matching the suffixed variants is what keeps a
 * killed mocha's per-suite sandboxes from outliving the immediate post-run
 * sweep and waiting out the one-hour stale cutoff instead.
 */
export async function cleanupRun(): Promise<void> {
  const slugs = new Set(created)
  for (const project of await listSandboxProjects()) {
    if (
      project.slug === RUN_NAME ||
      project.slug.startsWith(`${RUN_NAME}-`) ||
      project.name === RUN_NAME ||
      project.name.startsWith(`${RUN_NAME}-`)
    ) {
      slugs.add(project.slug)
    }
  }

  for (const slug of slugs) {
    // eslint-disable-next-line no-await-in-loop -- deletions are best-effort and individually slow; failing fast orphans the rest
    await deleteSandbox(slug)
  }
}

/**
 * Deletes sandbox projects older than an hour, left behind by a crashed run.
 *
 * The age filter is what makes this safe to run while another suite is in
 * flight: it can only ever reclaim sandboxes no live run still owns.
 *
 * @returns How many sandboxes were deleted.
 */
export async function sweepStale(): Promise<number> {
  const cutoff = Date.now() - 3_600_000
  const stale = (await listSandboxProjects()).filter((project) => Date.parse(project.dateCreated) < cutoff)

  for (const project of stale) {
    // eslint-disable-next-line no-await-in-loop -- see cleanupRun
    await deleteSandbox(project.slug)
  }

  return stale.length
}

/**
 * Lists this organization's sandbox projects.
 *
 * Always scoped to the `e2e-sandbox-` prefix. Both `cleanupRun` and
 * `sweepStale` are destructive queries driven by ambient environment variables
 * with no other guard, so filtering every lookup to the prefix here —
 * structurally, once — bounds their blast radius to sandboxes instead of every
 * project the credentials can see.
 *
 * Follows every page: a single-page read would make sandboxes beyond the
 * first page invisible to both run cleanup and stale sweeping.
 */
async function listSandboxProjects(): Promise<Array<{dateCreated: string; name: string; slug: string}>> {
  const organization = await resolveOrg()
  const sandboxes: Array<{dateCreated: string; name: string; slug: string}> = []
  let cursor: string | undefined

  do {
    const query = cursor === undefined ? '' : `?cursor=${encodeURIComponent(cursor)}`
    // eslint-disable-next-line no-await-in-loop -- pagination is inherently sequential: each page's cursor comes from the previous response
    const {body, link, status} = await call('GET', `/organizations/${organization}/projects/${query}`)
    if (status !== 200) {
      throw new Error(`listSandboxProjects failed: ${status} ${JSON.stringify(body)}`)
    }

    sandboxes.push(
      ...(body as Array<{dateCreated: string; name: string; slug: string}>).filter((project) =>
        project.slug.startsWith(RUN_PREFIX),
      ),
    )
    cursor = nextCursor(link)
  } while (cursor !== undefined)

  return sandboxes
}
