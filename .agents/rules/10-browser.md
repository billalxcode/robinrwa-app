# R-8 Browser-use discipline

Keywords per `00-keywords-scope.md`. Full procedure lives in the
`browser-use` skill (`SKILL.md`); these rules are the non-negotiable subset.

- R-801: A plain HTTP fetch (curl/fetch tool) is REQUIRED first for public
  pages/APIs/docs. Browser-use is REQUIRED only for interaction, logged-in
  sessions, JS rendering, or bot-protected pages.
- R-802: The first navigation of a task MUST be `new_tab(url)`, NOT goto.
  The daemon preserves the attached tab; the agent MUST NOT re-`new_tab`
  every call.
- R-803: The agent MUST track its working tab id(s), reuse matching tabs via
  `switch_tab`, and MUST NOT close tabs it did not create or leave duplicate
  tabs on one URL.
- R-804: Recordings stay OFF unless the user opts in. `BH_RECORD=1` per-task
  override is allowed ONLY on explicit user cue ("record", "demo", "video").
- R-805: Login walls, passwords, MFA, and consent screens: the agent MUST
  stop and ask. Exception: automatic SSO when Chrome is already signed in.
