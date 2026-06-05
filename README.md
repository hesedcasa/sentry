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
@hesed/sentry/0.5.0 linux-x64 node-v22.22.3
$ sentry --help [COMMAND]
USAGE
  $ sentry COMMAND
...
```
<!-- usagestop -->

# Commands

<!-- commands -->
* [`sentry sentry auth add`](#sentry-sentry-auth-add)
* [`sentry sentry auth delete`](#sentry-sentry-auth-delete)
* [`sentry sentry auth list`](#sentry-sentry-auth-list)
* [`sentry sentry auth profile`](#sentry-sentry-auth-profile)
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
  $ sentry sentry auth add -p <value> -t <value> -o <value> -u <value> [--json]

FLAGS
  -o, --organization=<value>  (required) Organization slug
  -p, --profile=<value>       (required) Profile name
  -t, --authToken=<value>     (required) Auth token
  -u, --host=<value>          (required) Sentry base URL

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Add Sentry authentication

EXAMPLES
  $ sentry sentry auth add

  $ sentry sentry auth add -p prod
```

_See code: [src/commands/sentry/auth/add.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/auth/add.ts)_

## `sentry sentry auth delete`

Delete an authentication profile

```
USAGE
  $ sentry sentry auth delete [--json] [-p <value>]

FLAGS
  -p, --profile=<value>  Profile to delete

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Delete an authentication profile

EXAMPLES
  $ sentry sentry auth delete

  $ sentry sentry auth delete -p prod
```

_See code: [src/commands/sentry/auth/delete.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/auth/delete.ts)_

## `sentry sentry auth list`

List authentication profiles

```
USAGE
  $ sentry sentry auth list [--json]

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List authentication profiles

EXAMPLES
  $ sentry sentry auth list
```

_See code: [src/commands/sentry/auth/list.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/auth/list.ts)_

## `sentry sentry auth profile`

Set or show the default authentication profile

```
USAGE
  $ sentry sentry auth profile [--json] [--default <value>]

FLAGS
  --default=<value>  Profile to set as default

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Set or show the default authentication profile

EXAMPLES
  $ sentry sentry auth profile

  $ sentry sentry auth profile --default test
```

_See code: [src/commands/sentry/auth/profile.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/auth/profile.ts)_

## `sentry sentry auth test`

Test authentication and connection

```
USAGE
  $ sentry sentry auth test [--json] [-p <value>]

FLAGS
  -p, --profile=<value>  Authentication profile name

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Test authentication and connection

EXAMPLES
  $ sentry sentry auth test

  $ sentry sentry auth test -p prod
```

_See code: [src/commands/sentry/auth/test.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/auth/test.ts)_

## `sentry sentry auth update`

Update Sentry authentication

```
USAGE
  $ sentry sentry auth update -p <value> -t <value> -o <value> -u <value> [--json]

FLAGS
  -o, --organization=<value>  (required) Organization slug
  -p, --profile=<value>       (required) Profile name
  -t, --authToken=<value>     (required) Auth token
  -u, --host=<value>          (required) Sentry base URL

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Update Sentry authentication

EXAMPLES
  $ sentry sentry auth update

  $ sentry sentry auth update -p test
```

_See code: [src/commands/sentry/auth/update.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/auth/update.ts)_

## `sentry sentry event get PROJECTSLUG EVENTID`

Retrieve a Sentry event for a project

```
USAGE
  $ sentry sentry event get PROJECTSLUG EVENTID [-p <value>] [--toon]

ARGUMENTS
  PROJECTSLUG  Project slug
  EVENTID      Event ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Retrieve a Sentry event for a project

EXAMPLES
  $ sentry sentry event get my-project abc123def456
```

_See code: [src/commands/sentry/event/get.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/event/get.ts)_

## `sentry sentry event source-maps PROJECTSLUG EVENTID`

Debug source maps for a Sentry event

```
USAGE
  $ sentry sentry event source-maps PROJECTSLUG EVENTID [--exception-idx <value>] [--frame-idx <value>] [-p <value>]
  [--toon]

ARGUMENTS
  PROJECTSLUG  Project slug
  EVENTID      Event ID

FLAGS
  -p, --profile=<value>        Authentication profile name
      --exception-idx=<value>  Exception index
      --frame-idx=<value>      Frame index
      --toon                   Format output as toon

DESCRIPTION
  Debug source maps for a Sentry event

EXAMPLES
  $ sentry sentry event source-maps my-project abc123def456
```

_See code: [src/commands/sentry/event/source-maps.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/event/source-maps.ts)_

## `sentry sentry issue event ISSUEID EVENTID`

Retrieve a specific event from a Sentry issue

```
USAGE
  $ sentry sentry issue event ISSUEID EVENTID [-p <value>] [--toon]

ARGUMENTS
  ISSUEID  Issue ID
  EVENTID  Event ID (latest, oldest, recommended, or event ID)

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Retrieve a specific event from a Sentry issue

EXAMPLES
  $ sentry sentry issue event 123456789 latest

  $ sentry sentry issue event 123456789 abc123def456
```

_See code: [src/commands/sentry/issue/event.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/issue/event.ts)_

## `sentry sentry issue events ISSUEID`

List a Sentry issue's events

