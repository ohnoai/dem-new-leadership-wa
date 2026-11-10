# AGENTS.md

This file provides guidance to any agent working with code in this repository.

## What this is

dem-new-leadership-wa - fill in one sentence.

## Task records

**Two systems are in play here. They are not interchangeable and neither replaces
the other.**

**veans / Vikunja - live execution state.** `veans prime` runs on `SessionStart` and
tells you to use veans instead of `TodoWrite`, that instruction is correct and means
exactly what it says: veans replaces the *ephemeral in-session todo list*. Claim a task
before you start (`veans claim <identifier>`), move it to **In Review** when you finish,
and **never mark it Done yourself** - a human closes it once the work has actually
landed. Config is `.veans.yml` at the root: committed, no secrets in it, the bot token
lives in the OS keychain. Bot identity is `bot-dem-new-leadership-wa` against `tasks.ohnoai.xyz`.
This project's identifier prefix is `DEMNEW`, so task 1 is `DEMNEW-1` - use the JSON's
`"identifier"` field, not its database `"id"`.

**`docs/decisions/` - the durable record.** Dated, short, never-edited record of a choice
and why, filed as `YYYY-MM-DD-short-title.md`. Most changes don't need one - a commit
message is enough. File one when the reasoning would otherwise only live in your own head
or a closed PR conversation. See `docs/decisions/README.md`.

> **State in Vikunja, record in the repo.** A Vikunja card answers "what is being worked
> on right now". A decision record (or, for anything smaller, a commit message) answers
> "what happened, and why".

The `SessionStart`/`PreCompact` hooks that auto-run `veans prime` live in committed
`.claude/settings.json` and `.opencode/plugin/veans-prime.ts` (same pattern as
`.veans.yml`: config committed, secrets in the OS keychain).

## Documentation standard

A fact has one authoritative home. Every other document links to it - do not restate.
See `docs/README.md`.

## Project-specific instructions

Add architecture, commands, conventions, tests, and scope rules here as they become
established. Do not duplicate shared house policy (prose/AI-isms, global agent rules)
into this file - point at the canonical package when one exists.