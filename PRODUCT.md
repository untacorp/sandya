# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Sandya serves 7 distinct roles structured across a 3-tier operational hierarchy plus an unauthenticated public survivor mode, with balanced priority across all tiers:

- **Tier 1 — Pemimpin Organisasi (Organization Lead)**:
  - *Situation*: Agency headquarters (BPBD, PMI, SAR, disaster relief NGOs) establishing the digital foundation for crisis management.
  - *Job*: Initializes the organization, manages the master Ed25519 authority key and 12-word seed phrase, configures upstream synchronization (Supabase Managed or Self-Hosted VPS BYOC), and commissions new disaster missions.

- **Tier 2 — Komandan Misi (Incident Commander / Mission Lead)**:
  - *Situation*: Incident command center overseeing a regional disaster theater comprising multiple field camps.
  - *Job*: Deploys field posko points, monitors cross-camp situational awareness, oversees central logistics warehouses, and tracks macro disaster metrics.

- **Tier 3 — Koordinator Posko (Field Posko Lead)**:
  - *Situation*: Local emergency post / tent encampment on the frontlines.
  - *Job*: Manages on-site team assignments, generates cryptographic role passes for field workers, and generates physical XOR parity QR posters for offline data dissemination.

- **Tier 3 — Petugas Medis (Doctor / Nurse / Triage Officer)**:
  - *Situation*: Emergency medical tent handling mass casualties under extreme time pressure and sensory overload.
  - *Job*: Rapid patient assessment using the START triage protocol (Red/Immediate, Yellow/Delayed, Green/Minor, Black/Expectant), vital signs recording, and emergency pharmacy prescriptions.

- **Tier 3 — Petugas Logistik (Warehouse Master / Single-Writer)**:
  - *Situation*: Physical posko warehouse handling food, medicine, blankets, and essential relief kits.
  - *Job*: Maintains exclusive *Single-Writer* authority over local inventory ledgers, receives inbound restocks, validates distribution requests, and issues official transit waybills.

- **Tier 3 — Relawan Lapangan (Field Volunteer / Frontliner)**:
  - *Situation*: Active disaster field navigating chaotic refugee arrivals, intake checkpoints, and supply lines.
  - *Job*: Executes Fast Mobile Intake (<30 seconds per survivor), delivers supplies to families, and acts as a mobile data mule transferring sync packets via BLE mesh or QR code scanning.

- **Public Mode — Warga / Tamu (Disaster Survivors & General Public)**:
  - *Situation*: Displaced civilians looking for missing family members at information desks or kiosks.
  - *Job*: Performs unauthenticated, privacy-preserving searches for separated relatives (*Offline Family Reunion*) and scans public posko bulletin posters.

## Product Purpose

Sandya is an offline-first, local-mesh disaster recovery management operating system designed for zero-infrastructure crisis conditions (power grid failures, severed cellular towers, and complete internet blackout). Its purpose is to guarantee uninterrupted humanitarian operations: rapid refugee intake, life-saving medical triage, strictly controlled relief logistics, family reunification, and tactical communication without depending on cloud servers or external infrastructure.

## Positioning

Unlike conventional disaster coordination software that assumes steady cloud connectivity or centralized servers, Sandya operates with true local-first autonomy:
- **Local Edge Persistence**: Every transaction commits immediately to local SQLite on device.
- **Multi-Transport Air-Gap Sync**: Operates across Tier 1 Zero-Touch BLE Mesh (*Sandya Mesh Protocol* / BitChat gossip) and Tier 2 High-Density Visual Fallbacks (Animated 6 FPS Multipart QR and physically tear-resistant XOR Parity Posters with Erasure Coding).
- **Asymmetric Cryptographic Authority**: Uses Ed25519 keypairs and Noise Protocol XX instead of central passwords or LDAP servers.
- **Strict Single-Writer Invariant**: Guarantees zero phantom inventory or double-allocation conflicts by binding write authority over physical goods to a single designated warehouse device.
- **Offline Indonesian Family Search**: Incorporates Indonesian name tokenization, nickname expansion, and phonetic indexing for reliable matching even with fragmented offline records.

## Operating Context

- **Physical Environments**: Emergency triage tents, muddy distribution queues, field warehouses, noise, dust, direct sunlight, rain, and night-shift power outages.
- **Devices**: Field tablets, mobile phones, and rugged laptops operated with gloved, dirty, or unsteady hands.
- **Workflows**: High-volume 30-second mobile intake, rapid 4-color START triage, single-writer inventory decrement at pickup, push-to-talk (PTT) radio chat over 4 operational channels (`#all`, `#medis`, `#logistik`, `#sos`), and visual QR/BLE data muling between isolated camps.

