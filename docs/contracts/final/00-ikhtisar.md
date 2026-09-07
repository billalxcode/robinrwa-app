# Ikhtisar eIndex Router

Sistem router untuk membentuk posisi liquidity Uniswap v4 secara diversifikasi dalam satu transaksi. Pengguna deposit sekali (ETH atau USDG); router memecah dana按 bobot ke beberapa pair (disebut *leg*, mis. TSLA/USDG), membuka posisi liquidity single-sided per leg, dan mencetak NFT posisi langsung ke wallet pengguna. Pengguna memegang aset riil (posisi LP), bukan unit index.

## Peta dokumen

| File | Topik |
|---|---|
| `00-ikhtisar.md` | Halaman ini |
| `01-arsitektur.md` | Komponen, proxy UUPS, aliran data, role akses |
| `02-asset-registry.md` | Kontrak pendaftaran aset |
| `03-weight-registry.md` | Kontrak bobot global + oracle |
| `04-index-factory.md` | Kontrak definisi index (pair) |
| `05-index-router.md` | Kontrak router: add/remove, matematika, guard |
| `06-adapter-mock-proxy.md` | Interface adapter, mock, proxy, V2 |
| `07-oracle-bobot.md` | Spesifikasi oracle Go off-chain |
| `08-pengujian.md` | Lapisan test dan perilaku yang dijamin |
| `09-deployment.md` | Network, modul Ignition, parameter |
| `10-operasi-upgrade.md` | Kapan upgrade, aturan storage, runbook |
| `11-simulasi-frontend.md` | Skrip simulasi, ABI, pola integrasi frontend |
| `12-oracle-golang.md` | Oracle Go: fungsi, jadwal, algoritma, abigen, operasi |

## Glosarium

| Istilah | Arti |
|---|---|
| Leg | Satu pair dalam index: `{token, quote}`, mis. TSLA/USDG |
| Bobot global | Bobot per token (bps, total 10000) di `WeightRegistry`, dipakai semua index |
| Bobot ternormalisasi | Bobot per leg dalam satu index/epoch, total selalu 10000 |
| Konstituen | Token penyusun index (tanpa quote) |
| Quote | Sisi pair tempat dana deposit masuk (harus sama persis dengan token deposit) |
| Epoch | Nomor versi bobot, naik monoton tiap push oracle (24 jam) |
| Dust | Alokasi leg di bawah ambang → di-skip dan di-refund |

## Perintah cepat

```bash
npx hardhat test                    # seluruh test (Solidity + Node.js)
npx hardhat test solidity           # unit Solidity saja
npx hardhat test nodejs             # integrasi TS saja
npx tsc --noEmit                    # typecheck
bun scripts/generate-abis.ts        # generate ulang ABI dari artifact
bunx hardhat node                   # node lokal (terminal 1)
./scripts/deploy-localhost.sh       # deploy Ignition ke localhost (terminal 2)
npx hardhat run scripts/sim/01-create-index.ts --network localhost
```

## Versi dan dependensi

Solidity 0.8.34. OpenZeppelin Contracts + ContractsUpgradeable 5.6.1 (AccessControl, Pausable, ReentrancyGuard transient, UUPS, ERC721 mock). Hardhat 3 + Toolbox viem. Pola UUPS untuk 4 kontrak utama; tidak ada token index.
