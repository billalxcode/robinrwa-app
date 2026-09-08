# Design System — RobinRWA Dashboard eIndex

Dokumen normatif gaya visual aplikasi. Sumber: riset terukur
`docs/DESIGN-data-chainlink.md` + riset BuildWithAngga (tab browser, stylesheet
`app-*.css`, computed style). Implementasi: `src/app/globals.css` (token),
`src/components/ui/*` (komponen), `src/app/*` (halaman).

Bahasa aturan: **BOLEH** = diizinkan. **WAJIB** = harus. **DILARANG** =
dilarang. Pengecualian terhadap WAJIB/DILARANG WAJIB ditulis alasannya di PR.

## 1. Prinsip konsistensi (berlaku untuk semua pekerjaan UI)

1. **Sedikit token, dipakai berulang tanpa kecuali.** Konsistensi BWA datang
   dari 1 biru + 1 ink + 1 wash + 1 radius pill + 1 padding tombol. Jangan
   menambah warna/radius/spasi baru tanpa menghapus yang lama.
2. **Estimasi dilarang.** Semua angka di dokumen ini hasil ukur. Nilai baru
   WAJIB diukur dari browser (`getComputedStyle`) atau disalin dari sini.
3. **Semantic token, bukan hex.** Komponen DILARANG menulis hex mentah
   (`bg-[#...]`, `text-[#...]`). Satu-satunya tempat hex BOLEH muncul adalah
   `globals.css` dan file ini. Pengecualian: attribute selector SVG pihak
   ketiga (recharts) yang di-override token.
4. **Ubah shared component = ubah semua pemakai.** `src/components/ui/*`
   dipakai lintas halaman. Perubahan visual di sana WAJIB di-screenshot
   minimal 2 halaman (Home + 1 halaman tabel) sebelum selesai.
5. **Aset dan copy milik pihak ketiga DILARANG disalin** (logo, ikon,
   ilustrasi, teks Chainlink/BWA). Gaya BOLEH ditiru, materi WAJIB milik
   sendiri.

## 2. Warna

Token hidup di `:root` `src/app/globals.css`. Nilai final (light):

| Token | Hex | Dipakai untuk |
|---|---|---|
| `--background` | `#F6F8FD` | Background halaman (wash BWA) |
| `--foreground` | `#34364A` | Teks utama/heading (ink BWA) |
| `--card` / `--popover` | `#FFFFFF` | Kartu, dialog, menu, popover |
| `--primary` | `#2447F9` | CTA utama, link, badge aktif, ikon brand |
| `--primary-foreground` | `#FFFFFF` | Teks di atas primer |
| `--secondary` / `--accent` | `#E8EFFF` | Badge sekunder, hover menu, wash |
| `--secondary-foreground` / `--accent-foreground` | `#2447F9` | Teks di atas wash |
| `--muted` | `#E5E9F2` | Latar redup (footer card, chip) |
| `--muted-foreground` | `#4E5560` | Teks sekunder, deskripsi, header tabel |
| `--border` / `--input` | `#E5E7EB` | Garis tabel, border input, separator |
| `--ring` | `#2447F9` | Focus ring |
| `--destructive` | oklch merah bawaan | Aksi berbahaya saja |
| `--sidebar` | `#FFFFFF` | Sidebar selalu putih |
| `--chart-1..5` | `#2447F9, #5B8DEF, #9DB9F2, #4E5560, #9FA7B2` | Chart, dari brand ke abu |

Aturan pakai:
- Teks body WAJIB `text-foreground`, teks sekunder WAJIB
  `text-muted-foreground`. Teks abu DILARANG memakai `text-gray-*` langsung.
- Satu layar BOLEH memuat maksimal 2 warna aksen (primer + 1 status).
  Pelangi badge DILARANG.
- Background halaman WAJIB wash (`bg-background`), kartu WAJIB putih.
  Kartu abu di atas halaman abu DILARANG (kontras hilang).
