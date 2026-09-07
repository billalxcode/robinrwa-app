# IndexFactory

Sumber: `contracts/IndexFactory.sol` + `contracts/interfaces/IIndexFactory.sol`. UUPS-upgradeable (`initialize(registry, admin)`).

## State

| State | Jenis | Isi |
|---|---|---|
| `nextIndexId` | uint256 | Counter id (mulai 0) |
| `_indexes[id]` | mapping | Struct `{name, symbol, legs[], exists}` dengan `Leg = {token, quote}` |

`name`/`symbol` hanya label display; tidak ada token index.

## Fungsi tulis (role `DEFAULT_ADMIN_ROLE` semua)

`createIndex(name, symbol, tokens[], quotes[])` → validasi `_buildLegs`, `indexId = nextIndexId++`, simpan, emit `IndexCreated`. `updateIndex` → timpa legs saja (nama/simbol/status utuh), emit `IndexUpdated`. `deactivateIndex` → `exists = false` (data legs tetap), emit `IndexDeactivated`; router menolak index mati (`UnknownIndex` merambat dari `getLegs`).

Aturan `_buildLegs`: panjang array sama (`LengthMismatch`); minimal 2 leg (`TooFewLegs`); token tak nol (`ZeroToken`); quote boleh native `address(0)` tetapi tak boleh sama dengan tokennya (`QuoteEqualsToken`); token wajib aktif (`InactiveToken`, mencakup tak-terdaftar); pasangan (token,quote) unik (`DuplicatePair`) — token yang sama di quote berbeda diizinkan.

## Fungsi baca

`getIndex(id)` (revert bila mati/tak ada), `getLegs(id)`, `nextIndexId()`.

## Relasi

- Dibaca router tiap distribute (`getLegs`); dibaca frontend untuk tampilkan komposisi.
- Perubahan komposisi via `updateIndex` langsung dipakai distribute berikutnya (tanpa migrasi dana karena tak ada pool/vault).
