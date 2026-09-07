# LAPORAN: Router Add-Liquidity (bukan swap) — untuk review sebelum coding

- **Tanggal:** 2026-09-07
- **Status:** Riset selesai, BELUM ada perubahan kode. Kode saat ini (`IDEXAdapter.swapExactIn`, router, mock) masih model pembelian.
- **Keputusan terkunci dari owner:** single-sided, posisi langsung di pool Uniswap (NFT ke user), ada fungsi remove.

---

## 1. Fakta Robinhood (sumber: docs resmi)

- Stock Token = **ERC-20 standar** → pool AMM standar seperti Uniswap, composable on-chain (`docs.robinhood.com/chain/building-with-stock-tokens`).
- Halaman Token Contracts (`docs.robinhood.com/chain/contracts`) hanya mempublish **alamat token**, bukan alamat pool:
  - WETH `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73`
  - USDG `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`
  - TSLA `0x322F0929c4625eD5bAd873c95208D54E1c003b2d`
  - SPCX / SpaceX `0x4a0E65A3EcceC6dBe60AE065F2e7bb85Fae35eEa`
  - AAPL, NVDA, MSFT, dst. (tabel live dari on-chain registry)
- **Konsekuensi faktual:** pool per pair (mis. TSLA/USDG) **tidak disediakan docs** — hampir pasti harus kita buat sendiri. Docs Uniswap mengonfirmasi pool bisa dibuat + diisi atomik dalam 1 tx (`initializePool` + mint via PositionManager multicall).
- Venue lain (Rialto propAMM, Lighter orderbook, RFQ) **bukan** tempat permissionless add-liquidity — hanya Uniswap AMM yang cocok.
- **Koreksi contoh:** ROCKET300 (Tesla, SpaceX, Twitter) — Tesla ✓ dan SpaceX (SPCX) ✓ ada kanonis, tetapi **Twitter/X tidak ada** di daftar. Index hanya boleh berisi token kanonis (peringatan docs: nama sama + alamat beda = bukan Stock Token).

## 2. Fakta Uniswap v4 (sumber: developers.uniswap.org, v4-core)

- Add liquidity = `PositionManager.modifyLiquidities` dengan aksi `MINT_POSITION + SETTLE_PAIR`. Parameter mint: `(poolKey, tickLower, tickUpper, liquidity, amount0Max, amount1Max, recipient, hookData)` — **NFT posisi dicetak ke `recipient`**, jadi isi `recipient = user`.
- Remove = liquidity negatif (`liquidityDelta` negatif → delta positif = token kembali ke penelepon), di level PositionManager via aksi `BURN_POSITION` (+ `COLLECT` untuk fee yang menempel).
- Posisi = NFT (seperti v3). Untuk router bisa burn milik user, user harus `approve`/`setApprovalForAll` router atas `tokenId`-nya dulu.
- **Single-sided itu fakta mekanik, bukan mode khusus:** dalam concentrated liquidity, range yang seluruhnya di satu sisi harga berjalan hanya butuh satu token (hanya token0 di atas harga, hanya token1 di bawah harga). Range yang memotong harga berjalan **wajib dua sisi** dan akan revert bila satu sisi nol. Jadi "single-sided" = quoter/FE wajib memilih tick range satu sisi per pool; kontrak wajib validasi (gagal cepat bila range butuh dua sisi).
- `PoolKey = (currency0, currency1, fee, tickSpacing, hooks)`. v4 mendukung native ETH sebagai currency (`address(0)`).

## 3. Mapping desain yang diusulkan (belum diimplementasikan)

Per leg `i` (alokasi `in_i` dari bobot yang sudah ada, logika split/normalisasi **tidak berubah**):

```text
deposit (ETH/USD G) -> in_i按 bobot
  -> PositionManager.modifyLiquidities[MINT_POSITION + SETTLE_PAIR]
     pool = (constituent_i, USDG), range satu sisi dari quoter, recipient = user
  -> NFT posisi (tokenId_i) milik user, return tokenId_i
```

Remove (fungsi baru):

```text
user approve router atas tokenId[] -> router BURN_POSITION + COLLECT per posisi
  -> hasil (constituent + USDG + fee) dikirim ke user
```

Rekomendasi pasangan: **konstituen/USD G** (nilai stabil; ETH sebagai pair mencemari posisi dengan volatilitas gas token). Alternatif WETH/native dicatat bila owner menolak USDG.

## 4. Prasyarat & hal yang belum diketahui (jujur)

1. **Pool harus sudah ada** sebelum add pertama. Opsi: (a) factory inisialisasi pool yang hilang saat `createIndex`, (b) keeper inisialisasi on-demand, (c) router revert bila pool belum ada. Rekomendasi (a).
2. **Parameter pool per pair belum diputuskan:** fee tier, tickSpacing, dan kebijakan range satu sisi (siapa hitung? quoter off-chain + validasi on-chain).
3. **Alamat `PoolManager`/`PositionManager`/Universal Router di chain 4663 belum terverifikasi** — wajib cek Blockscout sebelum tulis adapter produksi. Jangan hardcode dari Ethereum.
4. **Fee tier vs likuiditas tipis:** stock token bervolume kecil butuh fee tier lebih tinggi agar LP (user kita) dapat imbal hasil wajar; ini riset likuiditas lanjutan.

## 5. Dampak ke kode bila disetujui (estimasi)

| File | Perubahan |
|---|---|
| `interfaces/IDEXAdapter.sol` | `swapExactIn` → `addLiquidity(poolKey, tickLower, tickUpper, amountIn, minLiquidity, to, data)` + `removeLiquidity(...)`. Struktur poolKey/tick per leg sejajar constituents (pola sama seperti `swapData`/`minOut` hari ini). |
| `IndexRouter.sol` | `_execute` panggil add; tambah `removeLiquidity(indexId, tokenIds[], ...)`; `amountsOut` → `tokenIds`. Guard basi/fee/dust/skip **tetap**. |
| `contracts/mocks/` | `MockDEXAdapter` jadi posisi LP palsu (mint NFT mock per add, burn per remove). |
| Test (`*.t.sol`, `test/EIndex.ts`) | Ekspektasi spot → ekspektasi tokenId + burn flow. |
| `SPEC-EINDEX-ROUTER.md`, `DEPLOYMENT.md` | Update bagian swap → liquidity. |

## 6. Pertanyaan untuk review owner

1. Setuju pair **konstituen/USD G** (vs WETH/native ETH)?
2. Pembuatan pool yang hilang oleh **factory saat createIndex** (vs keeper vs revert)?
3. Range satu sisi dihitung **quoter off-chain** + validasi on-chain — setuju?
4. Contoh ROCKET300 tanpa Twitter (tak ada token kanonis) — ganti dengan apa?
