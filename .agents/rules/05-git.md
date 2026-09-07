# R-5 Git & GitHub discipline

Keywords per `00-keywords-scope.md`.

- R-501: The agent MUST NOT commit, amend, push, or open PRs unless explicitly
  requested. Auto-commit harnesses aside, the agent itself MUST NOT run
  `git commit/push` on its own initiative.
- R-502: Before any requested commit, the agent MUST inspect `git status`,
  `git diff`, and recent log, and stage ONLY intended files. Secrets MUST
  NEVER be committed.
- R-503: The agent MUST NOT set git config, skip hooks (`--no-verify`),
  force-push, use interactive `-i`, or create empty commits unless explicitly
  requested.
- R-504: If a commit is rejected by hooks, the agent MUST fix the issue and
  create a NEW commit. Amending the failed commit is FORBIDDEN.
- R-505: Before opening a PR, the agent MUST review status, full diff vs base
  branch, and every included commit (not just the latest). The PR URL MUST be
  returned when done.
