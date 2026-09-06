export const SEEN_CACHE_CONSTANTS = {
  DEFAULT_MAX_ENTRIES: 1024,
  PACKET_HASH_HEX_LENGTH: 16,
} as const;

export class LruSeenCache {
  private seenHashes = new Set<string>();
  private ringBuffer: string[] = [];
  private pointer: number = 0;

  constructor(private readonly maxEntries: number = SEEN_CACHE_CONSTANTS.DEFAULT_MAX_ENTRIES) {
    this.ringBuffer = new Array(maxEntries).fill('');
  }

  /**
   * Menghasilkan hash identitas unik paket: FNV-1a 64-bit (senderPeerId + sequence + packetType)
   * 100% Isomorfik tanpa dependensi node:crypto (aman untuk Browser, WebView, dan Node.js).
   */
  public static computePacketHash(
    senderPeerId: string,
    sequence: number,
    packetType: number
  ): string {
    const key = `${senderPeerId}:${sequence}:${packetType}`;
    let hash = 0xcbf29ce484222325n;
    const prime = 0x100000001b3n;
    for (let i = 0; i < key.length; i++) {
      hash ^= BigInt(key.charCodeAt(i));
      hash = (hash * prime) & 0xffffffffffffffffn;
    }
    return hash.toString(16).padStart(SEEN_CACHE_CONSTANTS.PACKET_HASH_HEX_LENGTH, '0');
  }

  /**
  * Memeriksa apakah paket sudah pernah dilihat sebelumnya.
  * Mengembalikan `true` jika paket sudah pernah diterima (duplikat), `false` jika baru.
  */
  public isDuplicate(packetHash: string): boolean {
  if (this.seenHashes.has(packetHash)) {
  return true;
  }

  // Jika slot ring buffer sebelumnya berisi hash lama, buang dari Set
  const oldHash = this.ringBuffer[this.pointer];
  if (oldHash) {
  this.seenHashes.delete(oldHash);
  }

  // Simpan hash baru
  this.ringBuffer[this.pointer] = packetHash;
  this.seenHashes.add(packetHash);

  // Majukan pointer sirkular
  this.pointer = (this.pointer + 1) % this.maxEntries;
  return false;
  }

  public size(): number {
  return this.seenHashes.size;
  }

  public clear(): void {
  this.seenHashes.clear();
  this.ringBuffer.fill('');
  this.pointer = 0;
  }
}
