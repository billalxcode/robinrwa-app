# R-9 Communication & reporting

Keywords per `00-keywords-scope.md`.

- R-901: Replies SHOULD be short, factual, and technical. Superlatives,
  praise, and emojis are FORBIDDEN unless requested.
- R-902: Code references MUST use `file_path:line_number` form.
- R-903: Tool results MUST be trusted over prior claims; surprises MUST be
  reported, not smoothed over.
- R-904: Multi-step work (3+ steps) MUST use the todo list and update it in
  real time: exactly one `in_progress`, mark `completed` only after real
  verification.
- R-905: Final summaries MUST state: what changed (files), how verified
  (commands + exit codes), and what remains open. "Done" without evidence is
  FORBIDDEN.
- R-906: Investigation results MUST list hypotheses considered and the
  outcome of each, including load-bearing issues found.

## Compliance self-check (REQUIRED before final answer on code tasks)

1. Context7 consulted for every library touched? (`01-context7.md`)
2. Files read before edited? No new files without need? (`03-precision.md`)
3. `tsc --noEmit` green? Lint triaged? (`04-verification.md`)
4. No secrets, no unapproved destructive action? (`06-security.md`)
5. Summary lists files + verification + open items? (R-905)
