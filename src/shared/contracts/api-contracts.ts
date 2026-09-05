import { z } from 'zod';

export const API_VALIDATION_CONSTANTS = {
  MIN_FULL_NAME_LEN: 2,
  MAX_FULL_NAME_LEN: 100,
  NIK_LENGTH: 16,
  MIN_AGE: 0,
  MAX_AGE: 127,
  MAX_DOMICILE_LEN: 100,
  MAX_SHELTER_LEN: 50,
  MAX_MISSING_KIN_LEN: 100,
  MIN_NEED_TOKEN_ID: 1,
  MAX_NEED_TOKEN_ID: 255,
  MAX_URGENT_NEEDS_COUNT: 5,
  MIN_VULNERABILITY_MASK: 0,
  MAX_VULNERABILITY_MASK: 255,
  MAX_NOTES_LEN: 200,
  PEER_ID_HEX_LEN: 16,
  MAX_TEXT_CONTENT_LEN: 500,
  MAX_AUDIO_BASE64_LEN: 4000,
  MIN_AUDIO_DURATION_MS: 0,
  MAX_AUDIO_DURATION_MS: 5000,
  DEFAULT_PROTOCOL_VERSION: 2,
  MIN_SENDER_PEER_ID_LEN: 8,
  MAX_SENDER_PEER_ID_LEN: 32,
  MIN_SEQUENCE_NUMBER: 1,
  SIGNATURE_HEX_LEN: 128,
} as const;

// 1. FAST INTAKE REQUEST CONTRACT
export const FastIntakeSchema = z.object({
  posId: z.string().min(1),
  fullName: z
  .string()
  .min(
  API_VALIDATION_CONSTANTS.MIN_FULL_NAME_LEN,
  `Nama minimal ${API_VALIDATION_CONSTANTS.MIN_FULL_NAME_LEN} karakter`
  )
  .max(API_VALIDATION_CONSTANTS.MAX_FULL_NAME_LEN),
  nationalId: z
  .string()
  .regex(
  /^\d{16}$/,
  `NIK harus ${API_VALIDATION_CONSTANTS.NIK_LENGTH} digit`
  )
  .nullable()
  .optional(),
  gender: z.enum(['M', 'F']),
  age: z
  .number()
  .int()
  .min(API_VALIDATION_CONSTANTS.MIN_AGE)
  .max(API_VALIDATION_CONSTANTS.MAX_AGE),
  domicileOrigin: z.string().max(API_VALIDATION_CONSTANTS.MAX_DOMICILE_LEN).nullable().optional(),
  shelterLocation: z.string().max(API_VALIDATION_CONSTANTS.MAX_SHELTER_LEN).nullable().optional(),
  missingKinName: z.string().max(API_VALIDATION_CONSTANTS.MAX_MISSING_KIN_LEN).nullable().optional(),
  urgentNeeds: z
  .array(
  z
  .number()
  .int()
  .min(API_VALIDATION_CONSTANTS.MIN_NEED_TOKEN_ID)
  .max(API_VALIDATION_CONSTANTS.MAX_NEED_TOKEN_ID)
  )
  .max(API_VALIDATION_CONSTANTS.MAX_URGENT_NEEDS_COUNT)
  .optional(),
  vulnerabilities: z
  .number()
  .int()
  .min(API_VALIDATION_CONSTANTS.MIN_VULNERABILITY_MASK)
  .max(API_VALIDATION_CONSTANTS.MAX_VULNERABILITY_MASK)
  .optional(),
});
export type FastIntakeDto = z.infer<typeof FastIntakeSchema>;

// 2. STOCK MUTATION REQUEST CONTRACT
export const MutateStockSchema = z.object({
  posId: z.string().min(1),
  itemId: z.string().min(1),
  txType: z.enum(['RESTOCK', 'DISTRIBUTION', 'DAMAGE', 'TRANSFER_OUT', 'TRANSFER_IN']),
  quantityChange: z.number().int().refine((val) => val !== 0, 'Perubahan kuantitas tidak boleh 0'),
  referenceTicketId: z.string().nullable().optional(),
  notes: z.string().max(API_VALIDATION_CONSTANTS.MAX_NOTES_LEN).optional(),
});
export type MutateStockDto = z.infer<typeof MutateStockSchema>;

// 3. TACTICAL MESSAGE CONTRACT
export const TacticalMessageSchema = z.object({
  channel: z.enum(['POSKO_ALL', 'MEDIS', 'LOGISTIK', 'SOS', 'DM']),
  recipientPeerId: z.string().length(API_VALIDATION_CONSTANTS.PEER_ID_HEX_LEN).nullable().optional(),
  contentType: z.enum(['TEXT', 'VOICE_NOTE', 'ALERT']),
  textContent: z.string().max(API_VALIDATION_CONSTANTS.MAX_TEXT_CONTENT_LEN).nullable().optional(),
  audioBase64: z.string().max(API_VALIDATION_CONSTANTS.MAX_AUDIO_BASE64_LEN).nullable().optional(),
  audioDurationMs: z
  .number()
  .int()
  .min(API_VALIDATION_CONSTANTS.MIN_AUDIO_DURATION_MS)
  .max(API_VALIDATION_CONSTANTS.MAX_AUDIO_DURATION_MS)
  .optional(),
  isUrgent: z.boolean().default(false),
});
export type TacticalMessageDto = z.infer<typeof TacticalMessageSchema>;

// 4. SYNC INGESTION CONTRACT
export const IngestPacketSchema = z.object({
  protocolVersion: z.number().int().default(API_VALIDATION_CONSTANTS.DEFAULT_PROTOCOL_VERSION),
  packetType: z.number().int(),
  originPosId: z.string().min(1),
  senderPeerId: z
  .string()
  .min(API_VALIDATION_CONSTANTS.MIN_SENDER_PEER_ID_LEN)
  .max(API_VALIDATION_CONSTANTS.MAX_SENDER_PEER_ID_LEN),
  sequenceNumber: z.number().int().min(API_VALIDATION_CONSTANTS.MIN_SEQUENCE_NUMBER),
  payloadBase64: z.string().min(1),
  signatureHex: z.string().length(API_VALIDATION_CONSTANTS.SIGNATURE_HEX_LEN),
  timestamp: z.number().int(),
});
export type IngestPacketDto = z.infer<typeof IngestPacketSchema>;

// 5. VECTOR CLOCK PROBE CONTRACT
export const VectorProbeSchema = z.object({
  probeNodeId: z.string(),
  clocks: z.record(z.string().min(1), z.number().int()),
});
export type VectorProbeDto = z.infer<typeof VectorProbeSchema>;
