# Arsitektur

## Diagram komponen

```text
                    +------------------+
                    |  Oracle Go (off) |
                    | volume -> bobot  |
                    +--------+---------+
                             | pushWeights (1x/24 jam)
                             v
+----------------+   +------------------+   +------------------+
| AssetRegistry  |   |  WeightRegistry  |   |  IndexFactory    |
| token->aktif   |   | token->bps, epoch|   | id->{legs pair}  |
+-------+--------+   +--------+---------+   +--------+---------+
        |                     |                      |
        +----------+----------+----------+-----------+
                   |                     |
                   v                     v
            +----------------------------------+
            |           IndexRouter            |
            |  ETH/USD G -> split -> adapter  |
            +---------------+------------------+
                            | add/removeLiquidity
                            v
                 +------------------------+
                 | IDEXAdapter (Uniswap)  |
                 | posisi NFT -> user     |
                 +------------------------+
```

Empat kontrak logika (`AssetRegistry`, `WeightRegistry`, `IndexFactory`, `IndexRouter`) masing-masing berjalan di belakang satu `UUPSProxy` (ERC-1967). State tinggal di proxy; upgrade mengganti implementation tanpa memindahkan state. Aplikasi selalu memakai alamat proxy.

## Aliran data tulis

1. Admin daftarkan aset: `AssetRegistry.register(token, feed)` → aktif.
2. Oracle hitung bobot volume, `WeightRegistry.pushWeights(epoch, tokens, weights)` (boleh penuh/parsial; total seluruh registry harus 10000).
3. Admin bentuk index: `IndexFactory.createIndex(nama, simbol, tokens[], quotes[])` → `indexId`, tiap leg = satu pair.
4. User deposit: `IndexRouter.addLiquidityETH/USD G(indexId, ...)` → baca legs dari factory + bobot dari registry + status aktif → normalisasi → fee → add per leg via adapter → NFT ke user → refund sisa.
5. User keluar: approve NFT ke router → `IndexRouter.removeLiquidity(tokenIds[], ...)` → proceeds + fee terkumpul ke user.

## Aliran data baca (tidak ada tulis)

Frontend/oracle membaca: `getAllAssets` + `getAsset`, `epoch`/`getWeightsFor`, `getLegs`/`getIndex`, `feeBps`/`paused`, posisi NFT (`ownerOf`, `positions`), saldo ERC-20 standar. Contoh lengkap di `scripts/sim/07-read-state.ts`.

## Role akses

| Role | Pemegang awal | Wewenang |
|---|---|---|
| `DEFAULT_ADMIN_ROLE` | admin deploy | Semua setter, pause, `upgradeToAndCall`, grant role |
| `REGISTRAR_ROLE` | admin | `register`, `setActive`, `updateFeed` |
| `UPDATER_ROLE` | admin (operasional: oracle Go) | `pushWeights` |

`_authorizeUpgrade` mensyaratkan `DEFAULT_ADMIN_ROLE`. Rekomendasi produksi: admin = multisig; `UPDATER_ROLE` dipegang alamat oracle khusus.

## Batasan desain yang disengaja

- Router stateless: tidak menahan dana antar-transaksi (saldo selalu 0 pasca-tx; dibuktikan test).
- Satu deposit, satu quote: leg yang quote-nya beda dari token deposit di-skip + refund (tanpa swap silang).
- Bobot global per token; normalisasi per index dihitung on-chain tiap distribute (tidak disimpan).
- Kegagalan satu leg (pool belum ready, slippage) tidak menggagalkan tx: leg di-skip, dana kembali.
