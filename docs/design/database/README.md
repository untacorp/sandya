# Desain Basis Data & Skema Persistensi (`docs/design/database`)

> **Status**: Approved (Spesifikasi Model Data & Skema Database)  
> **Klasifikasi**: Skema Relasional SQLite & Arsitektur Event Sourcing  
> **Dokumen Terkait**: [Event Sourcing & Hierarki](../../event-sourcing-dan-hierarki.md) | [Indeks Desain](../README.md)

Folder ini mendokumentasikan spesifikasi skema data relasional lokal, diagram relasi entitas (*Entity-Relationship Diagram*), model *Event Sourcing*, dan strategi pengindeksan basis data SQLite pada aplikasi **Sandya**.

---

## 1. Diagram Relasi Entitas (Mermaid ERD)

```mermaid
erDiagram
  ORGANIZATIONS ||--o{ POSTS : "memiliki"
  POSTS ||--o{ REFUGEES : "menampung"
  REFUGEES ||--o{ REFUGEE_EVENTS : "memiliki riwayat"
  POSTS ||--o{ INVENTORY_ITEMS : "menyimpan stok"
  INVENTORY_ITEMS ||--o{ INVENTORY_TRANSACTIONS : "riwayat mutasi"
  POSTS ||--o{ INVENTORY_TRANSACTIONS : "tempat transaksi"
  REFUGEES ||--o{ NEEDS_REQUESTS : "meminta bantuan"
  POSTS ||--o{ NEEDS_REQUESTS : "posko pemenuhan"
  MESH_PEERS ||--o{ TACTICAL_MESSAGES : "mengirim pesan"
  POSTS ||--o{ MESH_SYNC_CLOCKS : "status sinkronisasi"

  ORGANIZATIONS {
    string id PK "UUIDv7"
    string name "Nama Lembaga"
    int created_at "Unix Timestamp"
  }

  POSTS {
    string id PK "UUIDv7"
    string org_id FK "Relasi ke Organizations"
    string name "Nama Posko / Tenda"
    string post_type "MAIN_WAREHOUSE | FIELD_SHELTER | MEDICAL_POST"
    float location_lat "Koordinat Lintang"
    float location_lng "Koordinat Bujur"
    int created_at "Unix Timestamp"
  }

  REFUGEES {
    string id PK "UUIDv7"
    string post_id FK "Relasi ke Posts"
    string full_name "Nama Lengkap Warga"
    string nik "NIK KTP (Nullable)"
    string gender "M | F"
    int age "Usia (0..127)"
    string domicile_origin "Dusun / Desa Asal"
    string shelter_location "Lokasi Tenda / Ruangan"
    string missing_kin_name "Nama Kerabat yang Dicari"
    string registered_by_user_id "ID Relawan Pendata"
    int created_at "Unix Timestamp"
  }

  REFUGEE_EVENTS {
    string id PK "UUIDv7"
    string refugee_id FK "Relasi ke Refugees"
    string author_id "ID Penulis Event"
    string author_name "Nama Penulis"
    string author_role "ENUMERATOR | DOCTOR | LOGISTICS"
    string event_type "HEALTH_CHECK | NEED_REPORTED | AID_RECEIVED | NOTE"
    string event_payload "JSON Data Rinci"
    int device_timestamp "Waktu Jam Perangkat"
    int logical_seq "Nomor Urut Monotonik"
    string causal_parent_id "ID Event Pendahulu"
  }

  INVENTORY_ITEMS {
    string id PK "UUIDv7"
    string post_id FK "Relasi ke Posts"
    string item_name "Nama Barang Sembako / Medis"
    string category "FOOD | CLOTHING | MEDICAL | HYGIENE"
    int current_quantity "Jumlah Stok Fisik Tersisa"
    string unit "KG | KOTAK | PCS"
    int last_updated_at "Unix Timestamp"
  }

  INVENTORY_TRANSACTIONS {
    string id PK "UUIDv7"
    string item_id FK "Relasi ke Inventory Items"
    string post_id FK "Relasi ke Posts"
    string officer_id "ID Petugas Logistik"
    string tx_type "RESTOCK | DISTRIBUTION | DAMAGE | TRANSFER"
    int quantity_change "Perubahan Jumlah (+/-)"
    string reference_ticket_id "Ref ke Needs Requests"
    int device_timestamp "Unix Timestamp"
  }

  NEEDS_REQUESTS {
    string id PK "UUIDv7"
    string refugee_id FK "Relasi ke Refugees"
    string post_id FK "Relasi ke Posts"
    string item_name "Nama Kebutuhan"
    int quantity "Jumlah Diminta"
    string status "PENDING | ALLOCATED | COMPLETED | REJECTED"
    string created_by_user_id "ID Relawan Pendata"
    string allocated_by_user_id "ID Petugas Logistik"
    string distributed_by_user_id "ID Petugas Distribusi"
    int created_at "Unix Timestamp"
    int completed_at "Unix Timestamp"
  }

  MESH_PEERS {
    string peer_id PK "8-Byte Hex Noise Key Prefix"
    string noise_pubkey "Curve25519 Public Key"
    string signing_pubkey "Ed25519 Public Key"
    string alias_name "Nama Panggilan Personel"
    string role "KOORDINATOR | MEDIS | LOGISTIK | RELAWAN"
    string current_pos_id "Posko Penugasan"
    int rssi "Kekuatan Sinyal dBm"
    int hops "Jarak Hop (1..7)"
    int last_seen "Unix Timestamp"
  }

  TACTICAL_MESSAGES {
    string id PK "UUIDv7"
    string channel "POSKO_ALL | MEDIS | LOGISTIK | SOS | DM"
    string sender_peer_id FK "Relasi ke Mesh Peers"
    string sender_name "Nama Pengirim"
    string sender_role "Peran Pengirim"
    string recipient_peer_id "ID Target jika DM"
    string content_type "TEXT | VOICE_NOTE | ALERT"
    string text_content "Teks Pesan"
    blob audio_blob "Opus Voice Blob (~2KB)"
    int audio_duration_ms "Durasi Audio (Maks 5000ms)"
    int is_urgent "Flag Darurat SOS (0 | 1)"
    int created_at "Unix Timestamp"
  }

  MESH_SYNC_CLOCKS {
    string pos_id PK "ID Posko Asal"
    int max_synced_seq "Nomor Sequence Tertinggi"
    int last_synced_at "Unix Timestamp Sinkronisasi"
  }
```

