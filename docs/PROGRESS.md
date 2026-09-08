# Progress — RobinRWA Dashboard eIndex

Rekaman sesi pembangunan 2026-09-07 → 2026-09-08. Disusun dari inventarisasi
3 agent paralel (git log 21 commit, audit kode, kajian roadmap) + catatan
verifikasi sesi. Target pembaca: sesi lanjutan dan reviewer.

> Nilai privat (projectId, RPC, key) TIDAK dicatat di sini. Lihat `.env.local`
> (di-ignore git). Dokumen ini hanya menyebut NAMA variabelnya.

## 1. Ringkasan eksekutif

- Dari starter Create Next App menjadi dashboard eIndex 6 rute + design
  system + agent rules + koneksi wallet Reown AppKit (Robinhood Chain 4663).
- Semua data masih **mock berlabel `Sample`**; modal Provide Liquidity masih
  **preview** (submit butuh wallet, belum `writeContract`).
- Verifikasi tiap fitur: `tsc --noEmit` exit 0, Biome bersih (sisa hanya pola
  bawaan upstream), screenshot browser tiap halaman, `bun run build` exit 0.
- 21 commit di `main`, working tree bersih, tidak ada file terhapus.

## 2. Riset yang dilakukan (sumber resmi, bukan memori)

| Topik | Sumber | Hasil |
|---|---|---|
| Kontrak eIndex | `docs/contracts/` (20 file, 4 subagent) | Evolusi MAG7 → distributor → factory-pool → router → add-liquidity v4; `final/00–12` normatif |
| Chainlink style | Firecrawl `branding` + screenshot | Token awal (direvisi v2) |
| Chainlink layout v2 | browser-use tab khusus: computed style + 314 CSS `:root` + screenshot | Palet eksak gray/blue, radius 4/8px, H1 48px, tabel card-rows |
| BWA style | browser-use tab khusus: stylesheet `app-*.css` + computed + screenshot | Primer `#2447F7→#2447F9`, Poppins, pill, badge pastel, ritme `mb-30`, Hick's Law |
| Aturan agen | agents.md, RFC 2119 (rfc-editor), Context7 README, opencode docs `/rules` + `/agents` | 70 → 108 rules di `.agents/rules/`, wiring `opencode.json` |
| Biome toolchain | Context7 `/biomejs/website` (2 query) | Formatter schema, linter domains, `useImportType`, a11y rules |
| shadcn Sidebar | Context7 `/shadcn-ui/ui` + docs resmi + screenshot blok `dashboard-01` | Pola Provider/Inset/Header/Content, prop `render` (base, BUKAN `asChild`) |
| Reown AppKit | Context7 `/reown-com/reown-docs` (3 query) + subagent browser docs.reown.com | Setup WagmiAdapter, `defineChain`, hooks, `themeVariables`, wagmi 2.x |

## 3. Riwayat commit (fakta `git log`, tua → baru)

| # | Hash | Isi |
|---|---|---|
| 1 | `c03e900` | Initial Create Next App |
| 2 | `dd72c13` | Docs kontrak (`docs/contracts/`, `final/00–12`) |
| 3 | `e826f9e` | `DESIGN-data-chainlink.md` + screenshot feeds |
| 4 | `3fc3bb1` | Install shadcn (61 komponen + `components.json`) |
| 5 | `0510302` | Format massal Biome |
| 6 | `1ac9706` | `import type` di 38 komponen |
| 7 | `c59fc43` | Restyle tema Chainlink ke komponen |
| 8 | `ed823b6` | `.agents/rules/` (12 file) + `opencode.json`, ramping `AGENTS.md` |
| 9 | `6a055f5` | Riset Chainlink v2 + screenshot detail |
| 10 | `909587b` | Shell dashboard (sidebar/navbar/footer) + 5 rute + mock |
| 11 | `e07a9d3` | Styling lanjutan komponen inti |
| 12 | `aa7da3e` | Gaya heading halaman |
| 13 | `a9f1561` | Spacing sidebar + tabel |
| 14 | `96289b1` | `DESIGN-SYSTEM.md` + gaya button |
| 15 | `f2fd635` | UI + docs ke Bahasa Inggris |
| 16 | `a02740e` | Redaksi anti-AI-slop |
| 17 | `a8dc43d` | Rute dinamis `/indexes/[id]` + mock detail |
| 18 | `e594561` | Tombol Provide Liquidity |
| 19 | `ebb763e` | `ProvideLiquidityModal` (preview akurat kontrak) |
| 20 | `cc8c890` | Deps Web3 (appkit, wagmi@2, viem@2, query@5) |
| 21 | `e12a0ee` | `Web3Provider` + `ConnectButton` di navbar (HEAD) |

Catatan: commit dicatat otomatis oleh harness; perintah `git commit/push`
tidak pernah dijalankan manual. Tidak ada file yang dihapus di semua commit.

## 4. State saat ini

**Stack:** Next.js 16.3.4, React 19.2.8, Tailwind v4, shadcn base-nova,
Biome 2.4.2, TS strict, bun 1.3.13, wagmi 2.19.5, viem 2.56.3,
`@tanstack/react-query` 5.102.8, `@reown/appkit` 1.8.23.

**Rute (6):** `/` (overview + tabel preview), `/indexes` (tabel penuh),
`/indexes/[id]` (detail: TVL/24h/30d/APY + info + bobot + token),
`/positions` (Empty state), `/docs` (peta `final/00–12`), `/oracle`
(epoch + bobot contoh).

