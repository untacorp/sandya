# 03 — Tactical Intercom Chat & PTT Audio Relay

**What to build:**  
Layanan pertukaran pesan taktis lapangan melalui radio BLE multi-hop: pengiriman pesan teks terisolasi 4 saluran (`#posko-all`, `#medis`, `#logistik`, `#sos`), pengiriman sirine peringatan evakuasi darurat (SOS) berprioritas tinggi, dan transmisi suara Push-to-Talk (PTT) 5 detik yang dipecah menjadi frame BLE SMP v1 ($\le$ 380B) dan direkonstruksi di simpul penerima lengkap dengan visualisasi waveform 10-bar.

**Blocked by:**  
02 — BLE Mesh Engine & Neighbor Discovery

**Status:** closed (completed via TDD)

## Acceptance Criteria
- [x] Mengirimkan pesan teks taktis terenkapsulasi paket `TACTICAL_BROADCAST` bertanda tangan digital Ed25519.
- [x] Mengirimkan peringatan evakuasi instan (`contentType: "ALERT"`) pada saluran `#sos` yang direlay otomatis oleh simpul perantara (TTL decrement, hop count increment).
- [x] Memanfaatkan `PttVoiceCodec` untuk memecah rekaman suara micro-audio $\le$ 5000 ms menjadi beberapa frame `VOICE_NOTE_FRAME` biner.
- [x] Simpul penerima mengumpulkan frame-frame audio parsial, menyusun kembali secara berurutan, dan memicu event notifikasi audio masuk beserta waveform preview.
- [x] Memastikan isolasi peran: pengguna berstatus `PUBLIC_GUEST` / `WARGA_TAMU` tidak dapat memancarkan siaran suara atau instruksi pada saluran petugas.
