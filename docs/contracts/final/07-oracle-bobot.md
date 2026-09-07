# Oracle Bobot (off-chain)

Oracle adalah service Go (di luar repo ini) + akun `UPDATER_ROLE` pemegang kunci. Tugasnya satu: tiap 24 jam hitung bobot dan kirim `pushWeights`.

## Algoritma per epoch (contoh 00:00 UTC)

1. `assets = AssetRegistry.getAllAssets()`.
2. Tiap aset: `vol = RHJ GET /prices → dailyTradingVolume` 24 jam terakhir.
3. `weight_bps = vol / sum(vol) × 10000`, dibulatkan ke integer; koreksi rounding ke bobot terbesar agar jumlah pas 10000.
4. Urut menurun (kontrak menolak bila tidak: `NotSorted`).
5. Kirim `pushWeights(epoch+1, tokens, weights)`; bila aset baru muncul, sertakan (bobot 0 untuk yang belum ada datanya); bila gagal, ulangi — router menolak bobot lebih tua dari 26 jam (`STALE_TOLERANCE`), jadi keterlambatan > 26 jam menghentikan distribute (fail-closed, disengaja).

## Aturan validasi kontrak (pengingat)

Set tak kosong, panjang sama, epoch naik, semua token terdaftar, tanpa duplikat, terurut menurun, total seluruh registry tepat 10000 (yang tak disebut di push memakai nilai tersimpan). Parsial diizinkan justru agar format push lama tetap sah setelah ada aset baru.

## Monitoring wajib

- Alert bila push telat > 20 jam (batas aman sebelum 26 jam) atau `pushWeights` revert (`BadSum`, `UnknownToken` = drift registry vs oracle).
- Simpan log perhitungan per epoch (volume mentah + pembulatan) untuk audit; volume mentah tidak ada on-chain.
- Kunci updater di KMS/multisig; sungguh pun key bocor, kerusakan terbatas pada bobot (dana user tidak dipegang kontrak mana pun).
