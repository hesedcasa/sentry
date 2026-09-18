import {expect} from 'chai'

import {
  cleanupRun,
  createSandbox,
  deleteSandbox,
  projectHttpStatus,
  RUN_ID,
  seedEvent,
  sweepStale,
  waitForIssues,
} from './fixtures.js'

describe('e2e: fixtures', () => {
  it('seeds an event whose issue becomes visible, then cleans up', async () => {
    const sandbox = await createSandbox()
    const {eventId} = await seedEvent(sandbox.projectSlug)
    expect(eventId).to.be.a('string')

    const issues = await waitForIssues(sandbox.projectSlug, 1)
    expect(issues).to.have.lengthOf(1)
    expect(issues[0]!.title, `unexpected issue title: ${issues[0]!.title}`).to.contain(RUN_ID)

    await cleanupRun()

    expect(await projectHttpStatus(sandbox.projectSlug), 'sandbox project should be gone').to.equal(404)
  })

  it('cleans up a sandbox that never received events', async () => {
    // No seeding here: that is the point. cleanup must not depend on event
    // visibility, only on the sandbox projects this run created.
    const sandbox = await createSandbox()
    await cleanupRun()

    const status = await projectHttpStatus(sandbox.projectSlug)
    expect(status, `${sandbox.projectSlug} should be gone, got HTTP ${status}`).to.equal(404)
  })

  it('tolerates deleting a sandbox twice', async () => {
    const sandbox = await createSandbox()
    await deleteSandbox(sandbox.projectSlug)
    await cleanupRun()
  })

  it('sweeps without touching a young sandbox', async () => {
    // The one-hour cutoff cannot be tested by backdating (dateCreated is
    // server-side), but the inverse is cheap to pin: a fresh sandbox must
    // survive a sweep, otherwise a sweep running beside a live suite could
    // reclaim its fixtures.
    const sandbox = await createSandbox()
    try {
      await sweepStale()
      expect(await projectHttpStatus(sandbox.projectSlug)).to.equal(200)
    } finally {
      await deleteSandbox(sandbox.projectSlug)
    }
  })

  after(async () => {
    await cleanupRun()
  })
})
