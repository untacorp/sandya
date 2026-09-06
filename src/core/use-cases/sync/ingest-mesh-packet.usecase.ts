import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { SmpPacket, SmpPacketCodec, SmpPacketType, SmpBeaconPacket } from '@/core/mesh/smp-packet';
import { LruSeenCache } from '@/core/mesh/seen-cache';
import { VectorClockTracker, DeltaSyncRequest } from '@/core/mesh/vector-clock';
import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import { RefugeeAggregate } from '@/core/domain/refugees/refugee.aggregate';
import { unpackManifestV4 } from '@/core/codecs/bitpacker-v4';
import { asRefugeeId, asPoskoId } from '@/core/shared/branded-types';
import { HTTP_STATUS } from '@/core/shared/constants';
import { PttVoiceCodec, PttVoiceFrame } from '@/core/audio/ptt-codec';
import { MeshPeer, TacticalMessage } from '@/shared/types';

function computeDeterministicHash(key: string): string {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < key.length; i++) {
    hash ^= BigInt(key.charCodeAt(i));
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  return hash.toString(16).padStart(16, '0');
}

export interface IngestMeshPacketInput {
  rawBuffer?: Buffer;
  parsedPacket?: SmpPacket | SmpBeaconPacket;
  senderPublicKeyHex?: string;
  senderRssi?: number;
}

export interface IngestMeshPacketOutput {
  status: 'PROCESSED' | 'DUPLICATE_DROPPED' | 'BEACON_RECORDED';
  packetType: SmpPacketType;
  senderPeerId: string;
  sequence: number;
  isDuplicate: boolean;
  ingestedRefugeesCount?: number;
  poskoName?: string;
  tacticalMessage?: Partial<TacticalMessage>;
  voiceFrame?: PttVoiceFrame;
  deltaRequests?: DeltaSyncRequest[];
  discoveredPeer?: MeshPeer;
}

export class IngestMeshPacketUseCase {
  constructor(
    private readonly seenCache: LruSeenCache,
    private readonly vectorClockTracker: VectorClockTracker,
    private readonly refugeeRepo?: IRefugeeRepository
  ) {}

