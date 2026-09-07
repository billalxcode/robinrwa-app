<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent Rules — robinrwa-app (index)

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in RFC 2119. They are capitalized for normative force,
per RFC 8174. A rule without a keyword is informative, NOT normative.

Precedence (highest first): explicit user chat prompt > nearest AGENTS.md to the
edited file > these rules. Nested AGENTS.md files override this file for their
subtree. The Next.js block above MUST NOT be removed or reordered.

## Core (always in force)

- R-001: An agent working in this repo MUST follow all MUST/MUST NOT rules in
  `.agents/rules/`. Violation is a defect, NOT a style preference.
- R-002: An agent MUST re-read this file at session start and after any
  compaction/context reset, plus any `.agents/rules/*.md` file relevant to the
  task. Cached memory MUST NOT be trusted across resets.
- R-003: On conflict with a MUST rule, the agent MUST refuse that part,
  explain why, and offer a compliant alternative. SHOULD/MAY bend to the user.
- R-004: Subagents (Task tool, Explore, workers) MUST receive the relevant
  rules embedded verbatim in their prompt. Never assume they read these files.
- R-005: Responses SHOULD default to Bahasa Indonesia unless the user writes
  in English or requests another language.

## Rule files — read on need, mandatory once loaded

opencode loads all of these via `opencode.json` → `instructions`. Other agents:
read the file matching your task BEFORE acting; once read, its rules bind you.

| File | Read when you will… |
|---|---|
| `.agents/rules/00-keywords-scope.md` | Need keyword/precedence definitions (normative base) |
| `.agents/rules/01-context7.md` | Touch ANY library/framework/SDK/API/CLI/cloud docs |
| `.agents/rules/02-truthfulness.md` | State facts, describe code, cite contracts |
| `.agents/rules/03-precision.md` | Read/edit/create files, call tools |
| `.agents/rules/04-verification.md` | Finish code: tests, typecheck, claim "done" |
| `.agents/rules/05-git.md` | Commit, push, PR, or touch git config |
| `.agents/rules/06-security.md` | Handle secrets, destructive cmds, deploys, chain txs |
| `.agents/rules/07-code-style.md` | Write ANY code (TS/React/Tailwind/Solidity) |
| `.agents/rules/08-stack-frontend.md` | Work on the Next.js app, UI, shadcn, DESIGN |
| `.agents/rules/09-stack-contracts.md` | Work on contracts docs, sims, Solidity versions |
| `.agents/rules/10-browser.md` | Use browser-use / touch the user's browser |
| `.agents/rules/11-communication.md` | Reply, summarize, or close out a task |

## Compliance self-check (code tasks)

1. Context7 consulted per `01`? 2. Files read first per `03`? 3. `tsc --noEmit`
   green + lint triaged per `04`? 4. No secrets/destruction per `06`?
   5. Summary = files + verification + open items per `11`?
