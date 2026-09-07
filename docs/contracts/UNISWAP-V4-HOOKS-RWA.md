# Riset Uniswap v4 Hooks untuk Auto-Routing Likuiditas ke RWA

- **Tanggal:** 2026-09-06
- **Tujuan:** memakai Uniswap v4 Hooks agar likuiditas/trading fee otomatis masuk ke RWA Index (MAG7-VOL / RWA300)
- **Sumber utama (via Context7):**
  - `/uniswap/v4-core` — `IHooks`, `Hooks` permission flags, `PoolManager.swap / modifyLiquidity`, dynamic fee override
  - `/websites/developers_uniswap` — `BaseHook`, `PoolKey`, contoh `HookFeeAfterSwap`, dynamic fees
  - `/openzeppelin/uniswap-hooks` — `BaseHook` OZ, pola secure/modular, custom accounting, async swaps
- **Konteks proyek:** Robinhood Chain 4663 (partner resmi Uniswap), vault full-collateral, deposit USDG-only, bobot volume 24 jam (`docs/SPEC-MAG7.md`)

---

## 1. Cara kerja Uniswap v4 Hooks (ringkasan docs)

### 1.1 Perbedaan besar v4 vs v3

- v4 memakai **singleton `PoolManager`**: semua pool hidup di satu kontrak, bukan satu kontrak per pool.
- Pool diidentifikasi oleh **`PoolKey`**:

```solidity
struct PoolKey {
  Currency currency0; // sorted, address(0) = native ETH
  Currency currency1;
  uint24 fee;         // jika bit tertinggi = 1 → dynamic fee (harus 0x800000)
  int24 tickSpacing;
  IHooks hooks;       // alamat hook contract
}
```

- Interaksi wajib dalam konteks **`unlockCallback`**. Saldo dihitung sebagai **`BalanceDelta`** (delta per currency, negatif = hutang ke pool).
- Penyelesaian saldo via `settle / take / mint` (claim ERC-6909). Hook bisa ikut ambil (`take`) atau menyumbang delta.

### 1.2 Lifecycle hook

| Tahap | Fungsi | Kegunaan tipikal |
|---|---|---|
| Init | `beforeInitialize / afterInitialize` | validasi, set config awal |
| Liquidity | `beforeAddLiquidity / afterAddLiquidity` | gate, cap, auto-stake |
| Liquidity | `beforeRemoveLiquidity / afterRemoveLiquidity` | lock-up, fee keluar |
| Swap | `beforeSwap / afterSwap` | **titik utama untuk RWA**: potong fee, override fee, redirect output |
| Donate | `beforeDonate / afterDonate` | insentif / bribe ke LP |
| ReturnDelta | `beforeSwapReturnDelta / afterSwapReturnDelta / afterAddLiquidityReturnDelta / afterRemoveLiquidityReturnDelta` | hook boleh mengembalikan delta sendiri (ambil/tambah token) |

Pola yang paling relevan untuk kita: **`afterSwap + afterSwapReturnDelta`** (contoh resmi `HookFeeAfterSwap`).

### 1.3 Permission = alamat CREATE2

Hook aktif berdasarkan **14 bit terbawah alamat kontrak hook**. Deploy harus via CREATE2 (tool: `HookMiner` / `v4-periphery/test/utils/HookMiner.sol`) agar bit cocok dengan flag yang diinginkan.

```solidity
// contoh flag (v4-core Hooks.sol)
Hooks.BEFORE_SWAP_FLAG               = 1 << 7;
Hooks.AFTER_SWAP_FLAG                = 1 << 6;
Hooks.AFTER_SWAP_RETURNS_DELTA_FLAG  = 1 << 2;
```

Di constructor wajib:

```solidity
Hooks.validateHookPermissions(IHooks(address(this)), permissions);
```

Atau jika pakai `BaseHook` (periphery / OpenZeppelin), cukup override:

