import { Ed25519Signer } from '@/core/crypto/ed25519-signer';
import { Result, Ok, Err, DomainError } from '@/core/shared/result';

export enum SmpPacketType {
  MESH_ANNOUNCE = 0x01,
  TACTICAL_BROADCAST = 0x02,
  TACTICAL_DIRECT_MSG = 0x03,
  VOICE_NOTE_FRAME = 0x04,
  SYNC_VECTOR_PROBE = 0x10,
  SYNC_DELTA_BATCH = 0x11,
  LOGISTICS_REQUISITION = 0x12,
  FAMILY_REUNION_BEACON = 0x13,
}

export interface SmpPacket {
  version: number; // 1 Byte (0x02)
  packetType: SmpPacketType; // 1 Byte
  ttl: number; // 1 Byte (Default: 7)
  flags: number; // 1 Byte
  timestamp: number; // 4 Bytes (uint32 Epoch seconds)
  senderPeerId: string; // 8 Bytes (Hex string 16 chars)
  recipientPeerId: string; // 8 Bytes (Hex string 16 chars; 00..00 for broadcast)
  sequence: number; // 2 Bytes (uint16)
  payload: Buffer; // Max ~380 Bytes (to fit MTU ~469B with 64B Ed25519 signature)
  signatureHex?: string; // 64 Bytes DER/Raw hex signature
}

export class SmpPacketCodec {
  public static readonly CURRENT_VERSION = 0x02;
  public static readonly BROADCAST_PEER_ID = '0000000000000000';

  /**
   * Mengemas paket SMP v1 ke dalam buffer biner bertanda tangan digital
   */
  public static encode(packet: SmpPacket, privateKeyHex?: string): Buffer {
    const payloadLen = packet.payload.length;
    const headerBuf = Buffer.alloc(28); // 1 + 1 + 1 + 1 + 4 + 8 + 8 + 2 + 2 = 28 Bytes

    headerBuf.writeUInt8(packet.version || SmpPacketCodec.CURRENT_VERSION, 0);
    headerBuf.writeUInt8(packet.packetType, 1);
    headerBuf.writeUInt8(packet.ttl, 2);
    headerBuf.writeUInt8(packet.flags, 3);
    headerBuf.writeUInt32BE(packet.timestamp || Math.floor(Date.now() / 1000), 4);

    const senderBuf = Buffer.from(packet.senderPeerId.padEnd(16, '0').slice(0, 16), 'hex');
    senderBuf.copy(headerBuf, 8, 0, 8);

    const recipientBuf = Buffer.from((packet.recipientPeerId || SmpPacketCodec.BROADCAST_PEER_ID).padEnd(16, '0').slice(0, 16), 'hex');
    recipientBuf.copy(headerBuf, 16, 0, 8);

    headerBuf.writeUInt16BE(packet.sequence, 24);
    headerBuf.writeUInt16BE(payloadLen, 26);

    const unSignedPacket = Buffer.concat([headerBuf, packet.payload]);

    if (privateKeyHex) {
      const sigHex = Ed25519Signer.signPayload(unSignedPacket, privateKeyHex);
      const sigBuf = Buffer.from(sigHex, 'hex');
      return Buffer.concat([unSignedPacket, sigBuf]);
    }

    return unSignedPacket;
  }

  /**
   * Mendekode buffer biner paket SMP v1 dan memverifikasi integritas tanda tangan
   */
  public static decode(
    buffer: Buffer,
    senderPublicKeyHex?: string
  ): Result<SmpPacket, DomainError> {
    if (buffer.length < 28) {
      return Err(new DomainError('PACKET_TOO_SHORT', 'Panjang paket biner kurang dari ukuran header minimum 28B.', 400));
    }

    const version = buffer.readUInt8(0);
    if (version !== SmpPacketCodec.CURRENT_VERSION) {
      return Err(new DomainError('VERSION_MISMATCH', `Versi protokol SMP ${version} tidak didukung (harus ${SmpPacketCodec.CURRENT_VERSION}).`, 400));
    }

    const packetType = buffer.readUInt8(1) as SmpPacketType;
    const ttl = buffer.readUInt8(2);
    const flags = buffer.readUInt8(3);
    const timestamp = buffer.readUInt32BE(4);
    const senderPeerId = buffer.subarray(8, 16).toString('hex');
    const recipientPeerId = buffer.subarray(16, 24).toString('hex');
    const sequence = buffer.readUInt16BE(24);
    const payloadLen = buffer.readUInt16BE(26);

    if (buffer.length < 28 + payloadLen) {
      return Err(new DomainError('TRUNCATED_PAYLOAD', 'Panjang payload aktual lebih pendek dari deklarasi header.', 400));
    }

    const payload = buffer.subarray(28, 28 + payloadLen);
    const rawSignedData = buffer.subarray(0, 28 + payloadLen);
    let signatureHex: string | undefined = undefined;

    // Jika ada signature di ekor paket (64 bytes = 128 hex chars)
    if (buffer.length >= 28 + payloadLen + 64) {
      const sigBuf = buffer.subarray(28 + payloadLen, 28 + payloadLen + 64);
      signatureHex = sigBuf.toString('hex');

      if (senderPublicKeyHex) {
        const isValid = Ed25519Signer.verifySignature(rawSignedData, signatureHex, senderPublicKeyHex);
        if (!isValid) {
          return Err(new DomainError('INVALID_SIGNATURE', 'Tanda tangan digital paket SMP v1 tidak valid.', 401));
        }
      }
    }

    return Ok({
      version,
      packetType,
      ttl,
      flags,
      timestamp,
      senderPeerId,
      recipientPeerId,
      sequence,
      payload,
      signatureHex,
    });
  }
}