- `destructive` BOLEH dipakai hanya untuk aksi hapus/bahaya. Status
  "Nonaktif" BUKAN destructive — pakai `secondary`.
- Mode gelap (`.dark`) dipertahankan fungsional; primer/ring WAJIB tetap
  `#2447F9`. Desain menarget light.

## 3. Tipografi

Font: **Poppins** (`--font-sans`, weights 300–700, `next/font`, `display:
swap`), fallback Inter → Arial. Kode/mono: Geist Mono. Kelas heading:
`font-heading` (mengikuti `--font-sans`).

| Level | Kelas | Ukuran/berat | Use case |
|---|---|---|---|
| H1 halaman | `font-heading text-5xl font-bold tracking-tight` | 48px/700 | Judul tiap rute, tepat 1 per halaman |
| H2 section | `32px/700` Poppins | Judul band/section besar (landing) |
| Judul kartu | `CardTitle` (`text-base font-semibold`) | Judul di dalam Card |
| Body | `text-sm`–`text-base`, 400 | Isi, deskripsi pakai `text-muted-foreground` |
| Label/meta | `text-xs font-medium` | Label sidebar group, header tabel (`font-semibold`), footer |
| Badge | `text-xs font-medium` | Status, TIDAK BOLEH uppercase manual |
| Angka tabel/harga | `tabular-nums` WAJIB | Kolom angka, epoch, bps, harga |

