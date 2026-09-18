import {expect} from 'chai'

import {cleanupRun, createSandbox, findAssignee, type Sandbox, type SeededIssue, seedEvent, waitForIssues} from './fixtures.js'
import {createConfigDir, removeConfigDir, runCli, runCliJson} from './helpers.js'

type SingleIssue = {
  data: {
    assignedTo: undefined | {id: string}
    isBookmarked: boolean
    status: string
  }
  success: boolean
}

// The tests below form a state machine over one seeded issue and rely on
// mocha's serial, in-order execution — each test reads back the previous
// test's write before making its own.
describe('e2e: issue lifecycle', () => {
  let configDir: string
  let sandbox: Sandbox
  let issue: SeededIssue

  before(async () => {
    configDir = await createConfigDir()
    sandbox = await createSandbox('lifecycle')
    await seedEvent(sandbox.projectSlug)
    issue = (await waitForIssues(sandbox.projectSlug, 1))[0]!
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

  // Observed: `sentry issue update` prints nothing in JSON mode — its result
  // is returned, not logged — so success is read from the exit code plus a
  // read-back of the issue.
  it('resolves the seeded issue and reads it back', async () => {
    const {code} = await runCli(['sentry', 'issue', 'update', issue.id, '--status', 'resolved'], configDir)
    expect(code, 'update should exit 0').to.equal(0)

    const payload = await runCliJson<SingleIssue>(['sentry', 'issue', issue.id], configDir)
    expect(payload.success).to.be.true
    expect(payload.data.status).to.equal('resolved')
  })

  it('reopens the issue', async () => {
    const {code} = await runCli(['sentry', 'issue', 'update', issue.id, '--status', 'unresolved'], configDir)
    expect(code).to.equal(0)

    const payload = await runCliJson<SingleIssue>(['sentry', 'issue', issue.id], configDir)
    expect(payload.data.status).to.equal('unresolved')
  })

  it('bookmarks and unbookmarks the issue', async () => {
    const {code} = await runCli(['sentry', 'issue', 'update', issue.id, '--is-bookmarked'], configDir)
    expect(code).to.equal(0)

    const bookmarked = await runCliJson<SingleIssue>(['sentry', 'issue', issue.id], configDir)
    expect(bookmarked.data.isBookmarked).to.be.true

    const {code: secondCode} = await runCli(['sentry', 'issue', 'update', issue.id, '--no-is-bookmarked'], configDir)
    expect(secondCode).to.equal(0)

    const unbookmarked = await runCliJson<SingleIssue>(['sentry', 'issue', issue.id], configDir)
    expect(unbookmarked.data.isBookmarked).to.be.false
  })

  it('assigns the issue to the token owner and reads the assignee back', async () => {
    const actor = await findAssignee()

    const {code} = await runCli(['sentry', 'issue', 'update', issue.id, '--assigned-to', actor], configDir)
    expect(code).to.equal(0)

    const payload = await runCliJson<SingleIssue>(['sentry', 'issue', issue.id], configDir)
    expect(payload.data.assignedTo, 'issue should have an assignee').to.exist
    expect(payload.data.assignedTo!.id).to.equal(actor.replace('user:', ''))
  })
})
