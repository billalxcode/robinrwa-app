# R-7 Code style — coding rules (all languages)

Keywords per `00-keywords-scope.md`. These rules are grounded in the repo's
actual toolchain: `biome.json` (formatter: spaces, width 2; linter:
`recommended: true` + domains `next`/`react` recommended; `organizeImports`
on), `tsconfig.json` (`strict: true`), Tailwind CSS v4, shadcn base-nova.
For Biome semantics beyond this file, consult Context7 (`/biomejs/website`).

## C-1 Formatting (Biome is the authority)

- C-101: Formatting MUST follow `biome.json`. The agent MUST NOT reformat
  code to personal taste. `bun run format` is the ONLY approved formatter.
- C-102: Indentation MUST be spaces, width 2. Tabs are FORBIDDEN.
- C-103: Line width SHOULD stay within 80 columns where Biome enforces it.
  The agent MUST NOT manually reflow code that Biome accepts.
- C-104: Import organization MUST be left to `organizeImports`. Manual import
  sorting is FORBIDDEN.
- C-105: Generated files (`src/components/ui/*`, ABIs, `next-env.d.ts`)
  MUST NOT be hand-formatted to silence the linter (see R-403).

## C-2 TypeScript / JavaScript

- C-201: Code MUST compile under `strict: true` with zero errors. `any`
  MUST NOT be introduced; unknown types REQUIRE narrowing before use.
- C-202: Type-only imports MUST use `import type` (Biome `useImportType`).
  Unused imports/vars MUST be removed, NOT commented out.
- C-203: `const` is REQUIRED over `let` where no reassignment occurs.
  Non-null assertions (`!`) SHOULD be avoided; explicit checks are REQUIRED
  at trust boundaries.
- C-204: Async code MUST handle rejection (`await` + try/catch or explicit
  `.catch`). Floating promises are FORBIDDEN.
- C-205: Equality MUST be strict (`===`/`!==`). `==` is FORBIDDEN
  (Biome `noDoubleEquals`).
- C-206: Array indices as React keys are FORBIDDEN except for static,
  never-reordered lists. Stable ids are REQUIRED otherwise.
- C-207: `useEffect` dependency arrays MUST be exhaustive. Suppression
  comments REQUIRE a justification comment.
- C-208: Functions SHOULD be small and single-purpose. A function doing
  I/O + computation + rendering decisions SHOULD be split.

## C-3 React / Next.js (App Router)

- C-301: Server Components are the default. `"use client"` MUST be added
  ONLY when interactivity, hooks, or browser APIs REQUIRE it, and the
  directive MUST be the first line.
- C-302: Data fetching MUST live in Server Components/Route Handlers, NOT
  in `useEffect`. Client-side waterfalls SHOULD be avoided.
- C-303: Images MUST use `next/image` with explicit sizing, NOT raw `<img>`,
  unless an exception is documented.
- C-304: Form controls MUST have associated labels (`htmlFor`/`aria-label`).
  Icon-only buttons REQUIRE `aria-label`.
- C-305: Interactive elements MUST be keyboard-reachable and focus-visible.
  `div`-as-button is FORBIDDEN; use `button` or the shadcn component.
- C-306: Loading states MUST use shadcn `Skeleton`/`Spinner`, NOT custom
  `animate-pulse` divs. Empty states MUST use `Empty`.
- C-307: User-facing strings SHOULD be complete sentences/words, NOT
  concatenated fragments, to keep future i18n possible.

## C-4 Styling (Tailwind v4 + shadcn)

- C-401: Colors/typography MUST come from semantic tokens
  (`bg-primary`, `text-muted-foreground`, `border-border`). Raw values
  (`bg-blue-500`, `bg-[#...]`) are FORBIDDEN in components.
- C-402: Spacing MUST use `gap-*` on flex/grid containers. `space-x-*` /
  `space-y-*` are FORBIDDEN.
- C-403: Equal width+height MUST use `size-*`, NOT `w-* h-*`.
- C-404: Conditional classes MUST use `cn()`, NOT manual ternaries.
- C-405: Truncation MUST use `truncate`, NOT manual overflow/ellipsis combos.
- C-406: Manual `dark:` color overrides are FORBIDDEN. Semantic tokens
  already adapt; token changes belong in `globals.css`.
- C-407: Overlay components (Dialog/Sheet/Popover/Tooltip) MUST NOT get
  manual `z-index`. They manage their own stacking.
- C-408: CSS for Tailwind v4 MUST use `@theme` in `src/app/globals.css`.
  New global CSS files MUST NOT be created.

## C-5 Solidity (contracts work only)

- C-501: Solidity version MUST be 0.8.34 and OpenZeppelin MUST be 5.6.1
  unless `docs/contracts/final/` says otherwise.
- C-502: Upgradeable contracts MUST follow UUPS patterns per
  `docs/contracts/final/`. Storage layout append-only: reordering, removing,
  or retyping existing state variables is FORBIDDEN.
- C-503: Checks-Effects-Interactions order is REQUIRED. `nonReentrant` is
  REQUIRED on external payable/state-changing entry points moving value.
- C-504: Custom errors are REQUIRED over revert strings. Magic numbers
  MUST be named constants (BPS denominators, caps, tolerances).
- C-505: NatSpec (`@notice`/`@param`) is REQUIRED on all external/public
  functions. Events MUST be emitted on every state-changing action.
- C-506: No floating pragmas, no `tx.origin` for auth, no unbounded loops
  over user-controlled arrays without caps.

## C-6 Comments & naming

- C-601: Comments MUST explain WHY, not WHAT. Restating the code is
  FORBIDDEN. Long chain-of-thought in comments is FORBIDDEN.
- C-602: Names MUST be descriptive (`getWeightsFor`, NOT `gw`). Single-letter
  names are allowed ONLY for short loop indices and math formulas with a
  comment defining them.
- C-603: Boolean names MUST read as predicates (`isActive`, `hasRole`,
  `canDistribute`). Negated names (`notReady`) SHOULD be avoided.
- C-604: Test names MUST state behavior + condition
  (e.g. `reverts when epoch is stale`), NOT implementation details.