```solidity
function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
  return Hooks.Permissions({
    beforeInitialize: false,
    afterInitialize: false,
    beforeAddLiquidity: false,
    beforeRemoveLiquidity: false,
    afterAddLiquidity: false,
    afterRemoveLiquidity: false,
    beforeSwap: false,
    afterSwap: true,
    beforeDonate: false,
    afterDonate: false,
    beforeSwapReturnDelta: false,
    afterSwapReturnDelta: true,
    afterAddLiquidityReturnDelta: false,
    afterRemoveLiquidityReturnDelta: false
  });
}
```

### 1.4 Tiga jenis fee yang bisa coexist

1. **LP fee** — ke LP (bisa statis atau dynamic via hook `beforeSwap` + `OVERRIDE_FEE_FLAG`).
2. **Protocol fee** — ke pemilik protokol (via `PoolManager.updateDynamicLPFee` / protocol fee controller).
3. **Hook fee** — diambil hook sendiri via `poolManager.take()` di `afterSwap`, dikembalikan sebagai delta (`afterSwapReturnDelta`).

Contoh dynamic fee override dari docs:

```solidity
import {LPFeeLibrary} from "@uniswap/v4-core/src/libraries/LPFeeLibrary.sol";

function beforeSwap(address, PoolKey calldata, SwapParams calldata, bytes calldata)
  external override returns (bytes4, BeforeSwapDelta, uint24)
{
  uint24 overrideFee = 10000 | LPFeeLibrary.OVERRIDE_FEE_FLAG; // 1% khusus swap ini
  return (IHooks.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, overrideFee);
}
```

### 1.5 Contoh resmi yang jadi fondasi: `HookFeeAfterSwap`

Pola dari `developers.uniswap.org/docs/protocols/v4/guides/custom-accounting`:

```solidity
function _afterSwap(address, PoolKey calldata key, SwapParams calldata params, BalanceDelta delta, bytes calldata)
  internal override returns (bytes4, int128)
{
  bool outputIsToken0 = params.zeroForOne ? false : true;
  int256 outputAmount = outputIsToken0 ? delta.amount0() : delta.amount1();
  if (outputAmount <= 0) return (BaseHook.afterSwap.selector, 0);

  uint256 feeAmount = (uint256(outputAmount) * HOOK_FEE_PERCENTAGE) / FEE_DENOMINATOR;
  // ... tentukan feeCurrency dari exactIn/exactOut ...
  poolManager.take(feeCurrency, address(this), feeAmount);
  return (BaseHook.afterSwap.selector, int128(int256(feeAmount)));
}
```

Intinya: **setelah swap selesai, hook `take` sebagian output sebagai fee milik hook**. Inilah titik yang kita belokkan ke vault RWA.

### 1.6 Catatan keamanan (OpenZeppelin uniswap-hooks)

- Selalu pakai kode library as-is, jangan copy-paste modifikasi (rekomendasi OZ).
- `BaseHook` OZ/periphery sudah sediakan guard `onlyPoolManager`, validasi selector return, helper permission.
- Waspadai reentrancy: hook dipanggil di tengah `unlock`, jangan panggil pool yang sama tanpa guard; gunakan `ReentrancyLock` / checks-effects-interactions.
- Semua `take` harus diimbangi delta return yang benar, kalau tidak transaksi revert karena kurva `unlock` tidak seimbang.

---

## 2. Bagaimana "likuiditas otomatis masuk ke RWA" — 3 pola

### Pola A — Fee-to-RWA (direkomendasikan untuk MVP)

**Ide:** setiap swap di pool (misal USDG/WETH atau USDG/USDC) dipotong hook fee kecil (misal 5–10 bps dari output), fee itu otomatis di-`deposit` ke `IndexVault` → mint `MAG7-VOL / RWA300` ke treasury / LP / referrer.

```text
User swap USDG → WETH
  → PoolManager swap
  → afterSwap hook take 0,05% output
  → hook approve + call vault.deposit(fee)
  → vault swap USDG → 7 Stock Tokens pro-rata weight
  → vault mint index ke feeRecipient
```

