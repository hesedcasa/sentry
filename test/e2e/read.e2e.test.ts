import {expect} from 'chai'

import {
  cleanupRun,
  createSandbox,
  RUN_ID,
  type Sandbox,
  type SeededIssue,
  seedEvent,
  waitForIssueEvents,
  waitForIssues,
} from './fixtures.js'
import {createConfigDir, removeConfigDir, runCliJson, runCliOk} from './helpers.js'

type IssuePayload = {data: SeededIssue[] | unknown[]; success: boolean}
type SingleIssue = {data: {id: string; title: string}; success: boolean}

describe('e2e: read paths', () => {
  let configDir: string
  let sandbox: Sandbox
  let emptySandbox: Sandbox
  let issues: SeededIssue[]
  const seededEventIds: string[] = []

  before(async () => {
    configDir = await createConfigDir()
    sandbox = await createSandbox('read')

    // Two issues, not one: with a single issue a --limit 1 assertion passes
    // whether or not --limit works. The two events must differ in their
    // exception value, or Sentry groups them into one issue.
    const firstEventId = (await seedEvent(sandbox.projectSlug)).eventId
    const secondEvent = await seedEvent(sandbox.projectSlug, {
      exception: {values: [{type: 'Error', value: `[e2e second] fixture`}]},
      message: {formatted: `[e2e second] fixture`},
    })
    seededEventIds.push(firstEventId, secondEvent.eventId)
    issues = await waitForIssues(sandbox.projectSlug, 2)

    emptySandbox = await createSandbox('read-empty')
  })

  // finally: a failed cleanup must not leave the token-bearing config dir
  // on disk.
  after(async () => {
    try {
      await cleanupRun()
    } finally {
      await removeConfigDir(configDir)
    }
  })

  it('lists the seeded issues for the sandbox project', async () => {
    const payload = await runCliJson<IssuePayload>(['sentry', 'project', 'issues', sandbox.projectSlug], configDir)
    expect(payload.success).to.be.true

    const ids = (payload.data as SeededIssue[]).map((issue) => issue.id)
    expect(ids).to.have.members(issues.map((issue) => issue.id))
  })

  it('returns an empty issue list for an eventless project and still succeeds', async () => {
    const payload = await runCliJson<IssuePayload>(['sentry', 'project', 'issues', emptySandbox.projectSlug], configDir)
    expect(payload.success).to.be.true
    expect(payload.data).to.deep.equal([])
  })

  // Pinned as observed: this endpoint answers [] for envelope-ingested error
  // events even when the same event is visible via the issue it grouped into.
  // Shaped as an array assertion rather than pinned-empty so a future fix
  // that starts surfacing events there does not break the suite.
  it('lists project events', async () => {
    const payload = await runCliJson<IssuePayload>(['sentry', 'project', 'events', sandbox.projectSlug], configDir)
    expect(payload.success).to.be.true
    expect(payload.data).to.be.an('array')
  })

  it('returns an empty event list for an eventless project', async () => {
    const payload = await runCliJson<IssuePayload>(['sentry', 'project', 'events', emptySandbox.projectSlug], configDir)
    expect(payload.success).to.be.true
    expect(payload.data).to.deep.equal([])
  })

  it('gets an issue whose title carries the run marker', async () => {
    const payload = await runCliJson<SingleIssue>(['sentry', 'issue', issues[0]!.id], configDir)
    expect(payload.success).to.be.true
    expect(payload.data.id).to.equal(issues[0]!.id)
    expect(payload.data.title).to.contain('e2e')
  })

  it("lists an issue's events, matching the fixture oracle", async () => {
    const issueId = issues[0]!.id
    // One issue per distinct exception value: issue 0 carries only its own
    // seeded event, and the listing itself stabilizes slightly after the
    // issue appears, hence the poll.
    const eventIds = await waitForIssueEvents(issueId, 1)
    expect(eventIds).to.have.lengthOf(1)

    const payload = await runCliJson<IssuePayload>(['sentry', 'issue', 'events', issueId], configDir)
    expect(payload.success).to.be.true
    const ids = (payload.data as Array<{id: string}>).map((event) => event.id)
    expect(ids).to.deep.equal(eventIds)
  })

  it("retrieves an issue's latest event", async () => {
    const issueId = issues[0]!.id
    const eventIds = await waitForIssueEvents(issueId, 1)

    const payload = await runCliJson<{data: {id: string}; success: boolean}>(
      ['sentry', 'issue', 'event', issueId, 'latest'],
      configDir,
    )
    expect(payload.success).to.be.true
    expect(eventIds).to.include(payload.data.id)
  })

  it('retrieves a project event by its id', async () => {
    const payload = await runCliJson<{data: {id: string}; success: boolean}>(
      ['sentry', 'event', sandbox.projectSlug, seededEventIds[0]!],
      configDir,
    )
    expect(payload.success).to.be.true
    expect(payload.data.id).to.equal(seededEventIds[0])
  })

  it("lists an issue's hashes", async () => {
    const payload = await runCliJson<IssuePayload>(['sentry', 'issue', 'hashes', issues[0]!.id], configDir)
    expect(payload.success).to.be.true
    expect(payload.data).to.be.an('array').that.is.not.empty
  })

  it('shows tag details for a standard tag', async () => {
    const payload = await runCliJson<{data: {key: string; totalValues: number}; success: boolean}>(
      ['sentry', 'issue', 'tag', issues[0]!.id, 'level'],
      configDir,
    )
    expect(payload.success).to.be.true
    expect(payload.data.key).to.equal('level')
    expect(payload.data.totalValues).to.be.greaterThan(0)
  })

  it('lists values for the custom e2e_run tag', async () => {
    const payload = await runCliJson<{data: Array<{value: string}>; success: boolean}>(
      ['sentry', 'issue', 'tag-values', issues[0]!.id, 'e2e_run'],
      configDir,
    )
    expect(payload.success).to.be.true
    expect(payload.data.map((value) => value.value)).to.include(RUN_ID)
  })

  it('scopes org issues to a project with --project', async () => {
    const payload = await runCliJson<IssuePayload>(
      ['sentry', 'org', '--project', String(sandbox.projectId)],
      configDir,
    )
    expect(payload.success).to.be.true

    const ids = (payload.data as SeededIssue[]).map((issue) => issue.id)
    expect(ids).to.include.members(issues.map((issue) => issue.id))
  })

  // Scoped to this file's own sandbox so the count is deterministic.
  it('honours --limit', async () => {
    const payload = await runCliJson<IssuePayload>(
      ['sentry', 'org', '--project', String(sandbox.projectId), '--limit', '1'],
      configDir,
    )
    expect(payload.success).to.be.true
    expect(payload.data).to.have.lengthOf(1)
  })

  it('emits TOON rather than JSON under --toon', async () => {
    const {stdout} = await runCliOk(['sentry', 'project', 'issues', sandbox.projectSlug, '--toon'], configDir)
    expect(() => JSON.parse(stdout)).to.throw()
    expect(stdout).to.contain('success: true')
  })
})
