# Security Policy

Sandya is an open-source, local-first, and offline-mesh disaster emergency management platform designed for frontline humanitarian relief operations. Because Sandya handles sensitive refugee demographic data, emergency medical triage records (START Triage), and disaster supply chain inventory ledgers in disconnected, degraded, or adversarial field environments, security, data integrity, and privacy are foundational pillars of our ecosystem.

We take all security vulnerability reports seriously and welcome collaboration with independent security researchers, humanitarian organizations, and the open-source community to ensure our platform remains robust, resilient, and safe for vulnerable populations.

---

## 🇮🇩 Ringkasan Eksekutif (Bahasa Indonesia)

Sandya berkomitmen melindungi integritas data korban bencana, kerahasiaan rekam medis darurat (*START Triage*), serta keandalan rantai pasok logistik di lapangan tanpa ketergantungan internet. Jika Anda menemukan celah keamanan (*security vulnerability*):

1. **Laporkan secara privat**: Gunakan fitur [GitHub Private Vulnerability Reporting](https://github.com/untacorp/sandya/security/advisories/new) atau hubungi tim pengembang via email (`security@sandya.id` / `kasumadana@gmail.com`).
2. **Mohon jangan membuka issue publik** untuk celah yang belum ditambal demi melindungi posko dan data pengungsi di lapangan.
3. Kebijakan ini menerapkan klausul **Safe Harbor** penuh bagi peneliti keamanan yang bertindak dengan itikad baik (*good faith research*).
4. Tim inti Sandya berkomitmen memberikan tanggapan awal dalam waktu **24–48 jam** dan merilis perbaikan secepat mungkin sesuai tingkat keparahan celah.

---

## Supported Versions

We provide active security updates, vulnerability patches, and backports according to the support matrix below:

| Version | Supported | Status / Lifecycle | Notes |
| :--- | :---: | :--- | :--- |
| `0.1.x` | :white_check_mark: | **Active Development** | Main production & alpha line; actively receives all security fixes |
| `main` branch | :white_check_mark: | **Bleeding Edge** | Upstream edge codebase; continuously patched and tested |
| `< 0.1.0` | :x: | **End of Life (EOL)** | Prototype & experiment revisions; upgrade recommended |

> [!NOTE]
> For active field deployments operating offline or with custom Bring-Your-Own-Cloud (BYOC) infrastructure, critical security patches are backported and distributed via standalone offline patch scripts (`scripts/apply-security-patch.js`) and tagged release archives.

---

## Reporting a Vulnerability

We request that you report vulnerabilities **privately and confidentially** before making any public disclosure. Please do **NOT** file public GitHub issues, discussions, or pull requests disclosing unpatched vulnerabilities.

### Primary Channel: GitHub Private Vulnerability Reporting (Recommended)

GitHub provides end-to-end encrypted, dedicated private reporting for this repository:

👉 **[Submit a Private Security Advisory Report on GitHub](https://github.com/untacorp/sandya/security/advisories/new)**

*Benefits of using GitHub Advisories:*
- Encrypted and visible only to the core maintainers.
- Enables collaborative discussion, private branch forks for testing patches, and credit attribution upon disclosure.
- Facilitates official CVE assignment through GitHub as a CNA (CVE Numbering Authority).

### Alternative & Direct Channels

If you cannot access GitHub Private Advisories or prefer direct encrypted communication, you can contact our security maintainers directly:

- **Security Lead**: kasumadana — `kasumadana@gmail.com` / GitHub: [@kasumadana](https://github.com/kasumadana)
- **Project Lead**: auttomus — `auttomus@gmail.com` / GitHub: [@auttomus](https://github.com/auttomus)
- **Project Team**: `team@sandya.id` / `security@sandya.id`

If sending sensitive cryptographic material, exploit payloads, or proof-of-concept code, you may request our GPG public key or share an encrypted archive with a separate password channel.

---

## What to Include in Your Report

To help us triage, reproduce, and resolve the issue quickly, please include as much of the following information as possible:

1. **Summary & Vulnerability Classification**: A clear explanation of the flaw (e.g., RBAC privilege escalation, cryptographic forgery, BLE mesh frame injection, RLS bypass, SQL injection, Tauri IPC command escape).
2. **Affected Components & Environment**:
   - Affected subsystem: Core domain, BLE mesh engine, QR/Parity codec, SQLite/Supabase sync, Tauri v2 desktop/mobile app, or Next.js web client.
   - Operating environment (e.g., Linux, Android, Windows, macOS, Web browser).
   - Component version or commit hash where the vulnerability was observed.
3. **Step-by-Step Proof of Concept (PoC)**:
   - Detailed, minimal steps or script/payload to reproduce the vulnerability.
   - Sample inputs, payloads, or network/BLE captures if relevant.
4. **Impact Assessment**:
   - What an attacker could achieve (e.g., unauthorized refugee demographic extraction, falsification of triage severity, illegitimate inventory deduction, denial of mesh connectivity).
5. **Suggested Mitigation / Patch (Optional)**:
   - Any suggested code edits, configuration changes, or architectural adjustments.

---

## Response Timelines & SLAs (Service Level Agreements)

We are committed to a rapid, communicative, and flexible response process:

| Stage | Target Timeline | Details |
| :--- | :--- | :--- |
| **Initial Acknowledgment** | **Within 24–48 hours** | Confirmation that report was received and assigned to a maintainer |
| **Triage & Verification** | **Within 72 hours** | Reproducibility verification and severity assignment (CVSS v3.1/v4.0) |
| **Patch & Remediation** | **7–14 days** *(Critical/High)*<br/>**14–30 days** *(Medium/Low)* | Development, internal testing, and integration of a secure fix |
| **Coordinated Disclosure** | **30–90 days** (or upon patch release) | Mutually agreed timeline before public disclosure |

> [!TIP]
> **Flexible Humanitarian Triage**: If an active disaster operation or field mission is utilizing Sandya during the reporting window, maintainers will coordinate an expedited emergency patch window and notify affected field operators before any public write-up.

---

## Threat Model & Scope

Sandya combines local-first decentralized databases, asymmetric cryptography, Bluetooth mesh networking, and hybrid cloud replication. The following matrix outlines what is in-scope versus out-of-scope:

### In-Scope Vulnerabilities

We specifically encourage research into the following high-impact areas:

1. **Cryptographic Foundations & Key Management**:
   - Flaws in isomorphic **Ed25519** signature generation, verification, or key derivation (`seed-phrase.ts`, `ed25519-isomorphic.ts`).
   - Forgery, tampering, or replay of **Role Pass QR tokens** (`RolePassCodec`).
   - Weaknesses in the 12-word disaster emergency seed phrase entropy or wordlist encoding.
   - Master Authority Key impersonation across organizational tiers (Lembaga, Misi, Posko).

2. **Role-Based Access Control (RBAC) & Separation of Duties**:
   - Bypassing the **Guest Walled Garden** (`WARGA_TAMU` accessing tactical intercom, broadcast siren, or medical records).
   - Violating the **Single-Writer Logistics Principle** (allowing non-`PETUGAS_LOGISTIK` roles to directly mutate warehouse inventory).
   - Unauthorized alteration of **START Medical Triage** categories (Red/Yellow/Green/Black) or drug prescription records.
   - Privilege escalation from field volunteer (`RELAWAN_LAPANGAN`) to posko coordinator (`KOORDINATOR_POSKO`).

3. **Offline Transport & Mesh Synchronization**:
   - **BLE Mesh Gossip**: Malicious frame injection, routing loops, memory exhaustion (packet storms / DoS), or vector clock tampering.
   - **Visual QR & Parity Posters**: Injected payloads into animated QR streams or XOR parity reconstruction bypasses that lead to corrupted or malicious state ingestion.
   - Split-brain or ledger divergence attacks causing irreversible data loss in field databases.

4. **Data Privacy & Storage Integrity**:
   - Leakage of personally identifiable information (PII) of refugees, minors, vulnerable groups, or deceased records.
   - Row-Level Security (RLS) policy bypasses in Supabase PostgreSQL edge/cloud sync.
   - SQL injection or path traversal in local SQLite / Tauri storage adapters.

5. **Client Runtime & Desktop/Mobile IPC Security**:
   - **Tauri v2 IPC**: Unauthorized invocation of native plugins (barcode scanner, notification service, file system).
   - Cross-Site Scripting (XSS) or Remote Code Execution (RCE) via malicious data payloads parsed during offline sync or QR scanning.

---

### Out-of-Scope Vulnerabilities

To prevent false alarms and ensure efficient coordination, the following findings are generally considered out-of-scope:

- **Physical Device Theft / Unlocked Hardware**: Physical attacks requiring unrestricted root/jailbreak access to an unencrypted device left unattended without screen locks, unless demonstrating a specific software-level flaw in Sandya's encrypted storage.
- **Volumetric Denial of Service (DoS/DDoS)**: Flood attacks against staging/demo web domains (`sandya.skensa.web.id`) or network infrastructure.
- **Social Engineering & Phishing**: Attacks targeting project contributors, volunteers, or field workers through deceptive means.
- **Theoretical Vulnerabilities**: Automated scanner outputs, missing HTTP security headers (unless demonstrating a clear exploit vector), or missing rate limits on demo environments without practical impact.
- **Known Third-Party Dependency Vulnerabilities**: Automated alerts from Dependabot/Snyk for dependencies that are not reachable or exploitable in Sandya's execution paths (though PRs updating them are welcome!).

---

## Safe Harbor Policy (Good Faith Security Research)

We believe that independent security researchers are crucial allies in keeping humanitarian technology safe. Under this policy, we provide a **Safe Harbor guarantee**:

If you conduct vulnerability research in good faith and adhere to the guidelines outlined in this document:

1. **No Legal Action**: We will not pursue legal action, nor will we initiate law enforcement complaints against you for accidental or authorized testing conducted in compliance with this policy.
2. **Support & Protection**: If a third party initiates legal action against you in connection with activities conducted under this policy, we will make it known that your actions were authorized by us.
3. **Collaboration**: We will work with you transparently to understand, validate, and patch the reported issue.
4. **Public Recognition**: With your permission, we will publicly credit you in our GitHub Release Notes, commit history, and `CONTRIBUTORS.md` Wall of Fame.

### Rules of Engagement:
- Stop testing and report immediately once you confirm a vulnerability exists or sensitive data is accessible.
- Never view, modify, extract, or delete data belonging to actual disaster victims, field poskos, or live operations. Use synthetic/dummy test data.
- Do not degrade the performance of live humanitarian field deployments or public relief portals.
- Provide us a reasonable time frame to remediate the vulnerability before disclosing details publicly.

---

## Field Deployments & Emergency Incident Handling (Panduan Lapangan)

For organizations actively deploying Sandya in disaster zones (BPBD, PMI, NGOs, Relawan):

1. **Offline Patch Application**:
   If an emergency security advisory is released while field teams are disconnected:
   - Download the verified patch bundle or update script (`scripts/apply-security-patch.js`).
   - Run the automated database patch script:
     ```bash
     pnpm db:patch
     # or via psql:
     psql "$DATABASE_URL" -f src/infrastructure/db/supabase-security-hardening-patch.sql
     ```
2. **Compromised Device / Key Revocation**:
   - If a field smartphone or coordinator Role Pass QR is lost, stolen, or compromised in the field:
     1. The Mission Commander or Organization Lead must immediately issue a new Master Authority Key or generate refreshed Role Pass QR codes for the posko.
     2. Invalidate old Role Pass signatures at the posko gateway.
     3. Distribute updated passes via Animated QR or printed QR handover.

---

## Recognition & Humanitarian Wall of Fame

We believe in recognizing those who help protect humanitarian software. Contributors who discover and responsibly report qualifying vulnerabilities will be acknowledged in:
- GitHub Security Advisories & Release Changelogs
- [CONTRIBUTORS.md](../CONTRIBUTORS.md)
- Official Sandya Security Hall of Fame

---

<div align="center">

**Sandya Humanitarian Project — untacorp/sandya**  
*Empowering Resilient, Secure, and Private Disaster Response.*

</div>
