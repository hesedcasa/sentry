import {cleanupRun, RUN_NAME, sweepStale} from '../test/e2e/fixtures.js'

// With E2E_RUN_ID set, this process shares a sandbox name with the mocha run
// that just finished, so it can reclaim that run's sandboxes directly. That is
// what covers a mocha killed before its `after` hooks ran — the job timeout in
// the CI workflow, or a local Ctrl-C — whose sandboxes are far too young for
// sweepStale's one-hour cutoff to touch.
if (process.env.E2E_RUN_ID) {
  await cleanupRun()
  console.log(`Cleaned up sandboxes named "${RUN_NAME}".`)
}

const deleted = await sweepStale()
console.log(`Swept ${deleted} stale e2e sandbox(es).`)
