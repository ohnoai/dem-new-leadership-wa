---
title: "Documentation conventions"
class: guide
verified: 2026-11-09
---

# Documentation conventions

How documentation works in this repository.

## The rule everything else follows

**A fact has one authoritative home. Every other document links to it.**

Do not restate architecture, commands, or product rules that already live somewhere
else. A copy is a future contradiction.

## Classes

| Class | What it is | Lives in | Can rot? |
| --- | --- | --- | :-: |
| **Authority** | Normative rules. True because it says so. | repo root (`AGENTS.md`, product authority files) | no |
| **Map** | Describes the code as it currently is. | `docs/code-map.md` (and similar) | **yes** |
| **Guide** | How to do or set up a thing. | `docs/guides/` when needed | **yes** |
| **Decision** | Dated record of a choice. History. | `docs/decisions/` | no |

### Decision

`docs/decisions/`, named `YYYY-MM-DD-short-title.md`. Snapshot of what was chosen
and why. Never updated. If the decision changes, write a new record.

### Work (live)

Live execution state lives in Vikunja via `veans`, not as a document class in this
repository. See `AGENTS.md`.

## Freshness

Maps and guides carry a `verified:` date in frontmatter when they describe current
reality. Decisions use the date in the filename instead.