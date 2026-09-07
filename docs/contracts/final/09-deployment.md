# Deployment

## Network (`hardhat.config.ts`)

`hardhatMainnet`/`hardhatOp` (simulasi EDR untuk test), `sepolia` (staging EVM), `robinhood` (chainId 4663, secrets `ROBINHOOD_RPC_URL`/`ROBINHOOD_PRIVATE_KEY` via keystore), `localhost` (127.0.0.1:8545). Deploy produksi wajib flag `--build-profile production` (optimizer aktif; default mati).

## Modul Ignition (`ignition/modules/`)

| Modul | Isi | Parameter |
|---|---|---|
| `Deploy.ts` (`DeployModule`) | 4 implementation + 4 `UUPSProxy` + `initialize` atomik | `admin`, `dexAdapter`, `usdg`, `feeTo`, `feeBps` (def 20), `dustThreshold` (def 1) |
| `DeployLocalhost.ts` | Seperti Deploy + mock (2 saham, USDG, adapter, 4 pool 1e24) + seed (register, bobot [6000,4000] epoch 1, index RWA300) | tanpa parameter (admin = deployer) |
| `Upgrade{AssetRegistry,WeightRegistry,IndexFactory,IndexRouter}.ts` | Deploy implementation baru + `upgradeToAndCall(proxy, initData)` | `proxy`, `initData` (def `"0x"`) |

Contoh:

```bash
npx hardhat ignition deploy ignition/modules/Deploy.ts --network robinhood \
  --parameters deploy-params.json --build-profile production
npx hardhat ignition deploy ignition/modules/UpgradeIndexRouter.ts --network robinhood \
  --parameters '{"UpgradeIndexRouterModule": {"proxy": "0x...", "initData": "0x"}}'
./scripts/deploy-localhost.sh   # localhost 1 perintah (node jalan dulu)
```

## Pasca-deploy produksi (berurutan)

1. Catat 4 alamat proxy (yang dipakai aplikasi; bukan implementation).
2. `register` tiap Stock Token kanonis (alamat dari `docs.robinhood.com/chain/contracts`) + feed Chainlink-nya.
3. `pushWeights` epoch 1 dari oracle.
4. `createIndex` per produk.
5. Role: `REGISTRAR_ROLE` ke operator, `UPDATER_ROLE` ke oracle, pastikan `DEFAULT_ADMIN_ROLE` hanya multisig.
6. Smoke test: `addLiquidity` kecil → cek NFT + saldo router 0 → `removeLiquidity` → cek dana kembali.
