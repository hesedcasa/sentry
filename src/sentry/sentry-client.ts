import {type ApiResult, type Config, SentryApi} from './sentry-api.js'

let sentryApi: null | SentryApi = null

function initSentry(config: Config): SentryApi {
  if (!sentryApi) {
    sentryApi = new SentryApi(config)
  }

  return sentryApi
}

export function clearClients(): void {
  if (sentryApi) {
    sentryApi.clearClients()
    sentryApi = null
  }
}

export async function testConnection(config: Config): Promise<ApiResult> {
  const api = initSentry(config)
  return api.testConnection()
}

export async function listOrgIssues(
  config: Config,
  params?: {
    cursor?: string
    end?: string
    environment?: string[]
    limit?: number
    project?: number[]
    query?: string
    sort?: string
    start?: string
    statsPeriod?: string
  },
): Promise<ApiResult> {
  const api = initSentry(config)
  return api.listOrgIssues(params)
}

export async function getIssue(config: Config, issueId: string): Promise<ApiResult> {
  const api = initSentry(config)
  return api.getIssue(issueId)
}

export async function updateIssue(
  config: Config,
  issueId: string,
  data: {
    assignedTo?: string
    hasSeen?: boolean
    isBookmarked?: boolean
    isPublic?: boolean
    isSubscribed?: boolean
    status?: string
    statusDetails?: Record<string, unknown>
  },
): Promise<ApiResult> {
  const api = initSentry(config)
  return api.updateIssue(issueId, data)
}

export async function listIssueEvents(
  config: Config,
  issueId: string,
  params?: {
    cursor?: string
    end?: string
    environment?: string[]
    full?: boolean
    start?: string
    statsPeriod?: string
  },
): Promise<ApiResult> {
  const api = initSentry(config)
  return api.listIssueEvents(issueId, params)
}

export async function getIssueEvent(config: Config, issueId: string, eventId: string): Promise<ApiResult> {
  const api = initSentry(config)
  return api.getIssueEvent(issueId, eventId)
}

export async function listIssueHashes(config: Config, issueId: string, params?: {cursor?: string}): Promise<ApiResult> {
  const api = initSentry(config)
  return api.listIssueHashes(issueId, params)
}

export async function getTagDetails(
  config: Config,
  issueId: string,
  tagKey: string,
  params?: {environment?: string[]},
): Promise<ApiResult> {
  const api = initSentry(config)
  return api.getTagDetails(issueId, tagKey, params)
}

export async function listTagValues(
  config: Config,
  issueId: string,
  tagKey: string,
  params?: {cursor?: string; environment?: string[]},
): Promise<ApiResult> {
  const api = initSentry(config)
  return api.listTagValues(issueId, tagKey, params)
}

export async function listProjectEvents(
  config: Config,
  projectSlug: string,
  params?: {
    cursor?: string
    end?: string
    full?: boolean
    start?: string
    statsPeriod?: string
  },
): Promise<ApiResult> {
  const api = initSentry(config)
  return api.listProjectEvents(projectSlug, params)
}

export async function listProjectIssues(
  config: Config,
  projectSlug: string,
  params?: {
    cursor?: string
    query?: string
    shortIdLookup?: boolean
    statsPeriod?: string
  },
): Promise<ApiResult> {
  const api = initSentry(config)
  return api.listProjectIssues(projectSlug, params)
}

export async function getEvent(config: Config, projectSlug: string, eventId: string): Promise<ApiResult> {
  const api = initSentry(config)
  return api.getEvent(projectSlug, eventId)
}

export async function debugSourceMaps(
  config: Config,
  projectSlug: string,
  eventId: string,
  params?: {exception_idx?: string; frame_idx?: string},
): Promise<ApiResult> {
  const api = initSentry(config)
  return api.debugSourceMaps(projectSlug, eventId, params)
}