Kenapa paling cocok:
- Tidak mengubah UX swap (user tetap terima ~99,95%).
- Tidak perlu likuiditas Stock Token yang dalam di pool hook itu sendiri.
- Kompatibel penuh dengan constraint RHJ (vault tetap beli via secondary seperti biasa).
- Mudah diukur: `totalFeesToRWA` = metrik growth.

Varian penerima: (a) treasury DAO, (b) LP pool itu (auto-compound ke RWA), (c) user yang swap (cashback RWA / "swap-to-own-index").

### Pola B — Swap-to-Index (auto-routing output)

**Ide:** hook mengintersep output swap dan langsung mint index. Misal pool USDG → MAG7-VOL: `beforeSwap` men-nol-kan sebagian input (async pattern OZ) atau `afterSwap` menukar output ke vault.

Cocok jika kita punya pool khusus `USDG / RWA300`. Setiap beli di pool itu = likuiditas langsung menambah backing. Tapi butuh pool index yang likuid dulu (chicken-and-egg), dan Stock Token thin-liquidity membuat slip besar. **Tunda ke fase 2.**

### Pola C — Liquidity-to-Basket (LP auto-collateral)

**Ide:** `afterAddLiquidity` hook mengambil sebagian liquidity yang masuk (atau fee-nya) lalu dialokasikan ke vault. Misal LP deposit USDG/USDC → 10% otomatis dibelikan index.

Kelebihan: narasi "liquidity productive". Kekurangan: mengubah ekspektasi LP (mereka mau LP token, bukan index), akuntansi `afterAddLiquidityReturnDelta` lebih rumit, dan bisa merusak tick math jika tidak hati-hati. **Cocok untuk vault strategi lanjutan, bukan MVP.**

**Keputusan analisa:** mulai dari **Pola A (Fee-to-RWA)**, pool pertama `USDG / WETH` atau `USDG / USDC` (aset likuid, bukan Stock Token langsung agar fee stabil), feeRecipient = treasury + opsi cashback.

---

## 3. Desain konkret yang diusulkan: `RWAFlowHook`

### 3.1 Spesifikasi

- **Pool:** `USDG / WETH` (atau USDG/USDC jika mau volatilitas fee nol), fee dynamic atau 3000 (0,3%), tickSpacing standar.
- **Permission:** `afterSwap = true`, `afterSwapReturnDelta = true`. Sisanya false (minimal attack surface).
- **Parameter:** `hookFeeBps` (misal 5 = 0,05%), `feeRecipient` (treasury multisig), `vault` (IndexVault), `autoDeposit` (bool), `minDeposit` (dust threshold).
- **Alur `afterSwap`:**
  1. Hitung `outputAmount` dari `BalanceDelta` (perhatikan `zeroForOne` + exactIn/exactOut seperti contoh resmi).
  2. `fee = output * hookFeeBps / 10000`. Skip jika di bawah `minDeposit`.
  3. `poolManager.take(feeCurrency, address(this), fee)`.
  4. Jika `feeCurrency != USDG`: swap ke USDG via DEXAdapter/quoter (dengan slippage guard) — atau untuk MVP batasi fee hanya dari sisi USDG agar tanpa swap tambahan.
  5. `USDG.approve(vault)` + `vault.deposit(fee, minMint)` → index token ke `feeRecipient`.
  6. Return `(afterSwap.selector, int128(fee))`.
- **Admin:** `setFeeBps` (capped, misal max 30 bps), `setVault`, `setRecipient`, `pause`. Semua via multisig + timelock.
- **Accounting:** `totalFeesCollected[feeCurrency]`, `totalDepositedToVault`, `totalIndexMinted`. Emit `HookFeeToRWA(swapHash, feeCurrency, fee, indexMinted)`.

### 3.2 Sketch kode (adaptasi contoh resmi + vault kita)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "v4-periphery/src/utils/BaseHook.sol";
import {Hooks} from "v4-core/src/libraries/Hooks.sol";
import {IPoolManager} from "v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "v4-core/src/types/PoolKey.sol";
import {Currency} from "v4-core/src/types/Currency.sol";
import {BalanceDelta} from "v4-core/src/types/BalanceDelta.sol";
import {SwapParams} from "v4-core/src/types/PoolOperation.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IIndexVault {
  function deposit(uint256 usdgAmount, uint256 minMint) external returns (uint256 minted);
  function USDG() external view returns (address);
}

