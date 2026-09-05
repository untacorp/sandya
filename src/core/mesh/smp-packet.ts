import { Ed25519Signer } from '@/core/crypto/ed25519-signer';
import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { HTTP_STATUS, TIME_CONSTANTS } from '@/core/shared/constants';

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

export const SMP_PACKET_CONSTANTS = {
  CURRENT_VERSION: 0x02,
  BROADCAST_PEER_ID: '0000000000000000',
  DEFAULT_TTL: 7,
  HEADER_SIZE: 28, // 1 + 1 + 1 + 1 + 4 + 8 + 8 + 2 + 2 = 28 Bytes
  PEER_ID_HEX_LENGTH: 16,
  PEER_ID_BYTE_LENGTH: 8,
  SIGNATURE_BYTE_LENGTH: 64,
  VERSION_OFFSET: 0,
  PACKET_TYPE_OFFSET: 1,
  TTL_OFFSET: 2,
  FLAGS_OFFSET: 3,
  TIMESTAMP_OFFSET: 4,
  SENDER_OFFSET: 8,
  RECIPIENT_OFFSET: 16,
  SEQUENCE_OFFSET: 24,
  PAYLOAD_LEN_OFFSET: 26,
  PAYLOAD_OFFSET: 28,
} as const;

export class SmpPacketCodec {
  public static readonly CURRENT_VERSION = SMP_PACKET_CONSTANTS.CURRENT_VERSION;
  public static readonly BROADCAST_PEER_ID = SMP_PACKET_CONSTANTS.BROADCAST_PEER_ID;

