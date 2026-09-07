# WeightRegistry

Sumber: `contracts/WeightRegistry.sol` + `contracts/interfaces/IWeightRegistry.sol`. UUPS-upgradeable (`initialize(registry, admin)`).

## State

| State | Jenis | Isi |
|---|---|---|
| `weights[token]` | mapping | Bobot global, basis poin |
| `epoch` | uint64 | Versi bobot, monoton naik |
| `lastUpdateAt` | uint64 | Waktu push terakhir |
| `TOTAL_BPS` | konstanta | 10000 |

Volume mentah tidak disimpan (hemat SSTORE).

## `pushWeights(epochId, tokens[], weightsBps[])` (role `UPDATER_ROLE`)

Semantik upsert: token yang disebut diganti, yang tak disebut dipertahankan. Validasi berurutan:

1. Set tak kosong (`EmptySet`); panjang array sama (`LengthMismatch`).
2. `epochId > epoch` (`StaleEpoch`).
3. Tiap token terdaftar (`UnknownToken`); tanpa duplikat (`DuplicateToken`); array terurut menurun, sama boleh (`NotSorted(i)`).
4. Total seluruh registry (nilai baru untuk yang disebut + tersimpan untuk sisanya, via `_listedWeight`) harus tepat 10000 (`BadSum(total)`).
5. Tulis mapping, `epoch = epochId`, `lastUpdateAt = block.timestamp`, emit `WeightsUpdated`.

Catatan operasional: aset baru terdaftar otomatis berbobot 0 sampai oracle memasukkannya; format push lama tetap diterima setelah ada aset baru (tidak ada deadlock push).

## Fungsi baca

`epoch()`, `lastUpdateAt()`, `weights(token)`, `getWeightsFor(tokens[])` (batch untuk kebutuhan router).

## Relasi

- Menulis: oracle Go (lihat `07-oracle-bobot.md`).
- Dibaca: `IndexRouter._resolveWeights` (ditolak bila `epoch < minEpoch` → `EpochTooOld`, atau `now - lastUpdateAt > 26 jam` → `StaleWeights`).
