# Oracle Bobot Go: Cara Kerja, Fungsi, Jadwal, dan Teknis

Lanjutan dari `07-oracle-bobot.md`, diperdalam sampai level implementasi Go. Oracle di sini **hanya oracle bobot** — oracle harga tetap Chainlink RHJ (bukan bagian service ini).

## 1. Fungsi oracle dalam desain sekarang (3 fungsi, tidak lebih)

| # | Fungsi | Penjelasan |
|---|---|---|
| 1 | Baca volume | Ambil `dailyTradingVolume` tiap aset terdaftar dari `GET https://api.robinhood.com/rhj/prices`; bandingkan dengan `AssetRegistry.getAllAssets()` agar set sinkron |
| 2 | Hitung bobot | `weight = vol / Σvol × 10000` per aset, bulatkan ke integer, koreksi rounding ke bobot terbesar, urut menurun |
| 3 | Push on-chain | Kirim `WeightRegistry.pushWeights(epoch+1, tokens, weights)`; tunggu receipt; catat log; alert bila gagal |

Yang **bukan** tugas oracle: feed harga (Chainlink), kustodi dana (kontrak tak pegang dana user), pembuatan pool, rebalance posisi, registrasi aset (kerjaan admin via `AssetRegistry`).

## 2. Kapan oracle jalan

| Pemicu | Detail |
|---|---|
| Cron 24 jam | Tiap 00:00 UTC (epoch = epoch on-chain + 1, dibaca dulu via `epoch()` — jangan hitung lokal) |
| Startup | Sekali saat service start (isinisialisasi state + verifikasi koneksi), lalu ikut jadwal cron |
| Retry | Bila `pushWeights` revert/gagal broadcast: backoff 1m → 5m → 15m, maksimal sampai 20 jam sejak push terakhir |
| Alert, bukan push | Bila > 20 jam tanpa push sukses (batas aman sebelum `STALE_TOLERANCE` 26 jam mematikan distribute): page operator |

Catatan: aset baru yang diregistrasi admin otomatis terbawa di push berikutnya (baca registry dinamis tiap siklus; bobot 0 bila belum ada data volume).

## 3. Teknis end-to-end

### 3.1 Struktur service yang disarankan

```text
oracle/
  main.go            # wiring + scheduler (cron 24 jam + retry worker)
  config/            # env: RPC_URL, REGISTRY, WEIGHT_REGISTRY, UPDATER_KEY (KMS ref), RHJ_API
  rhj/               # client GET /prices dan /assets (timeout 10s, retry 3x)
  weights/           # kalkulasi murni (tanpa I/O; unit-testable): hitung, rounding, sort, validasi sum
  chain/             # ethclient + binding abigen: read epoch/getAllAssets, pushWeights, wait receipt
  monitor/           # log JSON per epoch + alert (push gagal, drift registry, staleness)
```

### 3.2 Binding kontrak (abigen dari artifact Hardhat)

```bash
abigen --abi artifacts/contracts/WeightRegistry.sol/WeightRegistry.json \
  --pkg chain --type WeightRegistry --out oracle/chain/weight_registry.go
abigen --abi artifacts/contracts/AssetRegistry.sol/AssetRegistry.json \
  --pkg chain --type AssetRegistry --out oracle/chain/asset_registry.go
```

Regenerate tiap kali kontrak berubah; commit hasilnya agar build reproducible.

### 3.3 Algoritma kalkulasi (package `weights`, wajib unit test)

```go
// Murni, tanpa I/O.
func Compute(volumes map[common.Address]*big.Float) (tokens []common.Address, weights []uint16, err error) {
    // 1. total = Σ vol (vol negatif/nol -> bobot 0, tetap masuk list agar set lengkap)
    // 2. w_i = floor(vol_i / total * 10000)
    // 3. sisa = 10000 - Σw_i -> tambahkan ke indeks bobot terbesar
    // 4. sort menurun berdasarkan bobot (stabil; ties pertahankan urutan registry)
    // 5. return; pemanggil validasi Σ == 10000 sebelum broadcast
}
```

Kasus tepi: total volume 0 → semua bobot 0, sum ≠ 10000 → **jangan broadcast** (kontrak akan revert `BadSum`); alert operator. Aset tanpa data volume → bobot 0, tetap sertakan agar set lengkap.

### 3.4 Siklus push (package `chain` + `main`)

```go
// Pseudocode satu siklus:
epoch, _ := weight.CallEpoch()                 // read, jangan hitung lokal
assets, _ := registry.CallGetAllAssets()
vols := rhj.FetchVolumes(assets)               // HTTP + retry
tokens, weights, _ := weights.Compute(vols)
tx, _ := weight.TransactPush(opts, epoch+1, tokens, weights) // UPDATER key, gas estimate + 20%
receipt := wait(tx, 2 menit)
log { epoch, tokens, weights, txHash, lastUpdateAt }
```

Detail koneksi: `ethclient.Dial(RPC_URL)`; `bind.NewKeyedTransactorWithChainID` (chainId Robinhood 4663; baca via `eth_chainId`, jangan hardcode buta);nonce dari `PendingNonceAt`; gas: `EstimateGas` + margin, atau `SuggestGasPrice` + batas maksimum yang dikonfigurasi (abort bila di atasnya + alert).

### 3.5 Validasi kontrak yang harus diantisipasi (pesan revert = diagnosis)

| Revert | Arti operasional |
|---|---|
| `StaleEpoch` | Epoch lokal basi (push ganda / dianggap gagal padahal sukses) → baca ulang `epoch()`, lanjutkan |
| `BadSum` | Bug kalkulasi / data volume korup → jangan retry buta, alert + dump input |
| `UnknownToken` | Registry berubah di tengah siklus → baca ulang aset, hitung ulang |
| `NotSorted` / `DuplicateToken` | Bug sort/dedup → perbaiki kode, bukan retry |
| RPC timeout / underpriced | Retry backoff; naikkan fee dalam batas konfigurasi |

## 4. Keamanan dan operasi

- Key updater = akun khusus **hanya** `UPDATER_ROLE` (tanpa admin, tanpa dana; isi gas secukupnya via faucet/transfer terjadwal). Bocor pun dampaknya terbatas pada bobot — dan bobot salah tetap harus lolos `sum == 10000` + sort.
- Rotasi key: grant role ke alamat baru → revoke lama (`grantRole`/`revokeRole` oleh admin multisig).
- Log tiap epoch (JSON): timestamp, epoch, input volume, output bobot, tx hash, `lastUpdateAt` pasca-push. Simpan ≥ 90 hari untuk rekonsiliasi.
- Metrik minimal: `oracle_push_success`, `oracle_push_latency`, `oracle_hours_since_push` (alert > 20), `oracle_registry_drift` (aset registry ∉ data RHJ).
- Test: unit `weights.Compute` (tabel: normal, ties, nol, satu dominan, rounding); integrasi: dry-run terhadap node lokal (`anvil`/hardhat node + DeployLocalhost) sebelum sentuh mainnet.
