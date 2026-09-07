# Operasi dan Upgrade

## Kapan upgrade vs cukup panggil fungsi

| Situasi | Aksi |
|---|---|
| Bug logika / fitur baru di kode | Upgrade kontrak terkait |
| Ganti venue DEX | Tanpa upgrade: `setAdapter` |
| Ganti fee/treasury/dust/USD G | Tanpa upgrade: `setFee`/`setUsdg`/`setDust` |
| Ubah komposisi index | Tanpa upgrade: `updateIndex` (+ `register`/`setActive` bila perlu) |
| Bobot harian | Tanpa upgrade: `pushWeights` |
| Darurat | `pause` (hentikan distribute/remove), investigasi, `unpause` |
| Perubahan breaking total | Stack baru berdampingan + migrasi, bukan upgrade in-place |

Prinsip: yang bisa diubah via fungsi admin/oracle jangan di-upgrade.

## Aturan kontrak V2 (melanggar = storage proxy rusak)

Boleh: tambah state di belakang; tambah fungsi/event/error/role; `initializeV2()` dengan `reinitializer(2)` (dipanggil via `initData` saat upgrade); perketat validasi. Jangan: ubah urutan/hapus/ganti tipe state lama; upgrade ke non-UUPS (dikunci selamanya); pakai ulang `initialize()` lama; ganti `_authorizeUpgrade` tanpa admin pengganti yang valid. `constant` aman (tak pakai slot); `immutable` dilarang untuk config per-deployment.

## Runbook upgrade

1. Tulis V2 (contoh: `contracts/mocks/AssetRegistryV2.sol`), tambah test gaya `Upgrade.t.sol` (state lama terbaca + fitur baru jalan).
2. `npx hardhat test` hijau + `npx tsc --noEmit` bersih.
3. Dry-run di fork/testnet: upgrade → baca `epoch`/`getLegs` → 1x add + 1x remove kecil.
4. Eksekusi via modul `Upgrade*` memakai multisig sebagai deployer (pemegang admin).
5. Verifikasi pasca: event `Upgraded`, config (`feeBps`, registry) tak berubah, smoke test ulang.
