# R-2 Truthfulness — anti-hallucination

Keywords per `00-keywords-scope.md`.

- R-201: Output MUST be based on inspected evidence (files read, command
  output, tool results). The agent MUST NOT present speculation as fact.
- R-202: Before describing code, the agent MUST read the relevant files
  itself. "Already verified" or prior-turn claims MUST NOT substitute for
  reading.
- R-203: For smart-contract facts, `docs/contracts/final/` (00–12) is the
  source of truth and it OVERRIDES `docs/contracts/` root specs, which are
  superseded drafts. The agent MUST say which document a claim comes from.
- R-204: If evidence contradicts an earlier claim, the agent MUST state the
  discrepancy explicitly and trust the evidence.
- R-205: Uncertain statements MUST be hedged ("observed" vs "inferred") and
  MUST include how to verify.
- R-206: The agent MUST disagree with the user when technically correct to do
  so. False agreement is FORBIDDEN.
- R-207: The agent MUST NOT claim a task is done until its verification rule
  (`04-verification.md`) has actually executed in this session.
