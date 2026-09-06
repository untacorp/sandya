import { createHash } from 'node:crypto';

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
  * Menghasilkan hash identitas unik paket: BLAKE3/SHA256(senderPeerId + sequence + packetType)
  */
  public static computePacketHash(
  senderPeerId: string,
  sequence: number,
  packetType: number
  ): string {
  const key = `${senderPeerId}:${sequence}:${packetType}`;
  return createHash('sha256')
  .update(key)
  .digest('hex')
  .slice(0, SEEN_CACHE_CONSTANTS.PACKET_HASH_HEX_LENGTH);
  }

  /**
   * Memeriksa apakah paket sudah pernah dilihat sebelumnya dan mencatatnya ke cache.
   * Mengembalikan `true` jika paket sudah pernah diterima (duplikat), `false` jika baru.
   */
  public checkAndMarkSeen(packetHash: string): boolean {
    return this.isDuplicate(packetHash);
  }

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
