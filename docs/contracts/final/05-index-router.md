# IndexRouter

Sumber: `contracts/IndexRouter.sol` + `contracts/interfaces/IIndexRouter.sol`. UUPS-upgradeable. Guard: `nonReentrant` (ReentrancyGuard transient OZ v5, tanpa init) + `whenNotPaused` + `onlyRole(DEFAULT_ADMIN_ROLE)` untuk admin.

## Konstanta dan config

`BPS_DENOM = 10000`, `MAX_FEE_BPS = 50`, `STALE_TOLERANCE = 26 jam`. Config (ubah via setter + event, default deploy: fee 20bps, dust 1 wei): `usdg`, `dexAdapter`, `feeTo`, `feeBps`, `dustThreshold`. Referensi baca: `factory`, `weightRegistry`, `assetRegistry`.

## `addLiquidityETH / addLiquidityUSDG`

Tahapan identik (ETH: `msg.value`, `tokenIn = address(0)`; USDG: `transferFrom` setelah approve, `tokenIn = usdg`):

1. `deadline` (`DeadlineExpired`), dana tak nol (`NoFunds`).
2. `getLegs`; panjang `configs` harus sama (`LengthMismatch`).
3. `_resolveWeights`: tolak epoch lama (`EpochTooOld`) dan bobot basi (`StaleWeights`); ambil bobot global + status aktif batch; leg layak = aktif + quote == token deposit + tak di-skip.
4. Normalisasi: `total` = jumlah bobot global token-token unik yang layak; `w_leg = global × 10000 / total / occurrences_token`; sisa pembulatan ke leg ternormalisasi terbesar (jumlah selalu tepat 10000).
5. Fee `total × feeBps / 10000` ke `feeTo`; `net` sisanya.
6. `_fillLeg` per leg: `in = net × w / 10000`; di bawah dust → skip; panggil adapter (`addLiquidity`, native sertakan value, ERC-20 approve exact per leg); **gagal adapter di-catch → leg 0, dana tetap untuk refund**.
7. Refund seluruh sisa (ETH atau USDG) ke pemanggil; emit `LiquidityAdded(user, indexId, epoch, tokenIn, net, tokenIds)`.

Contoh (bobot 6000/4000, deposit 100 USDG, fee 20bps): net 99,8 → leg A 59,88 + leg B 39,92 + fee 0,2; residu 0.

## `removeLiquidity(tokenIds[], amount0Min[], amount1Min[], data[], deadline)`

Per `tokenId`: `adapter.removeLiquidity(...)` ke pemanggil; gagal → dilewati (hasil 0,0), bukan revert. Emit `LiquidityRemoved`. Syarat: pemanggil sudah approve NFT ke router (`setApprovalForAll`/`approve`), bila tidak leg itu gagal diam-diam (cek return 0).

## Error dan event lain

Error: `ZeroAddress`, `FeeTooHigh`, `NoFunds`, `LengthMismatch`, `StaleWeights`, `EpochTooOld`, `NoEligibleLegs` (semua leg tak layak), `RefundFailed` (catatan: revert guard reentrancy yang tertelan low-level call muncul sebagai ini — penting untuk monitoring). Event admin: `FeeUpdated`, `AdapterUpdated`, `UsdgUpdated`, `DustUpdated`.

## Invarian terjaga (dibuktikan test)

Router bersaldo 0 pasca-tx; dana gagal-leg selalu refund; tokenId 0 = leg tak terisi; setter/pause/upgrade hanya untuk admin.
