import { IOutboxRepository, OutboxItem } from '@/core/domain/sync/outbox.repository.interface';
import { packManifestV4, DisasterManifestV4 } from '@/core/codecs/bitpacker-v4';
import { Ed25519Signer } from '@/core/crypto/ed25519-signer';
import { PoskoId } from '@/core/shared/branded-types';

export interface SyncPacketPayload {
  originPosId: string;
  senderPeerId: string;
  sequenceNumber: number;
  payloadBase64: string;
  signatureHex: string;
  timestamp: number;
}

export class AntiEntropySyncWorker {
  constructor(
    private readonly outboxRepo: IOutboxRepository,
    private readonly localPoskoId: PoskoId,
    private readonly privateKeyHex: string,
    private readonly senderPeerId: string
  ) {}

  /**
   * Mengumpulkan batch outbox yang pending dan membentuk paket sinkronisasi terkompresi & bertanda tangan
   */
  public async generateSyncPacket(batchLimit: number = 50): Promise<SyncPacketPayload | null> {
    const pendingResult = await this.outboxRepo.getPendingBatch(batchLimit);
    if (!pendingResult.ok || pendingResult.value.length === 0) {
      return null;
    }

    const items = pendingResult.value;
    const refugees = items
      .filter((it) => it.topic === 'REFUGEE_INTAKE')
      .map((it) => {
        try {
          return JSON.parse(it.payload);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const manifest: DisasterManifestV4 = {
      poskoName: `Posko_${this.localPoskoId.slice(0, 8)}`,
      defaultRegionCode: '320101',
      timestamp: Date.now(),
      persons: refugees.map((r) => ({
        fullName: r.fullName,
        nationalId: r.nationalId || undefined,
        gender: r.gender,
        age: r.age,
        vulnerabilities: 0,
        urgentNeeds: [],
        domicileOrigin: r.domicileOrigin || undefined,
        shelterLocation: r.shelterLocation || undefined,
        missingKinName: r.missingKinName || undefined,
      })),
    };

    // 1. Pack ke Ultra-Dense Bitpacking v4
    const packedBuffer = packManifestV4(manifest);

    // 2. Sign dengan Ed25519 Private Key
    const signatureHex = Ed25519Signer.signPayload(packedBuffer, this.privateKeyHex);

    // 3. Mark in-flight
    for (const it of items) {
      await this.outboxRepo.markStatus(it.id, 'IN_FLIGHT');
    }

    return {
      originPosId: this.localPoskoId,
      senderPeerId: this.senderPeerId,
      sequenceNumber: Date.now(),
      payloadBase64: packedBuffer.toString('base64'),
      signatureHex,
      timestamp: manifest.timestamp,
    };
  }

  /**
   * Konfirmasi bahwa paket telah sukses disinkronkan ke peer/cloud
   */
  public async acknowledgeItems(items: OutboxItem[]): Promise<void> {
    for (const it of items) {
      await this.outboxRepo.markStatus(it.id, 'ACKNOWLEDGED');
    }
  }
}