---

## 2. Strategi Pengindeksan Database (Indexing Strategy)

Untuk memastikan performa kueri tetap instan pada smartphone dengan spesifikasi rendah saat mengelola ribuan data pengungsi:

```sql
-- Indeks Pencarian Cepat Pengungsi & Temu Keluarga
CREATE INDEX idx_refugees_post_id ON refugees(post_id);
CREATE INDEX idx_refugees_full_name ON refugees(full_name COLLATE NOCASE);
CREATE INDEX idx_refugees_domicile ON refugees(domicile_origin COLLATE NOCASE);
CREATE INDEX idx_refugees_missing_kin ON refugees(missing_kin_name COLLATE NOCASE) WHERE missing_kin_name IS NOT NULL;

-- Indeks Event Sourcing & Rekonsiliasi Vector Clock
CREATE INDEX idx_refugee_events_refugee_id ON refugee_events(refugee_id);
CREATE INDEX idx_refugee_events_sync ON refugee_events(logical_seq, device_timestamp);

-- Indeks Logistik & Distribusi
CREATE INDEX idx_inventory_post_cat ON inventory_items(post_id, category);
CREATE INDEX idx_needs_status ON needs_requests(post_id, status);

-- Indeks Komunikasi Radio & Radar Mesh
CREATE INDEX idx_tactical_channel ON tactical_messages(channel, created_at DESC);
CREATE INDEX idx_mesh_peers_last_seen ON mesh_peers(last_seen DESC);
```

---

## 3. Dokumen Spesifikasi Terkait
Detail arsitektur event sourcing, mitigasi pergeseran jam (*clock drift*), dan alur transaksi *Single-Writer* dijelaskan secara lengkap di:
[Arsitektur Event Sourcing, Hierarki Organisasi, & Universal Data Mule](../../event-sourcing-dan-hierarki.md).
