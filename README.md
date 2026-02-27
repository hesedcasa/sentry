# sentry

CLI for Sentry error tracking API interaction

[![Version](https://img.shields.io/npm/v/@hesed/sentry.svg)](https://npmjs.org/package/@hesed/sentry)
[![Downloads/week](https://img.shields.io/npm/dw/@hesed/sentry.svg)](https://npmjs.org/package/@hesed/sentry)

# Install

```bash
sdkck plugins install @hesed/sentry
```

<!-- toc -->
* [sentry](#sentry)
* [Install](#install)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->
```sh-session
$ npm install -g @hesed/sentry
$ sentry COMMAND
running command...
$ sentry (--version)
@hesed/sentry/0.1.0 linux-x64 node-v20.20.0
$ sentry --help [COMMAND]
USAGE
  $ sentry COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`sentry sentry auth add`](#sentry-sentry-auth-add)
* [`sentry sentry auth test`](#sentry-sentry-auth-test)
* [`sentry sentry auth update`](#sentry-sentry-auth-update)
* [`sentry sentry event get PROJECTSLUG EVENTID`](#sentry-sentry-event-get-projectslug-eventid)
* [`sentry sentry event source-maps PROJECTSLUG EVENTID`](#sentry-sentry-event-source-maps-projectslug-eventid)
* [`sentry sentry issue event ISSUEID EVENTID`](#sentry-sentry-issue-event-issueid-eventid)
* [`sentry sentry issue events ISSUEID`](#sentry-sentry-issue-events-issueid)
* [`sentry sentry issue get ISSUEID`](#sentry-sentry-issue-get-issueid)
* [`sentry sentry issue hashes ISSUEID`](#sentry-sentry-issue-hashes-issueid)
* [`sentry sentry issue tag ISSUEID TAGKEY`](#sentry-sentry-issue-tag-issueid-tagkey)
* [`sentry sentry issue tag-values ISSUEID TAGKEY`](#sentry-sentry-issue-tag-values-issueid-tagkey)
* [`sentry sentry issue update ISSUEID`](#sentry-sentry-issue-update-issueid)
* [`sentry sentry org issues`](#sentry-sentry-org-issues)
* [`sentry sentry project events PROJECTSLUG`](#sentry-sentry-project-events-projectslug)
* [`sentry sentry project issues PROJECTSLUG`](#sentry-sentry-project-issues-projectslug)

## `sentry sentry auth add`

Add Sentry authentication

```
USAGE
  $ sentry sentry auth add -o <value> -t <value> [--json] [-u <value>]

FLAGS
  -o, --organization=<value>  (required) Sentry organization slug:
  -t, --token=<value>         (required) Auth Token:
  -u, --url=<value>           [default: https://sentry.io/api/0] Sentry base URL:

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Add Sentry authentication

EXAMPLES
  $ sentry sentry auth add
```

_See code: [src/commands/sentry/auth/add.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/auth/add.ts)_

## `sentry sentry auth test`

Test authentication and connection

```
USAGE
  $ sentry sentry auth test [--json]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Test authentication and connection

EXAMPLES
  $ sentry sentry auth test
```

_See code: [src/commands/sentry/auth/test.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/auth/test.ts)_

## `sentry sentry auth update`

Update existing authentication

```
USAGE
  $ sentry sentry auth update -o <value> -t <value> -u <value> [--json]

FLAGS
  -o, --organization=<value>  (required) Sentry organization slug
  -t, --token=<value>         (required) Auth Token
  -u, --url=<value>           (required) Sentry base URL

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Update existing authentication

EXAMPLES
  $ sentry sentry auth update
```

_See code: [src/commands/sentry/auth/update.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/auth/update.ts)_

## `sentry sentry event get PROJECTSLUG EVENTID`

Retrieve a Sentry event for a project

```
USAGE
  $ sentry sentry event get PROJECTSLUG EVENTID [--toon]

ARGUMENTS
  PROJECTSLUG  Project slug
  EVENTID      Event ID

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Retrieve a Sentry event for a project

EXAMPLES
  $ sentry sentry event get my-project abc123def456
```

_See code: [src/commands/sentry/event/get.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/event/get.ts)_

## `sentry sentry event source-maps PROJECTSLUG EVENTID`

Debug source maps for a Sentry event

```
USAGE
  $ sentry sentry event source-maps PROJECTSLUG EVENTID [--exception-idx <value>] [--frame-idx <value>] [--toon]

ARGUMENTS
  PROJECTSLUG  Project slug
  EVENTID      Event ID

FLAGS
  --exception-idx=<value>  Exception index
  --frame-idx=<value>      Frame index
  --toon                   Format output as toon

DESCRIPTION
  Debug source maps for a Sentry event

EXAMPLES
  $ sentry sentry event source-maps my-project abc123def456
```

_See code: [src/commands/sentry/event/source-maps.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/event/source-maps.ts)_

## `sentry sentry issue event ISSUEID EVENTID`

Retrieve a specific event from a Sentry issue

```
USAGE
  $ sentry sentry issue event ISSUEID EVENTID [--toon]

ARGUMENTS
  ISSUEID  Issue ID
  EVENTID  Event ID (latest, oldest, recommended, or event ID)

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Retrieve a specific event from a Sentry issue

EXAMPLES
  $ sentry sentry issue event 123456789 latest

  $ sentry sentry issue event 123456789 abc123def456
```

_See code: [src/commands/sentry/issue/event.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/issue/event.ts)_

## `sentry sentry issue events ISSUEID`

List a Sentry issue's events

```
USAGE
  $ sentry sentry issue events ISSUEID [--cursor <value>] [--end <value>] [--environment <value>...] [--full] [--start
    <value>] [--stats-period <value>] [--toon]

ARGUMENTS
  ISSUEID  Issue ID

FLAGS
  --cursor=<value>          Pagination cursor
  --end=<value>             End date (ISO-8601)
  --environment=<value>...  Filter by environment
  --full                    Include full event body
  --start=<value>           Start date (ISO-8601)
  --stats-period=<value>    Time period (e.g. 24h, 7d)
  --toon                    Format output as toon

DESCRIPTION
  List a Sentry issue's events

EXAMPLES
  $ sentry sentry issue events 123456789
```

_See code: [src/commands/sentry/issue/events.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/issue/events.ts)_

## `sentry sentry issue get ISSUEID`

Retrieve a Sentry issue

```
USAGE
  $ sentry sentry issue get ISSUEID [--toon]

ARGUMENTS
  ISSUEID  Issue ID

FLAGS
  --toon  Format output as toon

DESCRIPTION
  Retrieve a Sentry issue

EXAMPLES
  $ sentry sentry issue get 123456789
```

_See code: [src/commands/sentry/issue/get.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/issue/get.ts)_

## `sentry sentry issue hashes ISSUEID`

List a Sentry issue's hashes

```
USAGE
  $ sentry sentry issue hashes ISSUEID [--cursor <value>] [--toon]

ARGUMENTS
  ISSUEID  Issue ID

FLAGS
  --cursor=<value>  Pagination cursor
  --toon            Format output as toon

DESCRIPTION
  List a Sentry issue's hashes

EXAMPLES
  $ sentry sentry issue hashes 123456789
```

_See code: [src/commands/sentry/issue/hashes.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/issue/hashes.ts)_

## `sentry sentry issue tag ISSUEID TAGKEY`

Retrieve tag details for a Sentry issue

```
USAGE
  $ sentry sentry issue tag ISSUEID TAGKEY [--environment <value>...] [--toon]

ARGUMENTS
  ISSUEID  Issue ID
  TAGKEY   Tag key (e.g. browser, url, user)

FLAGS
  --environment=<value>...  Filter by environment
  --toon                    Format output as toon

DESCRIPTION
  Retrieve tag details for a Sentry issue

EXAMPLES
  $ sentry sentry issue tag 123456789 browser
```

_See code: [src/commands/sentry/issue/tag.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/issue/tag.ts)_

## `sentry sentry issue tag-values ISSUEID TAGKEY`

List a tag's values for a Sentry issue

```
USAGE
  $ sentry sentry issue tag-values ISSUEID TAGKEY [--cursor <value>] [--environment <value>...] [--toon]

ARGUMENTS
  ISSUEID  Issue ID
  TAGKEY   Tag key (e.g. browser, url, user)

FLAGS
  --cursor=<value>          Pagination cursor
  --environment=<value>...  Filter by environment
  --toon                    Format output as toon

DESCRIPTION
  List a tag's values for a Sentry issue

EXAMPLES
  $ sentry sentry issue tag-values 123456789 browser
```

_See code: [src/commands/sentry/issue/tag-values.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/issue/tag-values.ts)_

## `sentry sentry issue update ISSUEID`

Update a Sentry issue

```
USAGE
  $ sentry sentry issue update ISSUEID [--assigned-to <value>] [--has-seen] [--is-bookmarked] [--is-public]
    [--is-subscribed] [--status resolved|resolvedInNextRelease|unresolved|ignored] [--toon]

ARGUMENTS
  ISSUEID  Issue ID

FLAGS
  --assigned-to=<value>  Assign to user (actor ID or username)
  --[no-]has-seen        Mark issue as seen/unseen
  --[no-]is-bookmarked   Bookmark or unbookmark issue
  --[no-]is-public       Make issue public or private
  --[no-]is-subscribed   Subscribe or unsubscribe from issue
  --status=<option>      Issue status (resolved, resolvedInNextRelease, unresolved, ignored)
                         <options: resolved|resolvedInNextRelease|unresolved|ignored>
  --toon                 Format output as toon

DESCRIPTION
  Update a Sentry issue

EXAMPLES
  $ sentry sentry issue update 123456789 --status resolved

  $ sentry sentry issue update 123456789 --assigned-to user@example.com
```

_See code: [src/commands/sentry/issue/update.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/issue/update.ts)_

## `sentry sentry org issues`

List a Sentry organization's issues

```
USAGE
  $ sentry sentry org issues [--cursor <value>] [--end <value>] [--environment <value>...] [--limit <value>] [--project
    <value>...] [--query <value>] [--sort <value>] [--start <value>] [--stats-period <value>] [--toon]

FLAGS
  --cursor=<value>          Pagination cursor
  --end=<value>             End date (ISO-8601)
  --environment=<value>...  Filter by environment
  --limit=<value>           Maximum number of results
  --project=<value>...      Filter by project ID
  --query=<value>           Search query (e.g. "is:unresolved")
  --sort=<value>            Sort order
  --start=<value>           Start date (ISO-8601)
  --stats-period=<value>    Time period (e.g. 24h, 7d)
  --toon                    Format output as toon

DESCRIPTION
  List a Sentry organization's issues

EXAMPLES
  $ sentry sentry org issues

  $ sentry sentry org issues --query "is:unresolved" --limit 50
```

_See code: [src/commands/sentry/org/issues.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/org/issues.ts)_

## `sentry sentry project events PROJECTSLUG`

List a Sentry project's error events

```
USAGE
  $ sentry sentry project events PROJECTSLUG [--cursor <value>] [--end <value>] [--full] [--start <value>] [--stats-period
    <value>] [--toon]

ARGUMENTS
  PROJECTSLUG  Project slug

FLAGS
  --cursor=<value>        Pagination cursor
  --end=<value>           End date (ISO-8601)
  --full                  Include full event body
  --start=<value>         Start date (ISO-8601)
  --stats-period=<value>  Time period (e.g. 24h, 7d)
  --toon                  Format output as toon

DESCRIPTION
  List a Sentry project's error events

EXAMPLES
  $ sentry sentry project events my-project
```

_See code: [src/commands/sentry/project/events.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/project/events.ts)_

## `sentry sentry project issues PROJECTSLUG`

List a Sentry project's issues

```
USAGE
  $ sentry sentry project issues PROJECTSLUG [--cursor <value>] [--query <value>] [--short-id-lookup] [--stats-period
    <value>] [--toon]

ARGUMENTS
  PROJECTSLUG  Project slug

FLAGS
  --cursor=<value>        Pagination cursor
  --query=<value>         Search query (e.g. "is:unresolved")
  --short-id-lookup       Enable short ID lookup
  --stats-period=<value>  Time period (e.g. 24h, 7d)
  --toon                  Format output as toon

DESCRIPTION
  List a Sentry project's issues

EXAMPLES
  $ sentry sentry project issues my-project

  $ sentry sentry project issues my-project --query "is:unresolved"
```

_See code: [src/commands/sentry/project/issues.ts](https://github.com/hesedcasa/sentry/blob/v0.1.0/src/commands/sentry/project/issues.ts)_
<!-- commandsstop -->
