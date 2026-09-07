# Deployment & Upgrade — eIndex Router (UUPS Proxy)

- **Tanggal:** 2026-09-06
- **Jaringan target:** Robinhood Chain (chainId 4663)
- **Pola:** UUPS proxy (ERC-1967). State tinggal di proxy, logika di implementation. Upgrade = ganti implementation, state utuh.
- **Dokumen terkait:** `docs/SPEC-EINDEX-ROUTER.md` (desain), `ignition/modules/Deploy.ts`, `ignition/modules/Upgrade*.ts`

---

## 1. Fungsi masing-masing kontrak

| Kontrak | Jenis | Fungsi |
|---|---|---|
| `UUPSProxy` | Proxy (ERC-1967) | Menyimpan semua state + alamat implementation. Satu proxy per kontrak logika (4 proxy total). Tidak punya logika bisnis. |
| `AssetRegistry` | Logika (UUPS) | Daftar aset Stock Token RHJ yang boleh masuk index: `token → {feed, active}`. Digunakan factory (validasi) dan oracle (cakupan push). |
| `WeightRegistry` | Logika (UUPS) | Bobot volume global per aset (`sum = 10000`), `epoch`, `lastUpdateAt`. Ditulis oracle Go 1x/24 jam, dibaca router tiap distribute. |
| `IndexFactory` | Logika (UUPS) | Definisi index: `indexId → {name, symbol, constituents, exists}`. Tanpa pool, tanpa token. |
| `IndexRouter` | Logika (UUPS) | Satu-satunya titik deposit. Baca index dari factory + bobot dari registry, split ETH/USDG, swap via adapter, kirim token ke user, refund sisa. |
| `IDEXAdapter` (+ `Mock*`) | Interface / mock | Adapter produksi (mis. Uniswap/Rialto) belum ada — router bicara via interface. Mock hanya untuk test, tidak di-deploy production. |

Alamat yang dipakai aplikasi/FE **selalu alamat proxy**, bukan implementation.

---

## 2. Prasyarat

```bash
# RPC + deployer key (pola sama seperti SEPOLIA_* di hardhat.config.ts)
npx hardhat keystore set ROBINHOOD_RPC_URL
npx hardhat keystore set ROBINHOOD_PRIVATE_KEY
```

Siapkan `deploy-params.json`:

```json
{
  "DeployModule": {
    "admin": "0xMultisigAdmin...",
    "dexAdapter": "0xAdapterProduksi...",
    "usdg": "0xUSDGdiRobinhoodChain...",
    "feeTo": "0xTreasury...",
    "feeBps": "20",
    "dustThreshold": "1"
  }
}
```

Catatan: `admin` idealnya multisig (pemegang `DEFAULT_ADMIN_ROLE` = pengendali upgrade).

---

## 3. Workflow deploy awal

```bash
# 1. Deploy 4 implementation + 4 proxy (initialize atomik di tx yang sama)
npx hardhat ignition deploy ignition/modules/Deploy.ts \
  --network robinhood --parameters deploy-params.json
```

Yang terjadi per kontrak: deploy implementation → deploy `UUPSProxy(impl, initialize(...))` → proxy langsung aktif. Catat 4 alamat proxy dari output.

```bash
# 2. Registrasi aset (contoh: AAPL, NVDA, MSFT — alamat dari Token Contracts resmi)
#    via cast / script / multisig: AssetRegistry.register(token, feed) per aset

# 3. Push bobot awal (oracle Go): WeightRegistry.pushWeights(epoch=1, tokens, weights)

# 4. Buat index: IndexFactory.createIndex("RWA300", "RWA300", [AAPL, NVDA, MSFT])

# 5. Serah-terima role (opsional tapi disarankan):
#    - grant REGISTRAR_ROLE ke operator registry
#    - grant UPDATER_ROLE ke alamat oracle Go (cabut dari deployer bila perlu)
#    - pastikan DEFAULT_ADMIN_ROLE hanya di multisig

# 6. Smoke test: distributeETH kecil → cek token diterima + proxy balance 0
```

---

## 4. Workflow upgrade

```bash
# Upgrade satu kontrak (contoh router), tanpa menyentuh 3 lainnya:
npx hardhat ignition deploy ignition/modules/UpgradeIndexRouter.ts \
  --network robinhood --parameters upgrade-params.json
```

`upgrade-params.json`:

```json
{
  "UpgradeIndexRouterModule": {
    "proxy": "0xProxyRouterLama...",
    "initData": "0x"
  }
}
```

Yang terjadi: deploy implementation baru → `upgradeToAndCall(implBaru, initData)` di proxy. State (bobot, index, fee, registry) tetap. `initData = "0x"` bila V2 tak butuh init state baru; bila butuh (mis. `initializeV2`), isi dengan hasil encode:

```ts
import { encodeFunctionData } from "viem";
encodeFunctionData({ abi: routerAbi, functionName: "initializeV2", args: [...] });
```

Ulangi dengan module `UpgradeAssetRegistry / UpgradeWeightRegistry / UpgradeIndexFactory` sesuai kebutuhan. Upgrade bersifat per-kontrak dan independen.

---

## 5. Kapan harus upgrade (use case)

| Situasi | Aksi |
|---|---|
| Bug di logika (math, guard, rounding) | Upgrade kontrak terkait |
| Fitur baru (mis. mode deposit baru, field index baru) | Upgrade + tambah storage di belakang + `initializeV2` bila perlu |
| Ganti venue DEX | **Tanpa upgrade** — cukup `router.setAdapter(baru)` (admin) |
| Ganti fee / treasury / dust / USDG | **Tanpa upgrade** — `setFee / setUsdg / setDust` |
| Tambah/hapus aset index | **Tanpa upgrade** — `register / setActive / createIndex / updateIndex` |
| Bobot baru tiap hari | **Tanpa upgrade** — `pushWeights` oleh oracle |
| Perubahan breaking (skema bobot beda total, hapus fungsi dipakai integrasi) | Deploy stack baru berdampingan + migrasi, bukan upgrade in-place |

Prinsip: yang bisa diubah via fungsi admin/oracle jangan di-upgrade. Upgrade hanya untuk perubahan kode.

---

## 6. Upgrade dengan kontrak baru — boleh vs jangan

**Boleh:**
- Tambah state variable **di belakang** variabel yang ada (append-only).
- Tambah fungsi, event, error, role baru.
- Tambah `initializeV2()` dengan `reinitializer(2)` untuk init state baru (panggil via `initData` saat upgrade).
- Perketat validasi / perbaiki math (selama format storage sama).

**Jangan (merusak storage proxy):**
- Mengubah urutan, menghapus, atau mengganti tipe state variable yang sudah ada (mapping, array, uint, address — semua dihitung).
- Mengubah `immutable`/`constant` yang dipakai sebagai... (catatan: `constant` aman karena tak pakai slot; `immutable` dilarang untuk config per-deployment).
- Upgrade ke implementation yang **bukan UUPS** (proxy jadi tak bisa di-upgrade lagi — `UUPSUpgradeable` menolaknya, tapi jangan coba bypass).
- Memakai ulang `initialize()` lama untuk init V2 (terkunci `initializer`; pakai `reinitializer(n)`).
- Mengganti mekanisme `_authorizeUpgrade` tanpa memastikan admin baru valid (risiko kunci permanen / takeover).

**Sebelum upgrade mainnet:** jalankan `Upgrade.t.sol`-style test untuk V2 (state lama terbaca + fitur baru jalan), lalu smoke test di fork/testnet: baca `epoch`, `getConstituents`, 1x `distribute` kecil.

---

## 7. Referensi file

- `ignition/modules/Deploy.ts` — deploy awal (4 impl + 4 proxy).
- `ignition/modules/Upgrade{AssetRegistry,WeightRegistry,IndexFactory,IndexRouter}.ts` — upgrade per kontrak.
- `ignition/modules/DeployLocalhost.ts` — stack lokal + mock + seed (1 perintah).
- `contracts/UUPSProxy.sol` — proxy ERC-1967 milik proyek.
- `contracts/mocks/AssetRegistryV2.sol` + `contracts/Upgrade.t.sol` — contoh V2 + pola uji upgrade.

---

## 8. Simulasi localhost (acuan frontend)

```bash
bunx hardhat node                                            # terminal 1
./scripts/deploy-localhost.sh                                # terminal 2 (Ignition)
npx hardhat run scripts/sim/01-create-index.ts --network localhost
# ... 02-add-liquidity-eth, 03-add-liquidity-usdg, 04-remove-liquidity,
#     05-update-index, 06-push-weights, 07-read-state
```

- `scripts/generate-abis.ts` — generate ulang `scripts/abis/*Abi.ts` dari artifact (`bun scripts/generate-abis.ts`). ABI `as const` → `functionName`/`args` ter-infer penuh di viem (`getContract`, `readContract`, `writeContract`).
- `scripts/sim/lib.ts` — koneksi (`network.create()` ikut `--network`), alamat dari `ignition/deployments/chain-31337/deployed_addresses.json`, helper deadline + leg config.
- Tiap `scripts/sim/0*.ts` = 1 aksi (create, add ETH, add USDG, remove, update, push weights, read). Event `LiquidityAdded` di-parse via `decodeEventLog` (contoh di `04`).
- Tiap aksi log **BEFORE → AFTER seluruh state** via pino-pretty (`scripts/sim/state.ts`): chain, saldo user, registry, bobot, index, config router, pool + posisi adapter. Tanpa penilaian — murni perubahan state.