## Capabilities and Constraints

- **Confirmed Functionality**:
  - Full 3-tier hierarchy (Organisasi -> Misi -> Posko) with 7 RBAC roles.
  - Ed25519 cryptographic role pass activation and offline signature verification.
  - Device-first SQLite persistence for all operational records.
  - Upstream Transactional Outbox for idempotent cloud sync (Supabase or VPS PostgreSQL) upon network restoration.
  - START triage kanban board, vitals logging, and emergency prescription tracking.
  - Single-Writer warehouse inventory ledger and inter-posko transit waybills.
  - Offline family search with Indonesian name tokenization and phonetic algorithms.
  - Tactical Intercom: 4 mesh radio channels with 3.2 kbps Opus PTT voice compression and slide-to-confirm SOS siren.
  - Multi-transport sync engine (BLE mesh gossip, multipart animated QR, and XOR parity poster printing/reconstruction).
- **Technical Stack & Constraints**:
  - Next.js 16 (App Router, React 19 RSC), Tailwind CSS v4, Solar Icons, and Tauri v2 cross-platform runtime.
  - Unified responsive web paradigm across desktop and mobile form factors without OS-native styling forks.
  - Zero cloud dependency for core field survival workflows.

## Brand Commitments

- **Name**: Sandya (Sandya Humanitarian Project).
- **Tone of Voice**: Calm, disciplined, authoritative, unambiguous, humane, and crisis-calibrated.
- **Visual Commitments**:
  - Crisp high-contrast surfaces (`#FFFFFF` background, `#F8FAFC` slate canvas, precision 1.5px `#E2E8F0` borders).
  - Solar Icons (stroke/linear SVG only); strictly no frivolous emojis on operational UI buttons.
  - Monospace typography reserved exclusively for hashes, coordinates, cryptographic keys, and identifiers.

## Evidence on Hand

- **Engineering Blueprints & Protocol Specs**:
  - Architecture & race condition mitigation: `docs/analisis-arsitektur.md`
  - BLE Mesh & tactical intercom: `docs/spesifikasi-mesh-dan-intercom.md`
  - Animated QR & XOR parity poster codecs: `docs/spesifikasi-transfer-animated-dan-poster.md`
  - Bit-packing & disaster dictionary: `docs/metode-transfer-dan-kamus-bencana.md`
  - Indonesian name tokenization & phonetic indexing: `docs/tokenisasi-nama-dan-paritas-qr.md`
  - Event sourcing & Universal Data Mule: `docs/event-sourcing-dan-hierarki.md`
  - Organization governance & Ed25519 cryptography: `docs/tata-kelola-organisasi-dan-kriptografi.md`
- **UI/UX & Design Systems**:
  - Frontend architecture blueprint: `docs/design/ui-ux/01-arsitektur-frontend-sandya.md`
  - Solar icons design guide: `docs/design/ui-ux/02-pedoman-solar-icons.md`
  - Design system and semantic color tokens: `docs/design/ui-ux/03-sistem-desain-dan-token-warna.md`
  - Master userflow and role journeys: `docs/userflow/00-arsitektur-dan-peta-userflow.md` and `docs/userflow/roles/`
- **Test Suite**:
  - Complete suite of passing unit tests for core domain, crypto, codecs, and integration tests in `tests/`.

## Product Principles

1. **Continuity Over Connectivity**: Every frontline workflow (intake, triage, inventory, family search) must function with 100% fidelity completely offline.
2. **Zero Phantom Resources**: In crisis logistics, physical supplies must have exactly one authoritative ledger holder (Single-Writer) to prevent duplicate aid distribution.
3. **Speed Under Duress**: Time to register a survivor or triage a patient must be under 30 seconds, with minimal interaction steps and immediate visual/haptic feedback.
4. **Decentralized Cryptographic Trust**: Authority flows from Ed25519 asymmetric signatures and role passes, eliminating the need for central login servers in the field.

## Accessibility & Inclusion

- **High Contrast & Outdoor Sunlight Legibility**: Colors and text meet or exceed WCAG AAA standards for critical status badges, triage markers, and system alerts.
- **Large Field Touch Targets**: Interactive controls maintain a minimum touch target of 48px to accommodate gloved, wet, or unsteady fingers.
- **Humanitarian Indonesian Lexicon**: Standard Indonesian humanitarian and medical terminology used consistently throughout frontline interfaces, avoiding technical or developer jargon.