**Komponen app (6):** `app-sidebar` (Menu + Resources, pill, active state),
`app-navbar` (trigger + breadcrumb dinamis + badge + `ConnectButton`),
`app-footer`, `connect-button` (custom: Connect Wallet ↔ alamat terpotong),
`web3-provider` (WagmiAdapter + `createAppKit`, tema Poppins/brand/16px),
`provide-liquidity-modal` (toggle ETH/USD G, jumlah, preview fee 20bps +
split per-leg, skip↔`skipTokens`, peringatan quote-match ETH,
submit jujur "butuh wallet").

**Lib (4):** `web3.ts` (chain 4663 via `defineChain`, networks tuple,
metadata, konstanta env), `site.ts` (breadcrumb incl. rute dinamis),
`mock.ts` (3 index + bobot, jumlah pas 10.000), `utils.ts` (`cn`).

**Token desain:** background `#F6F8FD`, ink `#34364A`, primer `#2447F9`,
wash `#E8EFFF`/`#E5E9F2`, border `#E5E7EB`, Poppins. Detail mengikat:
`docs/DESIGN-SYSTEM.md` (10 bab, 47 aturan).

**Aturan agen:** `.agents/rules/` 12 file, 108 rules (01 Context7
enforcement, 07 code style C-101–C-604, dst.), dimuat via `opencode.json`
`instructions`. Detail: `AGENTS.md` (index).

**Konfigurasi rahasia:** `.env.local` berisi `NEXT_PUBLIC_REOWN_PROJECT_ID`,
`NEXT_PUBLIC_ROBINHOOD_RPC_URL`, `NEXT_PUBLIC_ROBINHOOD_EXPLORER_URL`
(di-ignore git; KODE membaca via konstanta di `web3.ts` dengan fallback).

## 5. Keputusan penting + alasan

1. **Chainlink → BWA.** Riset v2 membuktikan token Chainlink, tapi BWA
   (pill, Poppins, wash, badge pastel) dipilih pemilik untuk rasa ramah.
2. **Mock berlabel, bukan data palsu.** Semua mock bertanda `Sample`;
   bobot RWA300 (43.1/31.0/25.9) dari contoh SPEC, bukan karangan.
3. **Modal jujur.** Submit tanpa wallet menampilkan status, TIDAK memalsu
   transaksi. Quote-match ETH diperingatkan (`NoEligibleLegs`) sesuai
   implementasi `IndexRouter.sol` yang dibaca langsung.
4. **Tidak ada swap langsung.** Atas koreksi pemilik: likuiditas HANYA via
   kontrak `../contracts` (`addLiquidityETH/USD G`), bukan Uniswap langsung.
5. **Deps x402 terpaksa.** Build gagal `Can't resolve '@x402/core/client'`
   (rantai Coinbase connector) → tambah `@x402/*` + `@solana/kit`.
6. **`nativeButton={false}`** wajib untuk `Button render={<Link/>}`
   (error Base UI terbukti di dev overlay). Sidebar memakai `render`
   (base), BUKAN `asChild`.

## 6. Masalah diketahui (bukan bug kode kita)

- Overlay "1 Issue" `Cannot redefine property: ethereum` berasal dari
  ekstensi wallet Chrome (`evmAsk.js`) yang berebut `window.ethereum`.
  Solusi: nonaktifkan satu ekstensi saat development.
- Duplikasi `@reown/appkit` 1.8.23 vs 1.7.8 (nested di ethereum-provider).
  Hari ini tanpa gejala; awasi saat upgrade.
- `size="lg"` Button pernah lebih kecil dari `default` — DIPERBAIKI
  (`xs h-6 < sm h-9 < default h-12 < lg h-14`).
- Breadcrumb rute dinamis pernah early-return — DIPERBAIKI, terverifikasi
  "Home / Index / RWA300".

## 7. Verifikasi terakhir per area (sesi ini)

- `tsc --noEmit` exit 0; Biome exit 0 (sisa hanya pola upstream);
  `bun run build` exit 0 (7 rute); screenshot Home/Index/Positions/detail +
  modal AppKit account (Fund/Swap/Send/Activity/Disconnect) — semua render;
  wallet pemilik (`0xAe60…3a01`) terdeteksi tanpa aksi transaksi.

## 8. Roadmap (dari kajian kontrak `final/11`, detail di jawaban roadmap)

**Fase 1 — wiring wallet → kontrak:** (1) config alamat + ABI
(`contracts.ts`, `generate-abis.ts`, tanpa hardcode); (2) read `getLegs` +
epoch untuk `configs`/`minEpoch`; (3) `approve` USDG; (4)
`addLiquidityUSDG` via `writeContract` + tampilkan hash;
(5) `addLiquidityETH` + `value` (uji quote-match); (6) parse
`LiquidityAdded` → `tokenIds` via `decodeEventLog`.
**Fase 2 — data real:** (7) oracle on-chain, hapus Badge Sample;
(8) indexes + detail dari read kontrak; (9) positions dari NFT wallet.
**Fase 3 — remove:** (10) `setApprovalForAll` NFT; (11) submit remove per
`tokenId` (nama fungsi persis belum terkonfirmasi di `11` — jangan tebak).
**Fase 4 — open items:** (12) putuskan `muted-foreground`/`border`;
(13) putuskan display font.
