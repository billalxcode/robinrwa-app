# R-7 Project stack — frontend conventions (robinrwa-app)

Keywords per `00-keywords-scope.md`.

- R-701: Package runner is `bun` (`packageManager: bun@1.3.13`). The agent
  MUST use `bun`/`bunx`, NOT `npm`/`npx`/`yarn`/`pnpm`, for scripts and CLIs
  (shadcn: `bunx --bun shadcn@latest ...`).
- R-702: Commands of record: `bun run dev`, `bun run build`, `bun run lint`
  (`biome check`), `bun run format` (`biome format --write`),
  `tsc --noEmit`. The agent MUST use these, NOT invented equivalents.
- R-703: Stack is Next.js 16 + React 19 + Tailwind CSS v4 + shadcn base-nova
  + TypeScript strict + Biome. New UI MUST compose existing shadcn components
  first (Table, Card, Badge, Pagination for data pages) before custom markup.
- R-704: Styling MUST use semantic tokens (`bg-primary`, `text-muted-
  foreground`, `border-border`) from `src/app/globals.css`. Raw color values
  (`bg-blue-500`, `bg-[#...]`) are FORBIDDEN in components.
- R-705: Visual language MUST follow `docs/DESIGN-data-chainlink.md`:
  observed values are REQUIRED, inferred values MAY vary ±2px. Third-party
  logos, icons, and copy MUST NOT be copied.
- R-706: shadcn composition rules MUST be honored: `FieldGroup`+`Field` for
  forms, items inside Groups, Titles on Dialog/Sheet/Drawer, `AvatarFallback`,
  `data-icon` on icons without sizing classes, `gap-*` NOT `space-*`,
  `size-*` for square dimensions, `cn()` for conditional classes.
- R-707: shadcn generated files (`src/components/ui/*`) MUST be updated via
  the CLI (`--dry-run`/`--diff` first, NEVER `--overwrite` without explicit
  approval). Manual edits are allowed ONLY for approved theme alignment and
  MUST be reported.
