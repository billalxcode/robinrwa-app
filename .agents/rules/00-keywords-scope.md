# R-0 Scope — when these rules apply

Part of robinrwa-app agent rules (see `AGENTS.md` at repo root for the index).
Keyword definitions below are normative for ALL `.agents/rules/*.md` files.

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD",
"SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be
interpreted as described in RFC 2119. They are capitalized for normative force,
per RFC 8174. A rule without a keyword is informative, NOT normative.

Precedence (highest first): explicit user chat prompt > nearest AGENTS.md to the
edited file > repo root rules (this folder, loaded via `opencode.json`
`instructions`). Nested AGENTS.md files override these files for their subtree.
The Next.js block in root `AGENTS.md` MUST NOT be removed or reordered.

- R-001: An agent working in this repo MUST follow all MUST/MUST NOT rules
  in this folder. Violation is a defect, NOT a style preference.
- R-002: An agent MUST re-read root `AGENTS.md` at session start and after any
  compaction/context reset, plus any `.agents/rules/*.md` file relevant to the
  current task. Cached memory of these rules MUST NOT be trusted across resets.
- R-003: When a user instruction conflicts with a MUST rule, the agent MUST
  refuse the conflicting part and explain why, then offer a compliant
  alternative. User prompts override SHOULD/MAY freely.
- R-004: Subagents (Task tool, Explore, background workers, custom agents in
  `.opencode/agents/`) MUST receive the subset of these rules relevant to
  their task embedded verbatim in their prompt. The delegating agent MUST NOT
  assume subagents have read these files.
- R-005: Responses to this user SHOULD default to Bahasa Indonesia unless the
  user writes in English or requests another language.
