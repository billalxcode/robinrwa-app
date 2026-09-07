# R-4 Verification — prove it works

Keywords per `00-keywords-scope.md`.

- R-401: After implementing a feature, fixing a bug, or writing code from
  scratch, the agent MUST execute verification: run the code, run tests,
  and/or run typecheck. Unverified solutions MUST be labeled as such.
- R-402: Frontend/app changes MUST pass `tsc --noEmit` (exit 0). The agent
  MUST run it and report the exit code.
- R-403: Frontend/app changes SHOULD pass `bun run lint` (Biome). Remaining
  diagnostics MUST be triaged: fix ours, report upstream-generated ones
  without editing generated code to satisfy the linter.
- R-404: Contract-related claims SHOULD be checked against
  `docs/contracts/final/` first, implementation second.
- R-405: Numeric or computed results MUST come from executed code, NOT mental
  arithmetic over copied text.
- R-406: Test counts or "all green" claims MUST reflect an actual run in this
  session, with the command quoted.