  /**
  * Mengemas paket SMP v1 ke dalam buffer biner bertanda tangan digital
  */
  public static encode(packet: SmpPacket, privateKeyHex?: string): Buffer {
  const payloadLen = packet.payload.length;
  const headerBuf = Buffer.alloc(SMP_PACKET_CONSTANTS.HEADER_SIZE);

  headerBuf.writeUInt8(packet.version || SMP_PACKET_CONSTANTS.CURRENT_VERSION, SMP_PACKET_CONSTANTS.VERSION_OFFSET);
  headerBuf.writeUInt8(packet.packetType, SMP_PACKET_CONSTANTS.PACKET_TYPE_OFFSET);
  headerBuf.writeUInt8(packet.ttl, SMP_PACKET_CONSTANTS.TTL_OFFSET);
  headerBuf.writeUInt8(packet.flags, SMP_PACKET_CONSTANTS.FLAGS_OFFSET);
  headerBuf.writeUInt32BE(
  packet.timestamp || Math.floor(Date.now() / TIME_CONSTANTS.MS_PER_SECOND),
  SMP_PACKET_CONSTANTS.TIMESTAMP_OFFSET
  );

  const senderBuf = Buffer.from(
  packet.senderPeerId.padEnd(SMP_PACKET_CONSTANTS.PEER_ID_HEX_LENGTH, '0').slice(0, SMP_PACKET_CONSTANTS.PEER_ID_HEX_LENGTH),
  'hex'
  );
  senderBuf.copy(headerBuf, SMP_PACKET_CONSTANTS.SENDER_OFFSET, 0, SMP_PACKET_CONSTANTS.PEER_ID_BYTE_LENGTH);

  const recipientBuf = Buffer.from(
  (packet.recipientPeerId || SMP_PACKET_CONSTANTS.BROADCAST_PEER_ID)
  .padEnd(SMP_PACKET_CONSTANTS.PEER_ID_HEX_LENGTH, '0')
  .slice(0, SMP_PACKET_CONSTANTS.PEER_ID_HEX_LENGTH),
  'hex'
  );
  recipientBuf.copy(headerBuf, SMP_PACKET_CONSTANTS.RECIPIENT_OFFSET, 0, SMP_PACKET_CONSTANTS.PEER_ID_BYTE_LENGTH);

  headerBuf.writeUInt16BE(packet.sequence, SMP_PACKET_CONSTANTS.SEQUENCE_OFFSET);
  headerBuf.writeUInt16BE(payloadLen, SMP_PACKET_CONSTANTS.PAYLOAD_LEN_OFFSET);

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
  if (buffer.length < SMP_PACKET_CONSTANTS.HEADER_SIZE) {
  return Err(
  new DomainError(
  'PACKET_TOO_SHORT',
  `Panjang paket biner kurang dari ukuran header minimum ${SMP_PACKET_CONSTANTS.HEADER_SIZE}B.`,
  HTTP_STATUS.BAD_REQUEST
  )
  );
  }

  const version = buffer.readUInt8(SMP_PACKET_CONSTANTS.VERSION_OFFSET);
  if (version !== SMP_PACKET_CONSTANTS.CURRENT_VERSION) {
  return Err(
  new DomainError(
  'VERSION_MISMATCH',
  `Versi protokol SMP ${version} tidak didukung (harus ${SMP_PACKET_CONSTANTS.CURRENT_VERSION}).`,
  HTTP_STATUS.BAD_REQUEST
  )
  );
  }

  const packetType = buffer.readUInt8(SMP_PACKET_CONSTANTS.PACKET_TYPE_OFFSET) as SmpPacketType;
  const ttl = buffer.readUInt8(SMP_PACKET_CONSTANTS.TTL_OFFSET);
  const flags = buffer.readUInt8(SMP_PACKET_CONSTANTS.FLAGS_OFFSET);
  const timestamp = buffer.readUInt32BE(SMP_PACKET_CONSTANTS.TIMESTAMP_OFFSET);
  const senderPeerId = buffer
  .subarray(SMP_PACKET_CONSTANTS.SENDER_OFFSET, SMP_PACKET_CONSTANTS.RECIPIENT_OFFSET)
  .toString('hex');
  const recipientPeerId = buffer
  .subarray(SMP_PACKET_CONSTANTS.RECIPIENT_OFFSET, SMP_PACKET_CONSTANTS.SEQUENCE_OFFSET)
  .toString('hex');
  const sequence = buffer.readUInt16BE(SMP_PACKET_CONSTANTS.SEQUENCE_OFFSET);
  const payloadLen = buffer.readUInt16BE(SMP_PACKET_CONSTANTS.PAYLOAD_LEN_OFFSET);

  if (buffer.length < SMP_PACKET_CONSTANTS.HEADER_SIZE + payloadLen) {
  return Err(
  new DomainError('TRUNCATED_PAYLOAD', 'Panjang payload aktual lebih pendek dari deklarasi header.', HTTP_STATUS.BAD_REQUEST)
  );
  }

  const payload = buffer.subarray(SMP_PACKET_CONSTANTS.PAYLOAD_OFFSET, SMP_PACKET_CONSTANTS.PAYLOAD_OFFSET + payloadLen);
  const rawSignedData = buffer.subarray(0, SMP_PACKET_CONSTANTS.PAYLOAD_OFFSET + payloadLen);
  let signatureHex: string | undefined = undefined;

  // Jika ada signature di ekor paket (64 bytes)
  const minLengthWithSignature = SMP_PACKET_CONSTANTS.HEADER_SIZE + payloadLen + SMP_PACKET_CONSTANTS.SIGNATURE_BYTE_LENGTH;
  if (buffer.length >= minLengthWithSignature) {
  const sigBuf = buffer.subarray(
  SMP_PACKET_CONSTANTS.HEADER_SIZE + payloadLen,
  minLengthWithSignature
  );
  signatureHex = sigBuf.toString('hex');

  if (senderPublicKeyHex) {
  const isValid = Ed25519Signer.verifySignature(rawSignedData, signatureHex, senderPublicKeyHex);
  if (!isValid) {
  return Err(new DomainError('INVALID_SIGNATURE', 'Tanda tangan digital paket SMP v1 tidak valid.', HTTP_STATUS.UNAUTHORIZED));
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
