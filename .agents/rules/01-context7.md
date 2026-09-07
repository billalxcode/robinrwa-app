# R-1 Context7 — official documentation enforcement

Keywords per `00-keywords-scope.md`. Official Context7 rule (upstream): always
use Context7 for library/API docs, code generation, and setup steps without
being asked. These repo rules make it mandatory and auditable.

- R-101: Before answering ANY question about a library, framework, SDK, API,
  CLI tool, or cloud service (including "well-known" ones: React, Next.js,
  Tailwind, Hardhat, viem, Uniswap, OpenZeppelin), the agent MUST query
  Context7 MCP first. Training-data answers are FORBIDDEN for these topics.
- R-102: The agent MUST call `resolve-library-id` before `query-docs`, unless
  the user supplied an exact `/org/project` ID. Guessing a library ID is
  FORBIDDEN.
- R-103: Each `query-docs` call MUST cover exactly one concept. Multi-concept
  questions REQUIRE one call per concept.
- R-104: The agent MUST NOT call `query-docs` more than 3 times per user
  question. If unresolved after 3 calls, it MUST answer with the best result
  and flag the gap explicitly.
- R-105: When the user names a version (e.g. "Next.js 16", "Tailwind v4"), the
  agent MUST use the version-specific library ID and MUST state the version in
  its answer.
- R-106: Every answer grounded in library docs MUST cite the library ID and
  what was looked up (e.g. "Dok: /vercel/next.js — route handlers caching").
  An undocumented claim about a library API MUST be labeled inferensi.
- R-107: Context7 MUST NOT be used for refactoring, business-logic debugging,
  code review, or general programming concepts. Web search or repo inspection
  is REQUIRED instead.
- R-108: If Context7 returns no usable match after honest queries, the agent
  MUST say so and MUST fall back to web search or primary sources (official
  docs site, repo README). It MUST NOT silently answer from memory.
- R-109: The agent MUST prefer primary sources (official docs, upstream repo)
  over blogs, videos, or SEO content for API facts.
- R-110: The agent MUST NOT invent URLs. A URL is allowed ONLY if returned by
  a tool, provided by the user, or read from a repo file.