Aturan:
- H1 WAJIB diikuti 1 baris deskripsi `text-muted-foreground`: maksimal 15
  kata, menjelaskan fungsi halaman, tanpa klaim berlebih. Contoh yang
  DILARANG: kalimat pasif bertele-tele ("Preview — sample data, not on-chain
  data."). Contoh yang BOLEH: "One deposit split by volume weight."
- Daftar token/simbol DILARANG memakai pemisah teks (`·`, `,`, `/`).
  WAJIB badge `outline` tersusun `flex flex-wrap gap-1.5`.
- Pemisah `·` antar fakta DILARANG di semua UI. Gabungan dua fakta WAJIB
  dipecah: badge terpisah, baris terpisah, atau koma natural
  ("In USDG pool, 0.30% fee, 33.3% share"). Judul metadata HTML dikecualikan.
- Baris estimasi deposit WAJIB format: logo + ticker + nominal
  (`tabular-nums`), baris kedua muted: kalimat koma natural
  ("In USDG pool, 0.30% fee, 33.3% share").
- Saldo tampil di bawah input jumlah + tombol teks `Max`; saldo kurang
  WAJIB menonaktifkan submit + hint merah 1 baris.

### 3.1 Microcopy (aturan kata; sumber: NN/g 3 C's + Material UX writing)

- **Jelas dulu, ringkas kedua.** Setiap teks WAJIB menjawab: apa yang terjadi
  / apa yang harus dilakukan user. Jargon kontrak (`approve(router)`,
  `transferFrom`, `NoEligibleLegs`, nama fungsi) DILARANG di UI — pindahkan
  ke docs/komentar kode (progressive disclosure).
- **Judul = tujuan, bukan gabungan fakta.** Em-dash (`—`) untuk menempel
  konteks ke judul DILARANG ("Provide Liquidity — MOON300"). Konteks milik
  deskripsi 1 baris ("See how your deposit into MOON300 is split.").
- **Tujuan dulu, baru aksi** ("See how your deposit ... is split",
  bukan "Preview only. Submitting calls ...").
- **Akibat, bukan mekanisme** ("Skipped legs are refunded automatically",
  bukan "map to `skipTokens[]`"; "This index only accepts USDG",
  bukan "quote mismatch, reverts ...").
- **Kata umum, present tense, tanpa huruf kapital judul** di label
  ("Pay with", "Amount", "Fee", "You invest"). Istilah teknis
  (`nativeButton`, `tokenIds`, `bps` di label user) DILARANG — `bps`
  BOLEH hanya di tabel data mentah (kolom "Weight (bps)").
- Bold (`font-bold`) BOLEH hanya untuk H1/H2 dan angka hero. Body bold
  DILARANG (pakai `font-medium`/`semibold`).
- `tracking-tight` WAJIB untuk H1, DILARANG untuk body.
- Bahasa UI: English (keputusan pemilik, menggantikan default Indonesia).

## 4. Spacing (jarak)

Satuan dasar 4px (Tailwind). Ritme yang mengikat:

| Konteks | Nilai | Keterangan |
|---|---|---|
| Konten `main` | `p-6 md:p-10`, `gap-10` | Lega ala BWA di desktop, rapat aman di mobile |
| Grid kartu | `gap-6` | Stat cards, docs, oracle |
| Gap dalam kartu | 30px (`--card-spacing`) | Token kartu, bukan class manual |
| Padding kartu | 30px vertikal+horizontal | Dari token, jangan timpa per halaman |
| Baris tombol ganda | 2 CTA berdampingan maksimal | Aturan Hick's Law |
| Section landing | `mb-[30px]`-style rhythm | Satuan ritme vertikal BWA |
| Padding sel tabel | `px-4 py-4`, tepi `pl-6/pr-6` | Diukur dari Chainlink (15/12/24px) |
| Padding menu sidebar | `px-4 py-3`, gap antar-item `1.5` | Tinggi item ~48px |
| Padding tombol primer | `px-6`, tinggi `h-12` | Ukuran BWA (48px) |
| Padding input | mengikuti `h-10` | Jangan timpa manual |

Aturan:
- Angka spacing BOLEH hanya dari skala Tailwind (`4, 6, 8, 10`) atau token
  komponen. Nilai ganjil (`p-[13px]`) DILARANG kecuali meniru pengukuran
  riset dan dicatat di sini.
- `space-x-*`/`space-y-*` DILARANG — WAJIB `gap-*` pada flex/grid.
- Mengurangi padding kartu/tabel agar "muat banyak" DILARANG. Jika konten
  sesak, BOLEH: (a) tambah halaman/rute, (b) pakai Tabs, (c) ringkas kolom.

## 5. Radius

Sistem 3 tingkat (hasil riset BWA + Chainlink, diukur):

| Tingkat | Nilai | Dipakai untuk |
|---|---|---|
| **Pill** (`rounded-full`) | penuh | Tombol semua ukuran, badge, chips, pagination, switch, radio, menu sidebar, input/select/combobox satu-baris |
| **Kartu** (`rounded-[16px]`) | 16px | Card, dialog, alert-dialog, toast. BUKAN `rounded-xl/2xl` tema |
| **Kontrol kecil** (`rounded-lg`) | tema | Item menu dropdown/command, tooltip, tabs trigger, skeleton, checkbox, kbd |

Aturan:
- `rounded-md/sm` DILARANG muncul di komponen baru. Satu-satunya sisa
  (`attachment` varian xs) adalah override compact yang disengaja.
- Radius WAJIB konsisten dalam satu keluarga: semua item dalam 1 menu
  WAJIB sama. Semua tombol WAJIB pill termasuk `xs/sm`.
- Gambar di dalam kartu WAJIB mengikuti radius kartu
  (`rounded-t-[16px]`/`rounded-b-[16px]`).

## 6. Shadow, border, hover/focus

- Kartu: `shadow-none`, `border-0`. Efek mengambang datang dari kontras
  putih vs wash — BUKAN dari shadow. Shadow BOLEH hanya untuk: dialog/
  popover/menu (`shadow-md/lg`, elevasi layer) dan hover tombol primer.
- Border 1px `#E5E7EB` BOLEH untuk: baris tabel, input, navbar, footer,
  separator. Border pada Card DILARANG.
- Hover tombol primer: warna TETAP, tambah ring
  `0 0 0 4px rgba(36,71,249,.25)` + `transition-all duration-300`.
  Hover yang menggelapkan primer DILARANG (perilaku BWA).
- Hover baris tabel: `bg-muted/50` (sudah di komponen, jangan diulang di
  halaman). Hover item menu: `data-highlighted:bg-accent` (mekanisme
  base-ui — class `hover:` saja TIDAK cukup untuk item menu).
- Focus: `ring-3 ring-ring/50` via komponen. Focus ring kustom DILARANG.
- Baris tabel `cursor-pointer` BOLEH hanya jika baris benar-benar bisa
  diklik (ada handler). Pajangan DILARANG berpura-pura interaktif.

## 7. Komponen — spec & use case

### 7.1 Button (`src/components/ui/button.tsx`)
Varian: `default` (CTA primer, 1 per viewport diutamakan), `secondary`
(aksi pendamping — SELALU berpasangan dengan primer, pola BWA 50/48),
`outline` (aksi tersier), `ghost` (aksi dalam baris/toolbar), `destructive`
(hapus saja), `link` (navigasi tekstual dalam paragraf).
Ukuran (monoton naik, WAJIB dipakai sesuai konteks): `xs` (`h-6 text-xs`,
konteks super-padat) < `sm` (`h-9 text-sm`, toolbar/sel tabel) < `default`
(`h-12 px-6 text-base`, CTA halaman) < `lg` (`h-14 px-8 text-lg`, hero saja).
Ikon: `icon-xs/sm/icon/icon-lg` = `size-6/9/12/14` mengikuti skala yang sama.
Ikon WAJIB
`data-icon="inline-start|inline-end"`, tanpa kelas ukuran.
`nativeButton={false}` WAJIB saat `render={<Link/>}` (error Base UI
terbukti di dev overlay bila dilanggar).

### 7.2 Badge
Pill `h-5 text-xs`. `default` = status positif/aktif (teks putih).
`secondary` = status netral/nonaktif (wash + teks brand). `outline` =
metadata (jaringan, versi). `destructive` = error/risiko saja.
Badge DILARANG memuat kalimat — maksimal 2 kata. Angka dalam badge WAJIB
`tabular-nums`.

### 7.3 Card
Putih, tanpa border/shadow, radius 16px, padding 30px, `gap` 30px antar
slot. Komposisi WAJIB lengkap bila dipakai: `CardHeader` (Title +
Description) → `CardContent` → opsional `CardFooter`. DILARANG menaruh
konten langsung tanpa Header. `CardDescription` WAJIB ada bila kartu
berisi tabel/data (menjelaskan sumber: contoh vs on-chain).
`size="sm"` (padding 20px) BOLEH untuk kartu dalam dialog/konteks padat.

### 7.4 Table
Header: `h-12 px-4`, `text-xs font-semibold text-muted-foreground`,
tanpa background. Sel: `px-4 py-4`, tepi `pl-6/pr-6`, `text-sm`,
`tabular-nums` untuk angka. Baris: separator bawah + hover redup.
Kolom identitas (nama index/token) WAJIB `text-primary font-medium`.
Tabel SELALU di dalam Card (dengan Description sumber data). Kolom aksi
BOLEH hanya bila aksinya berfungsi — tombol pajangan DILARANG.
Lebar: full-bleed dalam kartu; scroll-x di mobile, jangan perkecil padding.

### 7.5 Input / Select / Textarea / Combobox / OTP
Satu-baris = pill + `h-10` + `bg-background` + `shadow-none`. Focus =
border + ring brand (dari komponen). Label WAJIB via `Field`/`Label`
(`text-sm font-medium`), BUKAN placeholder sebagai satu-satunya label.
Textarea (multiline) BOLEH `rounded-xl` — satu-satunya input non-pill.
Item pilihan (select/combobox/command/menu): `rounded-lg`,
`px-2 py-1.5`, highlight `data-highlighted:bg-accent`.

### 7.6 Sidebar / Navbar / Footer
Sidebar putih, collapsible icon + Rail. Urutan WAJIB: Header (brand) →
Content (grup "Menu" lalu "Resources", masing-masing Label + Menu) →
Footer (badge jaringan + versi). Item: pill, `px-4 py-3`, ikon + label,
aktif = wash + teks brand + medium. `tooltip={title}` WAJIB (mode
collapse). Item menu DILARANG tanpa rute (tidak ada tombol mati).
Navbar: `sticky`, tinggi 74px, putih 80% + blur, `px-10`: Trigger +
Separator + Breadcrumb + badge kanan. Breadcrumb BOLEH maksimal 2 level
(`Home / X`). Footer: putih, border atas, `px-10 py-6`, teks xs redup +
link kanan.

### 7.7 Dialog / Sheet / Popover / Menu / Tooltip
Konten: putih, `rounded-xl`, `p-6`, `shadow` elevasi. Dialog WAJIB punya
Title (+ Description bila ada konsekuensi). Menu/popover WAJIB
`border-border`. Tooltip: primer (teks putih). Toast: `rounded-xl`.
Kalender: mengikuti token seleksi primer.
Alur multi-langkah WAJIB modal stepper terpisah: 1 status per langkah
(nomor → spinner saat loading → centang saat done → terkunci), tombol aksi
nonaktif WAJIB alasan 1 baris, tidak ada transaksi palsu (simulasi
DILARANG).

### 7.8 Tabs / Pagination / Breadcrumb / Accordion
Tabs: trigger `rounded-lg`, hover menaikkan kontras, aktif tegas.
Pagination: pill, aktif = primer, nonaktif = outline. Breadcrumb link
hover primer. Accordion trigger `rounded-lg`.

### 7.9 Empty / Skeleton / Spinner / Alert
Keadaan kosong WAJIB pakai `Empty` (ikon + judul + deskripsi + 1 CTA) —
jangan rakit div manual. Loading WAJIB `Skeleton`/`Spinner`, DILARANG
`animate-pulse` rakitan. Info penting pakai `Alert`, bukan teks polos
berwarna.

## 8. Pola halaman (komposisi WAJIB)

Setiap rute mengikuti urutan:
1. Header: H1 (`font-heading text-5xl font-bold tracking-tight`) + Badge
   `secondary` "Contoh" bila data mock + 1 baris deskripsi redup.
2. CTA primer di kanan header BILA ada aksi utama (maksimal 1).
3. Stat cards (`grid gap-6`, 2–4 kolom): label redup + angka besar
   tabular + catatan kecil.
4. Konten utama: Card tabel ATAU grid cards ATAU Empty state.
5. Footer global sudah di layout — halaman DILARANG menambah footer sendiri.

Aturan data contoh: setiap angka/tabel mock WAJIB dilabeli Badge
"Sample" + deskripsi kartu maksimal 2 kata ("Sample data.").
Data mock hidup di `src/lib/mock.ts`, BUKAN tersebar di halaman.

## 9. Checklist sebelum selesai (UI task)

1. Token baru? Harus masuk `globals.css`, bukan class arbitrary.
2. Radius mengikuti tabel §5? Tidak ada `rounded-md/sm` baru?
3. Spacing mengikuti tabel §4? Tidak ada nilai ganjil?
4. Hover/focus mengikuti §6? Item menu pakai `data-highlighted`?
5. Mock dilabeli (§8)? Bahasa Indonesia?
6. `tsc --noEmit` exit 0 + Biome bersih + screenshot 2 halaman?

## 10. Open items

- ~~Skala `size="lg"` Button lebih kecil dari `default`~~ — diperbaiki
  (`xs h-6 < sm h-9 < default h-12 < lg h-14`, lihat §7.1).
- `muted-foreground`/`border` bukan hasil ukur BWA (dipertahankan dari
  riset Chainlink, masih selaras visual).
- `font-display` ala Chainlink (TASAOrbiter) tidak dipakai; Poppins
  mengisi peran display + body sekaligus.
