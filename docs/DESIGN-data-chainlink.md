# DESIGN.md: data.chain.link (Chainlink Data Feeds)

## Source
- URL: https://data.chain.link/ dan https://data.chain.link/feeds
- Capture date: 2026-09-07 (UTC)
- Evidence: Firecrawl `branding` + `markdown` + `summary` scrape (2 halaman), screenshot full-page `/feeds` (lokal: `./assets/chainlink-data-feeds.png`)
- Batasan: HTML mentah hanya shell JS tanpa `<style>`/CSS file (28 CSS vars yang terbaca hanya milik toast/sidebar), `firecrawl_interact` timeout, `webfetch` kena 429. Nilai yang tidak terukur diberi label **inferred** (aproksimasi dari screenshot); sisanya **observed** (dari output scrape terstruktur).

> Catatan hak: warna, font, dan pola layout di bawah adalah observasi untuk inspirasi desain. Jangan menyalin logo, ikon, ilustrasi, atau copy milik Chainlink.

## Reference Screenshot
![Full-page screenshot of data.chain.link/feeds](./assets/chainlink-data-feeds.png)

Jadikan screenshot ini sumber kebenaran visual untuk layout, hierarki, densitas, dan rasa. Token di bawah mendeskripsikan halaman yang sama dalam bentuk machine-readable.

## Design Summary
Light-only, high-contrast, dev-tool presisi: background putih, teks near-black, satu aksen biru (`#0847F7`) yang dipakai hemat (CTA, link, badge), border 1px abu muda di mana-mana, radius kecil untuk kontrol dan pill untuk chips/badge, tabel berupa "card rows" putih ber-border (bukan grid garis), section lega, hampir tanpa shadow kecuali soft-shadow pada resource cards. Tipografi Inter untuk UI + display sans geometris untuk heading. Cocok ditiru untuk aplikasi data/DeFi yang butuh kesan institusional dan keterbacaan angka.

## Design Tokens

### Colors
| Role | Hex | Status |
|---|---|---|
| Brand / primary action | `#0847F7` | observed |
| Ink / teks utama | `#141921` | observed |
| Abu teks | `#4E5560` | observed |
| Muted / placeholder / ikon sekunder | `#9FA7B2` | observed |
| Border / garis | `#E5E7EB` | inferred |
| Lavender wash (banner, toast, chip ikon) | `#EDE8FF` | observed |
| Lingkaran ikon cards | `#EEF2FF` | inferred |
| Background halaman / kartu / baris | `#FFFFFF` | observed |
| Band infografis (wash gradasi) | `#F7F9FC` → `#F4F6FF` | inferred |
| Strip nav aktif | `#0847F7` (2–3px) | observed |

- `colorScheme: light` only (observed). Tidak ada dark mode.
- Biru dipakai hemat: CTA, link feed, badge SVR, breadcrumb, panah cards.

### Typography
- Body/UI (observed): `Inter, Arial, "Helvetica Neue", Helvetica, sans-serif`
- Heading (observed dari `fontStacks.heading`): `TASAOrbiterDisplay, ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`
- Skala (observed dari branding): `h1 28px`, `h2 28–36px`, `body 14px`
- Kecil UI (inferred dari screenshot): header tabel / chips / footer `12–13px`, badge `10–11px` bold uppercase
- Berat: body 400, label/tombol 500–600, heading ~600 (inferred)
- Angka (inferred): tabular-nums untuk kolom Answer/Heartbeat agar rata (`$79,370.49`, `00:32:40`)
- Hierarki: breadcrumb 13px biru → H1 28px ink → subtitle 14–15px abu → konten 13–14px

### Spacing And Layout
- Base unit `4` (observed) → skala 4/8/12/16/24px
- Shell (observed + inferred): sidebar ikon sempit putih + border kanan tipis, topbar putih (logo kiri, search + CTA kanan), konten tengah max-width ~1100–1200px (inferred)
- Sel tabel: padding vertikal ~12–16px (inferred); gap antar-baris kartu kecil
- Cards resources: padding ~24px, gap grid ~20–24px (inferred)
- Section rhythm lega ~64–96px antar-band (inferred)
- Radius (observed dari branding): kontrol `6px`, input `4px`; (inferred dari screenshot): dropdown `6–8px`, baris `8px`, cards `12–16px`, chips/badge/tombol Prev-Next `999px` (pill)
- Border: selalu `1px solid` abu muda (inferred `#E5E7EB`)
- Shadow: kontrol/input `none` (observed); baris tabel tanpa shadow; resource cards soft-shadow halus + border (inferred); tidak ada shadow berat

