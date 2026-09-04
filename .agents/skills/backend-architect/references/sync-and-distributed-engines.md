# Distributed Ingestion, Sync & Local-First Engines

This guide details synchronization protocols, Event-Sourcing reconciliation, conflict resolution, and multi-transport ingestion pipelines (HTTP, P2P Mesh, Animated QR, and Optical/Acoustic data carriers).

---

## 🔄 1. Local-First Event Sourcing & Ingestion Pipeline

In resilient, field-deployed, or disaster-response systems, client nodes operate completely disconnected from the internet, generating state changes into a local SQLite outbox. When connectivity is available (via internet, mesh bridge, or physical QR scan), mutation events are shipped and ingested centrally.

```
┌───────────────────────────┐                ┌───────────────────────────┐
│ FIELD NODE (SQLite)       │                │ CENTRAL HUB (PostgreSQL)  │
│ 1. Record User Action     │                │ 1. Ingest Mutation Stream │
│ 2. Append to Local Outbox │  Multi-Channel │ 2. Verify Cryptographic Sig│
│ 3. Sign with Node Ed25519 ├───────────────►│ 3. Check Idempotency / VClock│
│ 4. Encode to Transport    │ (HTTP/Mesh/QR) │ 4. Replay into Central DB │
└───────────────────────────┘                └───────────────────────────┘
```

---

## ⚔️ 2. Conflict Resolution Strategies

When multiple nodes update the same entity while partitioned:

### Strategy 1: Deterministic Last-Write-Wins (LWW) with Lamport Timestamp
- Every mutation carries a monotonically increasing `(lamport_clock, node_id, physical_timestamp)`.
- Central resolves conflicts by ordering: `if (incoming.lamport > current.lamport) apply()`.
- Ties are broken deterministically using the lexicographical order of `node_id`.

### Strategy 2: Conflict-Free Replicated Data Types (CRDTs)
- **PN-Counter (Positive-Negative Counter)**: For inventory stock tracking across multiple disconnected warehouses. Each node maintains its own positive additions and negative decrements. Total balance is computed as $\sum P_i - \sum N_i$.
- **Observed-Remove Set (OR-Set)**: For tracking list memberships (e.g. active volunteers in a camp) without delete/add race condition conflicts.

### Strategy 3: 3-Way Merge with Human Intervention
- If two operators update non-overlapping fields (e.g., Operator A updates *phone number*, Operator B updates *medical notes*), automatically auto-merge both changes.
- If both operators update the same field with conflicting values, flag record as `CONFLICT_PENDING_REVIEW` and present side-by-side diff in commander dashboard.

---

## 📦 3. Transport-Agnostic Packet Structure & Chunking

For data transfer across low-bandwidth, intermittent, or physical air-gapped channels (Animated QR, Bluetooth Low Energy, LoRa, Wi-Fi Direct Mesh):

### Standard Binary/JSON Packet Frame
```
┌───────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Magic Byte    │ Packet Header│ Payload Data │ Ed25519 Sig  │ CRC32 / Parity│
│ (0x53 0x4E)   │ (16 bytes)   │ (Variable)   │ (64 bytes)   │ (4 bytes)    │
└───────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### Packet Header Specification
- `protocol_version`: `uint8` (e.g. `0x01`).
- `chunk_index`: `uint16` (Current fragment index, 0-indexed).
- `total_chunks`: `uint16` (Total fragments in packet).
- `packet_id`: `uint32` / `UUID` (Unique ID for this transmission batch).
- `origin_node_id`: `bytes16` (Node UUID generating the batch).

### Chunk Reassembly & Parity Engine (TypeScript)
```typescript
export interface IngestionChunk {
  packetId: string;
  chunkIndex: number;
  totalChunks: number;
  data: Uint8Array;
  signature: Uint8Array;
}

export class PacketReassemblyEngine {
  private buffer = new Map<string, Map<number, IngestionChunk>>();

  pushChunk(chunk: IngestionChunk): Uint8Array | null {
    if (!this.buffer.has(chunk.packetId)) {
      this.buffer.set(chunk.packetId, new Map());
    }

    const chunks = this.buffer.get(chunk.packetId)!;
    chunks.set(chunk.chunkIndex, chunk);

    // Check if all chunks received
    if (chunks.size === chunk.totalChunks) {
      const fullPayload = this.reassemble(chunk.packetId, chunk.totalChunks);
      this.buffer.delete(chunk.packetId);
      return fullPayload;
    }

    return null; // Awaiting remaining chunks
  }

  private reassemble(packetId: string, total: number): Uint8Array {
    const chunks = this.buffer.get(packetId)!;
    const parts: Uint8Array[] = [];
    let totalLength = 0;

    for (let i = 0; i < total; i++) {
      const part = chunks.get(i)!.data;
      parts.push(part);
      totalLength += part.length;
    }

    const merged = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of parts) {
      merged.set(part, offset);
      offset += part.length;
    }
    return merged;
  }
}
```
