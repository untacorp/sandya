# 02 — BLE Mesh Engine & Neighbor Discovery

**What to build:**  
Mesin orkestrasi radio simpul posko (`BleMeshEngine`) yang secara otomatis menyiarkan identitas simpul (`MESH_ANNOUNCE`), mendengarkan sinyal radio relawan lain di sekitarnya, menghitung kekuatan sinyal RSSI serta jarak hop, memverifikasi tanda tangan kriptografi Ed25519, dan menyaring paket duplikat melalui `LruSeenCache` untuk menghindari *broadcast storm*.

**Blocked by:**  
01 — BLE Transport Abstraction & In-Memory Multi-Node Bridge

**Status:** closed (completed via TDD)

## Acceptance Criteria
- [x] Menyediakan kelas `BleMeshEngine` yang menerima konfigurasi identitas simpul (`peerId`, `aliasName`, `role`, `poskoId`, pasangan kunci Ed25519).
- [x] Menyiarkan paket beacon `MESH_ANNOUNCE` secara berkala (interval heartbeat hemat energi).
- [x] Menerima dan memvalidasi paket `MESH_ANNOUNCE` dari tetangga, memperbarui daftar peer aktif lengkap dengan timestamp `lastSeen` dan estimasi hop count.
- [x] Menerapkan deduplikasi $O(1)$ menggunakan `LruSeenCache.computePacketHash`: paket yang sudah pernah dilihat diabaikan tanpa memicu beban pemrosesan ulang.
- [x] Menolak paket biner yang tidak valid, rusak, atau memiliki tanda tangan Ed25519 palsu.
