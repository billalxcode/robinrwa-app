# Pengujian

Perintah: `npx hardhat test` (semua), `npx hardhat test solidity`, `npx hardhat test nodejs`, `npx tsc --noEmit`. Total saat dokumen ditulis: 72 passing (68 Solidity + 4 Node.js).

## Lapisan

| Lapisan | Lokasi | Isi |
|---|---|---|
| Unit Solidity | `contracts/*.t.sol` (forge-std) | Tiap kontrak: happy path, semua jalur revert, event. Dijalankan lewat proxy (bentuk deployment asli), kecuali mock langsung. |
| Integrasi TS | `test/EIndex.ts` (viem, `node:test`, fixture) | Alur end-to-end: deploy → seed → add ETH/USD G → epoch baru → stale revert. |
| Red team | `contracts/RedTeam.t.sol` | 10 hipotesis attacker, semua dieksekusi (lihat bawah). |
| Upgrade | `contracts/Upgrade.t.sol` | State bertahan V1→V2; init langsung di implementation ditolak. |

## Perilaku yang dijamin test (pilihan penting)

- Matematika: split 60/40 dan 3334/3333/3333 tepat tanpa residu; duplikat token terbagi rata; remainder ke leg terbesar; jumlah bobot ternormalisasi selalu 10000.
- Dana: router bersaldo 0 pasca-tx; saldo terkunci adapter == jumlah posisi; gagal-leg selalu refund penuh; remove mengosongkan posisi + burn NFT + kuras adapter.
- Akses: outsider ditolak semua fungsi ber-role; fee di atas 50bps ditolak; pause blokir distribute dan unpause memulihkan.
- Korelasi: ganti bobot → distribute ikut; `updateIndex` → distribute ikut; pool belum-ready → skip + refund tepat.
- Red team: feeTo reentrant gagal atomik tanpa dana bergerak; adapter bohong terdeteksi (id tanpa dana); transfer ETH langsung ditolak; skip semua → revert bersih.

## Menambah test baru

Ikuti pola file yang ada: deploy via `UUPSProxy` + `abi.encodeCall(initialize)`, `vm.deal` untuk ETH, `vm.warp` untuk waktu, `vm.expectRevert(selector)` presisi bila mampu. Mock ERC721 butuh `onERC721Received` di kontrak test penerima NFT.
