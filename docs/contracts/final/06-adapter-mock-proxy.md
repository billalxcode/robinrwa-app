# Adapter, Mock, dan Proxy

## `IDEXAdapter` (interface, `contracts/interfaces/`)

Abstraksi venue milik proyek, bukan kontrak Uniswap. Dua fungsi:

- `addLiquidity(token, quote, amountIn, tickLower, tickUpper, minLiquidity, to, data) → tokenId`. `quote == address(0)` = native. Tick range satu sisi disiapkan quoter off-chain; kontrak tidak memvalidasi geometri range (venue revert bila range butuh dua sisi → router catch + refund).
- `removeLiquidity(tokenId, amount0Min, amount1Min, to, data) → (amount0, amount1)`.

Adapter produksi (Uniswap v4 `PositionManager`) belum ditulis; baca `docs/LAPORAN-LIKUIDITAS.md` untuk risetnya (PoolKey global fee 0,3%, cek `getSlot0`, NFT ke user).

## `MockDEXAdapter` (`contracts/mocks/`, TEST ONLY)

Posisi LP sebagai NFT ERC721 (`MLP`, `tokenId` dari 1). `setPool(token, quote, liquidity)` seed kesiapan pool; `poolReady = liquidity >= minLiquidity` (default 1); `addLiquidity` revert `PoolNotReady` bila belum ready, kunci input 1:1, `_safeMint` ke penerima; `removeLiquidity` verifikasi pemilik + approval, bakar NFT, kembalikan principal (mock: `(0, amount)`), revert `Slippage` bila di bawah minimum. Jangan deploy di produksi; jangan referensikan dari modul Ignition produksi.

## `MockERC20` (TEST ONLY)

ERC20 mintable terbuka (`mint` tanpa akses kontrol) sebagai pengganti Stock Token/USDG di test.

## `UUPSProxy` (`contracts/`)

Wrapper tipis ERC-1967 milik proyek. Alasan ada: Hardhat 3 hanya emit artifact untuk kontrak proyek, sehingga `ERC1967Proxy`resolver langsung tak bisa dipakai `deployContract`/Ignition. Dipakai semua test dan modul `Deploy*`.

## `AssetRegistryV2` (`contracts/mocks/`, TEST ONLY)

Target upgrade uji (`version` + `reinitializer(2)`), membuktikan state bertahan saat upgrade. Lihat `contracts/Upgrade.t.sol`.
