# R-7 Project stack — smart-contract conventions (robinrwa-app)

Keywords per `00-keywords-scope.md`.

- R-708: Contract docs: `docs/contracts/final/00–12` is normative;
  `docs/contracts/` root files are historical. New contract work MUST cite
  the `final/` doc and section.
- R-709: Simulation scripts MUST be run via
  `npx hardhat run scripts/sim/XX-*.ts --network localhost`, NEVER `bun run`
  directly (HRE network config would be skipped).
- R-710: Solidity version is 0.8.34; OpenZeppelin 5.6.1; upgradeable (UUPS)
  patterns per `docs/contracts/final/`. Deviations MUST be justified in the
  PR/summary.