```
USAGE
  $ sentry sentry issue events ISSUEID [--cursor <value>] [--end <value>] [--environment <value>...] [--full] [-p
    <value>] [--start <value>] [--stats-period <value>] [--toon]

ARGUMENTS
  ISSUEID  Issue ID

FLAGS
  -p, --profile=<value>         Authentication profile name
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

_See code: [src/commands/sentry/issue/events.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/issue/events.ts)_

## `sentry sentry issue get ISSUEID`

Retrieve a Sentry issue

```
USAGE
  $ sentry sentry issue get ISSUEID [-p <value>] [--toon]

ARGUMENTS
  ISSUEID  Issue ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --toon             Format output as toon

DESCRIPTION
  Retrieve a Sentry issue

EXAMPLES
  $ sentry sentry issue get 123456789
```

_See code: [src/commands/sentry/issue/get.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/issue/get.ts)_

## `sentry sentry issue hashes ISSUEID`

List a Sentry issue's hashes

```
USAGE
  $ sentry sentry issue hashes ISSUEID [--cursor <value>] [-p <value>] [--toon]

ARGUMENTS
  ISSUEID  Issue ID

FLAGS
  -p, --profile=<value>  Authentication profile name
      --cursor=<value>   Pagination cursor
      --toon             Format output as toon

DESCRIPTION
  List a Sentry issue's hashes

EXAMPLES
  $ sentry sentry issue hashes 123456789
```

_See code: [src/commands/sentry/issue/hashes.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/issue/hashes.ts)_

## `sentry sentry issue tag ISSUEID TAGKEY`

Retrieve tag details for a Sentry issue

```
USAGE
  $ sentry sentry issue tag ISSUEID TAGKEY [--environment <value>...] [-p <value>] [--toon]

ARGUMENTS
  ISSUEID  Issue ID
  TAGKEY   Tag key (e.g. browser, url, user)

FLAGS
  -p, --profile=<value>         Authentication profile name
      --environment=<value>...  Filter by environment
      --toon                    Format output as toon

DESCRIPTION
  Retrieve tag details for a Sentry issue

EXAMPLES
  $ sentry sentry issue tag 123456789 browser
```

_See code: [src/commands/sentry/issue/tag.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/issue/tag.ts)_

## `sentry sentry issue tag-values ISSUEID TAGKEY`

List a tag's values for a Sentry issue

```
USAGE
  $ sentry sentry issue tag-values ISSUEID TAGKEY [--cursor <value>] [--environment <value>...] [-p <value>] [--toon]

ARGUMENTS
  ISSUEID  Issue ID
  TAGKEY   Tag key (e.g. browser, url, user)

FLAGS
  -p, --profile=<value>         Authentication profile name
      --cursor=<value>          Pagination cursor
      --environment=<value>...  Filter by environment
      --toon                    Format output as toon

DESCRIPTION
  List a tag's values for a Sentry issue

EXAMPLES
  $ sentry sentry issue tag-values 123456789 browser
```

_See code: [src/commands/sentry/issue/tag-values.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/issue/tag-values.ts)_

## `sentry sentry issue update ISSUEID`

Update a Sentry issue

```
USAGE
  $ sentry sentry issue update ISSUEID [--assigned-to <value>] [--has-seen] [--is-bookmarked] [--is-public]
    [--is-subscribed] [-p <value>] [--status resolved|resolvedInNextRelease|unresolved|ignored] [--toon]

ARGUMENTS
  ISSUEID  Issue ID

FLAGS
  -p, --profile=<value>      Authentication profile name
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

_See code: [src/commands/sentry/issue/update.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/issue/update.ts)_

## `sentry sentry org issues`

List a Sentry organization's issues

```
USAGE
  $ sentry sentry org issues [--cursor <value>] [--end <value>] [--environment <value>...] [--limit <value>] [-p
    <value>] [--project <value>...] [--query <value>] [--sort <value>] [--start <value>] [--stats-period <value>]
    [--toon]

FLAGS
  -p, --profile=<value>         Authentication profile name
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

_See code: [src/commands/sentry/org/issues.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/org/issues.ts)_

## `sentry sentry project events PROJECTSLUG`

List a Sentry project's error events

```
USAGE
  $ sentry sentry project events PROJECTSLUG [--cursor <value>] [--end <value>] [--full] [-p <value>] [--start <value>]
    [--stats-period <value>] [--toon]

ARGUMENTS
  PROJECTSLUG  Project slug

FLAGS
  -p, --profile=<value>       Authentication profile name
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

_See code: [src/commands/sentry/project/events.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/project/events.ts)_

## `sentry sentry project issues PROJECTSLUG`

List a Sentry project's issues

```
USAGE
  $ sentry sentry project issues PROJECTSLUG [--cursor <value>] [-p <value>] [--query <value>] [--short-id-lookup]
    [--stats-period <value>] [--toon]

ARGUMENTS
  PROJECTSLUG  Project slug

FLAGS
  -p, --profile=<value>       Authentication profile name
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

_See code: [src/commands/sentry/project/issues.ts](https://github.com/hesedcasa/sentry/blob/v0.5.0/src/commands/sentry/project/issues.ts)_
<!-- commandsstop -->
