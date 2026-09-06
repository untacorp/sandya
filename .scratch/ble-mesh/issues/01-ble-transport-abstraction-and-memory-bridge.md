# 01 — BLE Transport Abstraction & In-Memory Multi-Node Bridge

**What to build:**  
Lapisan abstraksi komunikasi radio Bluetooth Low Energy (`BleTransport`) beserta implementasi jembatan pengujian multi-simpul dalam memori (`SimulatedMeshBridge`). Memungkinkan simpul-simpul relawan Sandya memancarkan dan menerima paket biner bervolume kecil secara asinkron tanpa menuntut perangkat keras Bluetooth fisik saat pengujian unit dan integrasi.

**Blocked by:**  
None — can start immediately.

**Status:** closed (completed via TDD)

## Acceptance Criteria
- [x] Menyediakan antarmuka seragam `BleTransport` (`startScanning`, `stopScanning`, `broadcastPacket`, `onPacketReceived`, `getRadioState`).
- [x] Menyediakan implementasi `SimulatedMeshBridge` yang mampu menghubungkan $N$ simpul virtual dalam satu jaringan terisolasi dengan kontrol latency dan simulasi penurunan sinyal (RSSI).
- [x] Menguji bahwa paket biner yang dipancarkan oleh Simpul A berhasil diterima oleh Simpul B dan Simpul C yang terdaftar pada bridge yang sama.
- [x] Memastikan alokasi buffer biner aman dan kompatibel dengan batas MTU radio BLE (maksimal 469 byte).
