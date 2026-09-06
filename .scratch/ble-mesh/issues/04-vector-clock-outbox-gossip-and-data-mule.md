# 04 — Vector Clock Outbox Gossip & Data Mule Synchronization

**What to build:**  
Protokol sinkronisasi desentralisasi nir-internet (Universal Data Mule): saat dua simpul relawan berpapasan dalam jangkauan radio BLE, mereka saling bertukar ringkasan *Vector Clock* (`SYNC_VECTOR_PROBE`). Jika terdeteksi selisih sequence log event sourcing lokal (data pengungsi baru, hasil triase dokter, atau mutasi stok beras), simpul yang tertinggal akan meminta batch delta (`SYNC_DELTA_BATCH`) untuk diinjeksikan secara deterministik ke basis data offline lokal tanpa tumpang tindih.

**Blocked by:**  
02 — BLE Mesh Engine & Neighbor Discovery

**Status:** closed

## Acceptance Criteria
- [x] Mesin secara otomatis menyiarkan `SYNC_VECTOR_PROBE` berisi snapshot logical sequence setiap posko saat terhubung dengan peer baru atau ada item di antrean outbox.
- [x] Memanfaatkan `VectorClockTracker.computeDeltaRequirements` untuk menghitung rentang event (`fromSeq` ke `toSeq`) yang dibutuhkan dari simpul lawan.
- [x] Membungkus delta event sourcing ke dalam paket biner `SYNC_DELTA_BATCH` terkompresi.
- [x] Simpul penerima memvalidasi urutan urut waktu kausal (*causal chaining*) dan menginjeksi event ke store/repositori lokal secara idempoten.
- [x] Menangani skenario "Data Mule": Relawan membawa data dari Posko 01, berjalan ke Posko 02 yang terisolasi, dan data otomatis tersinkronisasi saat masuk jangkauan radio tanpa koneksi internet.
