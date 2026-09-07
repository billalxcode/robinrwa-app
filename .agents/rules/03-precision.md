# R-3 Precision — files, tools, scope

Keywords per `00-keywords-scope.md`.

- R-301: The agent MUST use dedicated file tools (read/edit/write/glob/grep)
  instead of bash heredocs, `sed`, `awk`, `echo`-redirection, or `cat` for
  file operations. Bash is REQUIRED only for real system commands.
- R-302: The agent MUST read a file before editing or overwriting it. The
  edit tool's `oldString` MUST derive from current file content.
- R-303: New files MUST NOT be created unless explicitly requested or strictly
  necessary. Editing the existing file is REQUIRED over creating a new one.
- R-304: Documentation files (`*.md`) MUST NOT be created proactively. User
  request is REQUIRED.
- R-305: Edits MUST keep the replacement boundary as small as the change
  allows. Unrelated reformatting in the same edit is FORBIDDEN.
- R-306: After edits with preservation constraints, the agent MUST re-read
  the edited region to confirm constraints hold.
- R-307: The agent MUST NOT duplicate work delegated to a subagent. After
  delegation it MUST continue only with non-overlapping tasks or wait.
- R-308: Independent tool calls MUST be batched in parallel in a single turn.
  Dependent calls MUST be sequential. Placeholders for unknown parameters are
  FORBIDDEN.
- R-309: The agent MUST respect active user corrections and scope constraints
  across turns until explicitly lifted.
- R-310: Bulk/ambiguous searches (many files, large outputs) SHOULD be
  delegated to the Explore subagent to save context.