## Components
- **Primary button** (`Request data`): solid `#0847F7`, teks putih 13–14px medium, padding ~8–10px × 16–20px, radius 6px, tanpa shadow. Varian outline (`Next`): border + teks biru, bg putih, pill.
- **Dropdown filter** (`All Networks 30`): putih, border 1px abu, radius 6–8px, teks kecil + count.
- **Chips**: putih, border 1px abu, radius pill, ikon network 14–16px kiri, teks 12–13px.
- **Tabel feeds**: header tanpa background (teks navy 12–13px semibold + ikon sort/info); tiap baris = kartu putih ber-border radius ~8px; kolom: Feed (link biru + ikon token 16–18px) | Network | Answer (ink, tabular) | Deviation | Heartbeat | Asset class. Pagination: `Prev` disabled outline-abu, teks tengah abu 13px, `Next` outline-biru.
- **Badge `SVR`**: solid biru, teks putih 10–11px bold uppercase, pill, padding ~2–4px × 6–8px.
- **Resource cards** (2×2): putih, border 1px abu, radius 12–16px, soft-shadow, ikon dalam lingkaran wash-biru, judul 14px semibold, desc 13px abu, panah biru melingkar kanan.
- **Toast/banner CRE**: bg lavender `#EDE8FF`, radius 8–12px, teks ungu tua, link biru.
- **Footer**: putih, top-border muda, teks link abu 12–13px multi-kolom.
- **Ikonografi**: outline tipis ~1.5px, geometris (hegagon), ikon network bulat kecil berwarna.

## Page Patterns
Urutan section (observed dari markdown): banner CRE → sidebar + topbar → breadcrumb `Data /` → H1 + subtitle → filter dropdown → chips → tabel → pagination (`Showing 1 to 10 of 1819 entries`) → band infografis (H2 tengah + diagram) → `Data Feeds Resources` 2×2 cards → footer link farm (Developers, Products, Use Cases, Community, Resources, Chainlink, Contact, Social).
- Pola tabel-paginasi-infografis-resources ini bisa dipakai 1:1 untuk halaman daftar index/feed di aplikasi kita.
- Responsif (inferred): sidebar collapse ke ikon, tabel scroll-x, cards 2→1 kolom.

## Content Style
- Voice: profesional, faktual, kalimat pendek. Contoh observed: `Highly secure, reliable and decentralized real-world data published onchain.`, `Battle-tested infrastructure for highly secure and reliable market-representative data.`
- CTA: `Request data`, `Read the docs`, `Explore use cases`, `Talk to an expert`, `Start building`.
- Heading deskriptif, bukan playful. Copy padat data (angka, threshold, heartbeat), minim marketing fluff.

## Agent Build Instructions
Target stack repo ini: Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript (cek `package.json`).

1. Definisikan token di Tailwind v4 via `@theme` (contoh):
   ```css
   @theme {
     --color-brand: #0847F7;
     --color-ink: #141921;
     --color-gray-text: #4E5560;
     --color-muted: #9FA7B2;
     --color-line: #E5E7EB;
     --color-wash: #EDE8FF;
     --color-wash-blue: #EEF2FF;
     --font-sans: "Inter", Arial, "Helvetica Neue", sans-serif;
   }
   ```
   Heading display (pengganti TASAOrbiterDisplay yang proprietari): pakai `Inter` 600 dengan tracking sedikit negatif — jangan klaim sebagai font Chainlink.
2. Aturan komponen: tombol primer solid brand radius 6px; chips/badge pill; tabel sebagai card-rows (border 1px `line`, radius 8px, gap antar-baris); angka pakai `tabular-nums`; resource cards putih + border + `shadow-sm`.
3. Jangan menyalin aset Chainlink (logo hegagon, ikon network, infografis, copy). Buat ikon/teks sendiri dengan gaya yang sama.
4. Nilai bertanda **inferred** boleh disesuaikan ±2px saat implementasi; yang **observed** (hex brand, font stack, skala tipe) dipertahankan.

## Rerun Inputs
workflow: firecrawl-website-design-clone
source_url: https://data.chain.link/
target_stack: Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript
output: docs/DESIGN-data-chainlink.md
evidence: Firecrawl branding+markdown+summary (`/` dan `/feeds`), screenshot `./assets/chainlink-data-feeds.png`
```

