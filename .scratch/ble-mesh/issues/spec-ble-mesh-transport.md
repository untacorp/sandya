# SPEC: Zero-Touch BLE Mesh Transport & Tactical Sync Runtime (ADR-0001)

- **Labels**: `ready-for-agent`, `mesh`, `ble`, `local-first`
- **Related ADR**: [docs/adr/0001-offline-first-ble-mesh-architecture.md](file:///d:/Development/Lomba/sandya/docs/adr/0001-offline-first-ble-mesh-architecture.md)
- **Domain Context**: [CONTEXT.md](file:///d:/Development/Lomba/sandya/CONTEXT.md)

---

## Problem Statement

Di zona bencana alam dengan pemadaman total (*telecommunication & power blackout*), tim relawan kemanusiaan terisolasi tanpa sinyal seluler atau internet. Petugas medis, petugas logistik, dan relawan posko membutuhkan pertukaran data darurat—seperti status triase pasien gawat darurat, permintaan logistik mendesak, siaga bahaya gempa susulan (SOS), dan temu keluarga—secara otomatis antar-perangkat smartphone tanpa menuntut intervensi manual (zero-touch) dan tanpa ketergantungan pada server awan terpusat.

Sebelumnya, pengiriman data hanya disimulasikan di UI atau mengandalkan pemindaian manual kode QR yang menimbulkan kelelahan operasional (*scan fatigue*). Dibutuhkan mesin runtime radio Bluetooth Low Energy (BLE) yang menghubungkan core protokol *Sandya Mesh Protocol (SMP v1)* dengan antarmuka aplikasi secara nyata, terisolasi, aman, dan tahan banting.

---

## Solution

Mengimplementasikan **`BleMeshEngine` & Transport Abstraction Layer** yang mengoperasikan pertukaran paket nirkabel multi-hop SMP v1 melalui radio BLE di latar belakang:
1. **Zero-Touch Neighbor Discovery**: Mendeteksi simpul relawan di sekitar secara otomatis via transmisi beacon/advertising hemat daya, menyajikan daftar peer aktif (`aliasName`, `role`, `rssi`, `hops`, `lastSeen`) secara reaktif di antarmuka Radar dan Intercom Taktis.
2. **Event Sourcing Outbox Gossip**: Menyebarkan perubahan status posko, triase medis, mutasi logistik, dan pendaftaran pengungsi secara desentralisasi menggunakan rekonsiliasi *Vector Clock* antar-posko.
3. **Anti-Broadcast Storm Protection**: Menggunakan cache cincin deduplikasi paket $O(1)$ (`LruSeenCache`) untuk mencegah saturasi spektrum frekuensi radio di area tenda pengungsian yang padat.
4. **Micro-Audio PTT & SOS Broadcast**: Mengalirkan transmisi suara taktis Push-to-Talk (frame biner terkompresi $\le$ 380B) dan sirine peringatan evakuasi instan berprioritas tinggi.
5. **Cross-Platform Resilience**: Menyediakan adapter ganda (Web Bluetooth API / Tauri Native Bluetooth Bridge) dengan penanganan kegagalan yang anggun (*graceful fallback*) jika adapter Bluetooth perangkat dimatikan.

---

## User Stories

1. As a `KOORDINATOR_POSKO`, I want my device to automatically discover nearby field personnel via BLE radio beacons, so that I can monitor active team coverage without asking them to scan QR codes repeatedly.
2. As a `KOORDINATOR_POSKO`, I want my device to broadcast emergency SOS hazard warnings with cryptographic signatures across all nearby nodes, so that neighboring rescue posts can evacuate before aftershocks strike.
3. As a `PETUGAS_MEDIS`, I want patient triage examinations and pharmacy demand tickets to sync in the background to the logistics hub when a runner walks past my clinic, so that life-saving medicine preparation begins immediately.
4. As a `PETUGAS_LOGISTIK`, I want single-writer inventory mutations to be gossiped across posko clusters using vector clocks, so that neighboring distribution centers have visibility into remaining emergency rations.
5. As a `RELAWAN_LAPANGAN`, I want to send a 5-second Push-to-Talk voice note on the `#posko-all` tactical radio channel, so that I can report an impassable bridge hands-free in the rain.
6. As a `RELAWAN_LAPANGAN`, I want incoming tactical voice and text messages to be attributed to the sender's authenticated name and role, so that I never act on forged or unauthorized instructions.
7. As a `PEMIMPIN_ORGANISASI`, I want all transmitted radio packets to be signed with Ed25519 digital keys derived from the mission authority, so that malicious actors outside the humanitarian mission cannot inject fake alerts.
8. As a volunteer with an older phone or disabled Bluetooth, I want the application to clearly inform me of radio status (`SCANNING` or `RADIO_OFF`) and allow seamless fallback to Animated QR or Parity Posters, so that my emergency operations never halt.
9. As a posko operator whose phone receives multiple redundant radio relays of the same message, I want the device to discard duplicates in $O(1)$ memory without freezing the UI, so that phone battery lasts throughout the disaster night.
10. As a field volunteer moving between different posko camps, I want my phone to act as an automatic "data mule", carrying outbox sync deltas from isolated Posko A and gossiping them to Posko B when I walk into radio range.

---

## Implementation Decisions

### 1. Transport Seam & Architecture Layering
- Core Protocol Layer (`SmpPacketCodec`, `LruSeenCache`, `VectorClockTracker`, `PttVoiceCodec`) remains pure TypeScript with zero DOM/Native dependencies.
- Transport Abstraction (`BleTransport` interface):
  - `startScanning(): Promise<void>`
  - `stopScanning(): Promise<void>`
  - `broadcastPacket(packetBuffer: Buffer): Promise<boolean>`
  - `onPacketReceived(callback: (rawBytes: Uint8Array, rssi: number) => void): () => void`
  - `getRadioState(): "UNAVAILABLE" | "OFF" | "SCANNING" | "CONNECTED"`
- Dual Implementation Drivers:
  - `WebBleTransport`: Menggunakan Web Bluetooth API standar peramban dengan graceful degradation.
  - `TauriBleTransport`: Memanfaatkan native channel Tauri IPC untuk eksekusi latar belakang di Android/Linux/Windows.
  - `SimulatedMeshBridge`: Adapter memori terisolasi untuk unit test dan verifikasi deterministik multi-node.

### 2. Payload Framing & Bounded Radio Buffers
- SMP v1 Packet Framing membatasi ukuran muatan maksimal 380 bytes per paket agar total frame (termasuk 28-byte header dan 64-byte Ed25519 signature) muat dalam MTU BLE standar 469 bytes.
- PTT Audio dibagi menjadi potongan-potongan diskrit (`PttAudioPacket`, max 380B, total durasi $\le$ 5000 ms).
- Deduplikasi paket dilakukan secara deterministik via `LruSeenCache.computePacketHash(senderPeerId, sequence, packetType)`.

### 3. Store Integration & Ephemeral Peer State
- State `peers: MeshPeer[]` pada `usePoskoStore` bersifat *ephemeral in-memory* (dikeluarkan dari `partialize` dan di-purge saat rehidrasi) sesuai hasil diagnosa bug sebelumnya.
- Radio background loop di `use-mesh-sync.ts` mendengarkan `BleTransport`, memetakan paket `MESH_ANNOUNCE` dan `TACTICAL_BROADCAST` menjadi entri `peers` aktif dengan jitter RSSI realistis dan perhitungan hop.
- Bila antrean `pendingOutboxCount > 0`, sistem memicu penyiaran `SYNC_VECTOR_PROBE` otomatis setiap 15 detik ke simpul radio di sekitarnya.

---

## Testing Decisions

### 1. Testing Seam
- **Primary Seam**: `BleMeshEngine` Contract Seam (`tests/unit/ble-mesh-engine.test.ts`).
- Pengujian dilakukan pada interface publik engine dengan menyimulasikan 3 simpul (`Node A / Posko 01`, `Node B / Relay Runner`, `Node C / Posko 02`) tanpa bergantung pada adapter Bluetooth hardware fisik.

### 2. Behavioral Test Cases
1. **Multi-Hop Relay & TTL Decrement**: Paket yang dipancarkan Node A dengan TTL 7 sampai ke Node C melalui Node B dengan TTL 6 dan hop count 2.
2. **Duplicate Suppression**: Paket broadcast yang diterima ulang dari simpul berbeda dibuang seketika oleh `LruSeenCache` tanpa memicu re-render atau pemrosesan ulang payload.
3. **Outbox Event Delta Exchange via Vector Clock**: Node B membawa event dari Node A; saat bertemu Node C yang clock-nya tertinggal, delta diekstrak dan diaplikasikan ke store Node C.
4. **PTT Voice Stream Splitting & Reconstitution**: File audio rekaman 4 detik dipecah menjadi beberapa paket radio biner dan dapat direkonstruksi utuh beserta visualisasi waveform 10-bar.
5. **Unauthorized Node Rejection**: Paket dengan tanda tangan kriptografi palsu atau peran yang tidak valid ditolak sebelum masuk ke antrean aplikasi.

### 3. Prior Art in Codebase
- Mengikuti pola uji `tests/unit/ble-mesh-protocol.test.ts` dan `tests/unit/zero-dummy-lifecycle.test.ts`.

---

## Out of Scope

1. Implementasi modul driver firmware radio Bluetooth tingkat kernel/C++ (menggunakan abstraksi OS Web Bluetooth / Tauri Rust plugin yang sudah ada).
2. Streaming video/gambar resolusi tinggi (melebihi batas spektrum bandwidth sempit radio BLE 2.4 GHz di medan darurat; untuk gambar/dokumen besar digunakan mekanisme *Data Mule Flash Drive* atau *Animated QR*).
3. Modifikasi skema basis data SQLite/PostgreSQL yang sudah ada.

---

## Further Notes

- Dokumen ini melengkapi dan mewujudkan prinsip-prinsip arsitektur yang digariskan dalam [ADR 0001: Arsitektur Local-First, Zero-Touch BLE Mesh, & Single-Writer Ledger](file:///d:/Development/Lomba/sandya/docs/adr/0001-offline-first-ble-mesh-architecture.md).
- Menjaga kepatuhan 100% terhadap aturan Zero Dummy Data yang telah diverifikasi pada pengujian sebelumnya.
