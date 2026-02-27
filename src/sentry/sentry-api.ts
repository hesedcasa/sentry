/**
 * Generic API result
 */
export interface ApiResult {
  data?: unknown
  error?: unknown
  success: boolean
}

export interface Config {
  authToken: string
  host: string
  organization: string
}

/**
 * Sentry REST API client
 */
export class SentryApi {
  private config: Config

  constructor(config: Config) {
    this.config = config
  }

  /**
   * Clear client (no persistent client for REST API)
   */
  clearClients(): void {}

  /**
   * Debug source maps for a project event
   */
  async debugSourceMaps(
    projectSlug: string,
    eventId: string,
    params?: {exception_idx?: string; frame_idx?: string},
  ): Promise<ApiResult> {
    return this.request(`/projects/${this.config.organization}/${projectSlug}/events/${eventId}/source-map-debug/`, {
      params,
    })
  }

  /**
   * Retrieve an event for a project
   */
  async getEvent(projectSlug: string, eventId: string): Promise<ApiResult> {
    return this.request(`/projects/${this.config.organization}/${projectSlug}/events/${eventId}/`)
  }

  /**
   * Retrieve an issue
   */
  async getIssue(issueId: string): Promise<ApiResult> {
    return this.request(`/organizations/${this.config.organization}/issues/${issueId}/`)
  }

  /**
   * Retrieve a specific event from an issue
   */
  async getIssueEvent(issueId: string, eventId: string): Promise<ApiResult> {
    return this.request(`/organizations/${this.config.organization}/issues/${issueId}/events/${eventId}/`)
  }

  /**
   * Retrieve tag details for an issue
   */
  async getTagDetails(issueId: string, tagKey: string, params?: {environment?: string[]}): Promise<ApiResult> {
    return this.request(`/organizations/${this.config.organization}/issues/${issueId}/tags/${tagKey}/`, {params})
  }

  /**
   * List an issue's events
   */
  async listIssueEvents(
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
    return this.request(`/organizations/${this.config.organization}/issues/${issueId}/events/`, {params})
  }

  /**
   * List an issue's hashes
   */
  async listIssueHashes(issueId: string, params?: {cursor?: string}): Promise<ApiResult> {
    return this.request(`/organizations/${this.config.organization}/issues/${issueId}/hashes/`, {params})
  }

  /**
   * List an organization's issues
   */
  async listOrgIssues(params?: {
    cursor?: string
    end?: string
    environment?: string[]
    limit?: number
    project?: number[]
    query?: string
    sort?: string
    start?: string
    statsPeriod?: string
  }): Promise<ApiResult> {
    return this.request(`/organizations/${this.config.organization}/issues/`, {params})
  }

  /**
   * List a project's events
   */
  async listProjectEvents(
    projectSlug: string,
    params?: {
      cursor?: string
      end?: string
      full?: boolean
      start?: string
      statsPeriod?: string
    },
  ): Promise<ApiResult> {
    return this.request(`/projects/${this.config.organization}/${projectSlug}/events/`, {params})
  }

  /**
   * List a project's issues
   */
  async listProjectIssues(
    projectSlug: string,
    params?: {
      cursor?: string
      query?: string
      shortIdLookup?: boolean
      statsPeriod?: string
    },
  ): Promise<ApiResult> {
    return this.request(`/projects/${this.config.organization}/${projectSlug}/issues/`, {params})
  }

  /**
   * List a tag's values for an issue
   */
  async listTagValues(
    issueId: string,
    tagKey: string,
    params?: {cursor?: string; environment?: string[]},
  ): Promise<ApiResult> {
    return this.request(`/organizations/${this.config.organization}/issues/${issueId}/tags/${tagKey}/values/`, {params})
  }

  /**
   * Test Sentry API connection
   */
  async testConnection(): Promise<ApiResult> {
    const result = await this.request(`/organizations/${this.config.organization}/issues/?limit=1`)

    if (result.success) {
      return {
        data: {baseUrl: this.config.host, organization: this.config.organization},
        success: true,
      }
    }

    return result
  }

  /**
   * Update an issue
   */
  async updateIssue(
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
    return this.request(`/organizations/${this.config.organization}/issues/${issueId}/`, {
      body: JSON.stringify(data),
      method: 'PUT',
    })
  }

  /**
   * Make an authenticated request to the Sentry API
   */
  private buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams()

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue

      if (Array.isArray(value)) {
        for (const item of value) searchParams.append(key, String(item))
      } else {
        searchParams.set(key, String(value))
      }
    }

    return searchParams.toString()
  }

  private async request(
    path: string,
    options?: {body?: string; method?: string; params?: Record<string, unknown>},
  ): Promise<ApiResult> {
    try {
      let url = `${this.config.host}${path}`

      if (options?.params) {
        const qs = this.buildQueryString(options.params)
        if (qs) url += `?${qs}`
      }

      const headers: Record<string, string> = {
        Accept: 'application/json',
        Authorization: `Bearer ${this.config.authToken}`,
      }

      if (options?.body) {
        headers['Content-Type'] = 'application/json'
      }

      // eslint-disable-next-line n/no-unsupported-features/node-builtins -- fetch is available in Node 18+
      const response = await fetch(url, {
        body: options?.body,
        headers,
        method: options?.method ?? 'GET',
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorData: unknown
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = errorText
        }

        return {
          error: errorData,
          success: false,
        }
      }

      const text = await response.text()
      if (!text) {
        return {
          data: true,
          success: true,
        }
      }

      const data: unknown = JSON.parse(text)
      return {
        data,
        success: true,
      }
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : String(error),
        success: false,
      }
    }
  }
}