contract RWAFlowHook is BaseHook {
  uint256 public hookFeeBps = 5; // 0,05%
  uint256 public constant BPS_DENOM = 10_000;
  IIndexVault public vault;
  address public feeRecipient;
  bool public autoDeposit = true;

  event HookFeeToRWA(bytes32 indexed swapId, address feeCurrency, uint256 fee, uint256 indexMinted);

  constructor(IPoolManager _m, IIndexVault _vault, address _recipient) BaseHook(_m) {
    vault = _vault;
    feeRecipient = _recipient;
  }

  function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
    return Hooks.Permissions({
      beforeInitialize: false, afterInitialize: false,
      beforeAddLiquidity: false, afterAddLiquidity: false,
      beforeRemoveLiquidity: false, afterRemoveLiquidity: false,
      beforeSwap: false, afterSwap: true,
      beforeDonate: false, afterDonate: false,
      beforeSwapReturnDelta: false, afterSwapReturnDelta: true,
      afterAddLiquidityReturnDelta: false, afterRemoveLiquidityReturnDelta: false
    });
  }

  function _afterSwap(address, PoolKey calldata key, SwapParams calldata params, BalanceDelta delta, bytes calldata)
    internal override returns (bytes4, int128)
  {
    bool outputIsToken0 = params.zeroForOne ? false : true;
    int256 outputAmount = outputIsToken0 ? delta.amount0() : delta.amount1();
    if (outputAmount <= 0) return (BaseHook.afterSwap.selector, 0);

    uint256 fee = (uint256(outputAmount) * hookFeeBps) / BPS_DENOM;
    if (fee == 0) return (BaseHook.afterSwap.selector, 0);

    bool isExactIn = (params.amountSpecified < 0);
    Currency feeCurrency;
    if (isExactIn) {
      feeCurrency = outputIsToken0 ? key.currency0 : key.currency1;
    } else {
      feeCurrency = params.zeroForOne ? key.currency0 : key.currency1;
    }

    poolManager.take(feeCurrency, address(this), fee);

    uint256 minted;
    // MVP: hanya auto-deposit jika fee sudah dalam USDG, selain itu tahan sebagai treasury
    if (autoDeposit && Currency.unwrap(feeCurrency) == vault.USDG()) {
      IERC20(Currency.unwrap(feeCurrency)).approve(address(vault), fee);
      minted = IIndexVault(address(vault)).deposit(fee, 0);
      // catatan: forward index ke feeRecipient — sesuaikan dengan signature vault (mint ke msg.sender vs to)
    }

    emit HookFeeToRWA(keccak256(abi.encode(block.timestamp, outputAmount)), Currency.unwrap(feeCurrency), fee, minted);
    return (BaseHook.afterSwap.selector, int128(int256(fee)));
  }
}
```

> Catatan integrasi: jika `vault.deposit` mint ke `msg.sender` (hook), tambahkan `transfer(index → feeRecipient)` setelahnya. Jika vault support `depositTo(to, ...)`, langsung ke recipient. Tentukan saat scaffold vault.

### 3.3 Deploy (CREATE2 mining)

1. Tulis hook, tentukan permission (`afterSwap` + returnDelta).
2. Mine alamat dengan `HookMiner.find(...)` (salt trial) agar 14 bit cocok.
3. Deploy hook dengan salt tersebut ke `PoolManager` Robinhood Chain.
4. `initialize` pool `PoolKey(USDG, WETH, fee, tickSpacing, hook)`.
5. Seed liquidity via `PositionManager`, uji swap kecil → verifikasi `HookFeeToRWA` + saldo vault bertambah.
6. Grant admin ke multisig, set `hookFeeBps` awal 5 bps.

---

## 4. Pertimbangan khusus Robinhood Chain + RHJ

- **Uniswap tersedia resmi** sebagai public DEX di Robinhood Chain → v4 deploy feasible, tapi verifikasi dulu alamat `PoolManager` / `PositionManager` di 4663 sebelum coding (lihat docs bridging + explorer Blockscout).
- **Jangan jadikan Stock Token sebagai pair pool hook pertama.** Likuiditasnya tipis (RFQ/propAMM dominan) → fee dalam bentuk NVDA/AAPL akan volatile + slip saat auto-swap ke USDG. Mulai dari USDG/WETH atau USDG/USDC.
- **Oracle tetap Chainlink RHJ**, bukan TWAP pool hook, untuk NAV. TWAP pool hanya untuk eksekusi swap fee → USDG jika diperlukan.
- **Halt handling:** jika RHJ `isTradingHalt`, `vault.deposit` harus revert/pause; hook harus fallback menahan fee sebagai USDG treasury (jangan force deposit).
- **Compliance warisan:** hook tidak menghapus kewajiban geoblock + prospektus. Frontend yang pakai pool hook tetap tampilkan disclaimer RHJ.
- **Gas:** `afterSwap` + `deposit` (yang di dalamnya swap ke 7 aset) bisa mahal. MVP: batch deposit — hook kumpulkan fee, `keeper` panggil `flushToVault()` periodik (misal tiap 1 jam / tiap 1000 USDG) agar biaya swap 7-leg diamortisasi.

---

## 5. Risiko & guard

| Risiko | Mitigasi |
|---|---|
| Fee terlalu besar bunuh volume pool | Cap `hookFeeBps` max 30 bps, default 5 bps, governance multisig |
| Reentrancy di tengah `unlock` | `onlyPoolManager`, CEI, OZ BaseHook as-is, audit internal + fork test |
| Slippage auto-swap fee → USDG → 7 aset | `minMint`/`minOut`, threshold `minDeposit`, mode tampung-dulu-flush-periodik |
| Vault pause / halt | Hook fallback ke treasury, emit event, skip deposit |
| Dust attack (banyak swap kecil) | `minDeposit`, flush batching |
| MEV / sandwich di pool hook | Pool likuid (USDG/WETH), fee kecil, monitoring |

---

## 6. Rencana testing di repo ini

- **Unit Solidity** (`contracts/RWAFlowHook.t.sol`): fee math exactIn/exactOut, zero-output skip, cap fee, permission flags, fallback treasury saat vault pause.
- **Integrasi TS** (`test/RWAFlowHook.ts`, viem): fork/local v4 PoolManager mock + mock USDG + mock vault; skenario swap → fee terpotong → index mint ke recipient; skenario flush batching.
- **E2E di Robinhood testnet/4663:** deploy hook + pool USDG/WETH, swap kecil, cek event + NAV vault naik.

---

## 7. Langkah berikutnya yang disarankan

1. Verifikasi alamat Uniswap v4 (`PoolManager`, `PositionManager`, `HookMiner`) di Robinhood Chain 4663 via explorer/docs.
2. Kunci satu keputusan: feeRecipient = treasury vs cashback ke swapper ("swap-to-own-index").
3. Scaffold `RWAFlowHook.sol` + `IIndexVault` minimal + test fee math (tanpa vault penuh dulu).
4. Implementasi `flushToVault()` batching setelah vault MAG7 jadi.

---

## Referensi

- v4-core `IHooks` + permission flags + `PoolManager.swap / modifyLiquidity` + dynamic fee override (Context7 `/uniswap/v4-core`)
- `HookFeeAfterSwap`, `PoolKey`, dynamic fees concepts (Context7 `/websites/developers_uniswap`)
- `BaseHook`, counter/async-swap patterns, usage & security (Context7 `/openzeppelin/uniswap-hooks`)
- `docs/SPEC-MAG7.md` — vault, NAV, WeightRegistry, deposit USDG-only
- Docs resmi: https://docs.robinhood.com/chain/ (Uniswap sebagai public DEX), https://developers.uniswap.org/docs/protocols/v4/
