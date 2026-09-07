# Simulasi dan Acuan Frontend (`scripts/`)

Jalankan di localhost: `bunx hardhat node` (terminal 1), `./scripts/deploy-localhost.sh` (terminal 2), lalu `npx hardhat run scripts/sim/XX-*.ts --network localhost`. Jangan `bun run` langsung (konfig network HRE tak terpakai). Alamat dibaca dari `ignition/deployments/chain-31337/deployed_addresses.json`; bila node fresh tanpa deploy ulang, script gagal cepat dengan pesan jelas (bukan error `0x` samar).

## File

| File | Isi |
|---|---|
| `generate-abis.ts` | Generate `abis/*Abi.ts` dari artifact (`bun scripts/generate-abis.ts`). Jangan edit hasil generate. |
| `abis/*Abi.ts` | ABI + `as const` → `functionName`/`args`/return ter-infer penuh di viem |
| `sim/lib.ts` | `connect()` (`network.create()` ikut `--network`), alamat journal, `deadline()`, `legCfg()`. `network.connect()` dilarang (deprecated). |
| `sim/state.ts` | Snapshot seluruh state + logger pino-pretty. Aturan: log `BEFORE aksi` → eksekusi → `AFTER aksi`; tanpa assert/penilaian. Bigint jadi string desimal. |
| `sim/01-create-index.ts` | Buat ROCKET300 (pair campuran A/USDG + B/native) |
| `sim/02-add-liquidity-eth.ts` | Add 1 ETH (hanya leg native terisi; bukti aturan quote-match) |
| `sim/03-add-liquidity-usdg.ts` | Mint 100 → approve → add ke RWA300 |
| `sim/04-remove-liquidity.ts` | Add 10 → parse `LiquidityAdded` via `decodeEventLog` untuk tokenIds → approveAll → remove |
| `sim/05-update-index.ts` | Tukar urutan legs RWA300 |
| `sim/06-push-weights.ts` | Push epoch 2 (50/50); add berikutnya wajib `minEpoch >= 2` |
| `sim/07-read-state.ts` | Dump baca murni (acuan query frontend) |

## Pola yang dicontoh untuk frontend

- Instance typed: `getContract({ address, abi: XxxAbi, client: { public, wallet } })`, lalu `router.write.addLiquidityUSDG([...])` — salah tipe argumen gagal di `tsc`, bukan saat runtime.
- Struct array (legs/configs) dikirim sebagai array objek biasa; `bytes` sebagai `"0x"`.
- `tokenIds` hasil add hanya ada di event: parse `LiquidityAdded` dari receipt (`decodeEventLog`), bukan dari return (return hanya ada untuk call sinkron/preview).
- Approve ganda: ERC-20 (`approve` ke router) untuk deposit; ERC-721 (`setApprovalForAll` ke router) untuk remove.
- Baca bobot/epoch dulu untuk isi `minEpoch`; baca `getLegs` untuk susun `configs` sejajar; quote tiap leg menentukan token deposit yang sah.