  public async execute(input: IngestMeshPacketInput): Promise<Result<IngestMeshPacketOutput, DomainError>> {
    // 1. Decode paket jika input berupa rawBuffer
    let packet: SmpPacket | SmpBeaconPacket;

    if (input.parsedPacket) {
      packet = input.parsedPacket;
    } else if (input.rawBuffer) {
      // Cek apakah ini beacon kompak (16B) atau full SMP packet
      if (input.rawBuffer.length === 16) {
        const beaconRes = SmpPacketCodec.decodeBeacon(input.rawBuffer);
        if (!beaconRes.ok) return Err(beaconRes.error);
        packet = beaconRes.value;
      } else {
        const decodeRes = SmpPacketCodec.decode(input.rawBuffer, input.senderPublicKeyHex);
        if (!decodeRes.ok) return Err(decodeRes.error);
        packet = decodeRes.value;
      }
    } else {
      return Err(
        new DomainError('MISSING_INPUT', 'Harap sertakan rawBuffer atau parsedPacket.', HTTP_STATUS.BAD_REQUEST)
      );
    }

    const { packetType, senderPeerId, sequence } = packet;

    // 2. Anti-Broadcast Storm: Cek LRU Seen-Cache
    const packetHash = LruSeenCache.computePacketHash(senderPeerId, sequence, packetType);
    const isDuplicate = this.seenCache.isDuplicate(packetHash);

    if (isDuplicate) {
      return Ok({
        status: 'DUPLICATE_DROPPED',
        packetType,
        senderPeerId,
        sequence,
        isDuplicate: true,
      });
    }

    // 3. Tangani Compact Presence Beacon / Announce
    if (packetType === SmpPacketType.PRESENCE_BEACON || packetType === SmpPacketType.MESH_ANNOUNCE) {
      const discoveredPeer: MeshPeer = {
        peerId: senderPeerId,
        noisePubkey: `noise_${senderPeerId}`,
        signingPubkey: input.senderPublicKeyHex || `sig_${senderPeerId}`,
        aliasName: `Node ${senderPeerId.slice(0, 4)}`,
        role: 'RELAWAN_LAPANGAN',
        rssi: input.senderRssi || -68,
        hops: 'ttl' in packet ? Math.max(1, 7 - (packet.ttl || 7) + 1) : 1,
        lastSeen: Date.now(),
        currentPosId: 'POS-01',
      };

      return Ok({
        status: 'BEACON_RECORDED',
        packetType,
        senderPeerId,
        sequence,
        isDuplicate: false,
        discoveredPeer,
      });
    }

    // 4. Update Vector Clock jika ada sequence
    this.vectorClockTracker.updateClock(senderPeerId, sequence);

    // 5. Tangani SYNC_DELTA_BATCH (Pengungsi & Event Sourcing)
    if (packetType === SmpPacketType.SYNC_DELTA_BATCH && 'payload' in packet) {
      let manifest;
      try {
        manifest = unpackManifestV4(packet.payload);
      } catch (e) {
        return Err(
          new DomainError(
            'MALFORMED_PAYLOAD',
            `Gagal mendekode payload Ultra-Dense v4: ${(e as Error).message}`,
            HTTP_STATUS.UNPROCESSABLE_ENTITY
          )
        );
      }

      let ingestedCount = 0;
      if (this.refugeeRepo && manifest.persons.length > 0) {
        const originPoskoId = manifest.poskoName || senderPeerId;
        const aggregates: RefugeeAggregate[] = [];

        for (const p of manifest.persons) {
          const seedKey = p.nationalId
            ? `nik:${p.nationalId}`
            : `posko:${originPoskoId}:${p.fullName.trim().toLowerCase()}:${p.gender}:${p.age}`;
          const deterministicHash = computeDeterministicHash(seedKey);
          const deterministicId = asRefugeeId(`ref-${deterministicHash}`);

          const aggResult = RefugeeAggregate.create({
            id: deterministicId,
            poskoId: asPoskoId(originPoskoId),
            fullName: p.fullName,
            nationalId: p.nationalId,
            gender: p.gender,
            age: p.age,
            domicileOrigin: p.domicileOrigin,
            shelterLocation: p.shelterLocation,
            missingKinName: p.missingKinName,
            registeredByUserId: senderPeerId,
          });

          if (aggResult.ok) {
            aggregates.push(aggResult.value);
          }
        }

        const saveRes = await this.refugeeRepo.saveBatch(aggregates);
        if (saveRes.ok) {
          ingestedCount = saveRes.value;
        }
      } else {
        ingestedCount = manifest.persons.length;
      }

      return Ok({
        status: 'PROCESSED',
        packetType,
        senderPeerId,
        sequence,
        isDuplicate: false,
        ingestedRefugeesCount: ingestedCount,
        poskoName: manifest.poskoName,
      });
    }

    // 6. Tangani SYNC_VECTOR_PROBE
    if (packetType === SmpPacketType.SYNC_VECTOR_PROBE && 'payload' in packet) {
      let remoteClocks: Record<string, number> = {};
      try {
        remoteClocks = JSON.parse(packet.payload.toString('utf8'));
      } catch {
        // Fallback jika payload bukan JSON
      }

      const deltaRequests = this.vectorClockTracker.computeDeltaRequirements(remoteClocks);

      return Ok({
        status: 'PROCESSED',
        packetType,
        senderPeerId,
        sequence,
        isDuplicate: false,
        deltaRequests,
      });
    }

    // 7. Tangani TACTICAL_BROADCAST / TACTICAL_DIRECT_MSG
    if (
      (packetType === SmpPacketType.TACTICAL_BROADCAST || packetType === SmpPacketType.TACTICAL_DIRECT_MSG) &&
      'payload' in packet
    ) {
      let msgData: Partial<TacticalMessage> = {};
      try {
        msgData = JSON.parse(packet.payload.toString('utf8'));
      } catch {
        msgData = {
          textContent: packet.payload.toString('utf8'),
        };
      }

      const tacticalMessage: Partial<TacticalMessage> = {
        id: msgData.id || `MSG-${Date.now()}-${sequence}`,
        senderPeerId,
        senderName: msgData.senderName || `Petugas ${senderPeerId.slice(0, 4)}`,
        channel: msgData.channel || 'POSKO_ALL',
        contentType: msgData.contentType || 'TEXT',
        textContent: msgData.textContent || '',
        createdAt: packet.timestamp ? packet.timestamp * 1000 : Date.now(),
        isUrgent: packetType === SmpPacketType.TACTICAL_BROADCAST || msgData.isUrgent,
      };

      return Ok({
        status: 'PROCESSED',
        packetType,
        senderPeerId,
        sequence,
        isDuplicate: false,
        tacticalMessage,
      });
    }

    // 8. Tangani VOICE_NOTE_FRAME
    if (packetType === SmpPacketType.VOICE_NOTE_FRAME && 'payload' in packet) {
      const voiceFrame = PttVoiceCodec.parseFrame(packet.payload);

      return Ok({
        status: 'PROCESSED',
        packetType,
        senderPeerId,
        sequence,
        isDuplicate: false,
        voiceFrame: voiceFrame || undefined,
      });
    }

    // Default generic processed
    return Ok({
      status: 'PROCESSED',
      packetType,
      senderPeerId,
      sequence,
      isDuplicate: false,
    });
  }
}
