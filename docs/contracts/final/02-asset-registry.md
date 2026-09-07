# AssetRegistry

Sumber: `contracts/AssetRegistry.sol` + `contracts/interfaces/IAssetRegistry.sol`. UUPS-upgradeable (`initialize(admin)` memberi `DEFAULT_ADMIN_ROLE` + `REGISTRAR_ROLE` ke admin).

## State

| State | Jenis | Isi |
|---|---|---|
| `_assets[token]` | mapping | Struct `{token, feed, active}` |
| `_allAssets` | array | Daftar token terdaftar (hanya tambah, tak pernah hapus) |

Struct, error, dan event didefinisikan di interface; implementasi mewarisinya.

## Fungsi tulis (role `REGISTRAR_ROLE` semua)

| Fungsi | Efek state | Revert bila |
|---|---|---|
| `register(token, feed)` | `_assets[token] = {token, feed, true}`; push `_allAssets`; emit `AssetRegistered` | token/feed nol (`ZeroToken`/`ZeroFeed`); sudah terdaftar (`AlreadyRegistered`) |
| `setActive(token, active)` | Ubah flag saja; list dan feed tak tersentuh; emit `AssetActiveSet` | belum terdaftar (`NotRegistered`) |
| `updateFeed(token, feed)` | Ganti feed saja; flag dan list tak tersentuh; emit `AssetFeedUpdated` | belum terdaftar; feed nol |

Catatan: feed tidak pernah dibaca on-chain oleh kontrak mana pun (murni display/oracle off-chain); salah isi feed tidak merusak settlement.

## Fungsi baca

`isActive(token)`, `getFeed(token)`, `getAsset(token)`, `getAllAssets()`, plus `isActiveFor(tokens[])` (batch 1 call, dipakai router agar hemat gas dibanding N call).

## Relasi

- Dibaca `WeightRegistry.pushWeights` (keanggotaan), `IndexFactory._buildLegs` (wajib aktif), `IndexRouter._resolveWeights` (skip nonaktif).
- Menonaktifkan aset tidak menghapusnya dari index yang sudah ada; router otomatis melewatinya (dana leg itu di-refund).
