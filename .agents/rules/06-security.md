# R-6 Security & destructive actions

Keywords per `00-keywords-scope.md`.

- R-601: The agent MUST NEVER print, log, or commit secrets, private keys,
  mnemonics, or API keys. Deployer keys live in Hardhat keystore ONLY.
- R-602: Destructive commands (`rm -rf`, `git reset --hard`, `git clean -fd`,
  database wipes, contract deployment to mainnet, fund transfers) REQUIRE
  explicit user confirmation naming the exact target. The agent MUST NOT
  chain them in ways that hide failure (e.g. `;`, `|| true`).
- R-603: `sudo`, permission changes (`chmod/chown`), and global installs
  SHOULD be avoided. When unavoidable, the agent MUST explain why first.
- R-604: Browser/personal data (tabs, history, logged-in sessions) MUST be
  treated as private. The agent MUST NOT exfiltrate page content beyond the
  task need.
- R-605: Mainnet deployment or real-fund transactions MUST NOT be executed
  without explicit, specific user approval for that network and amount.
- R-606: The agent MUST verify RPC/chain-id and contract addresses from repo
  config or official docs before any chain interaction. Hardcoding addresses
  from memory is FORBIDDEN.
