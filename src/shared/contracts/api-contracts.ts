import { z } from 'zod';

// 1. FAST INTAKE REQUEST CONTRACT
export const FastIntakeSchema = z.object({
  posId: z.string().min(1),
  fullName: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  nationalId: z.string().regex(/^\d{16}$/, 'NIK harus 16 digit').nullable().optional(),
  gender: z.enum(['M', 'F']),
  age: z.number().int().min(0).max(127),
  domicileOrigin: z.string().max(100).nullable().optional(),
  shelterLocation: z.string().max(50).nullable().optional(),
  missingKinName: z.string().max(100).nullable().optional(),
  urgentNeeds: z.array(z.number().int().min(1).max(255)).max(5).optional(),
  vulnerabilities: z.number().int().min(0).max(255).optional(),
});
export type FastIntakeDto = z.infer<typeof FastIntakeSchema>;

// 2. STOCK MUTATION REQUEST CONTRACT
export const MutateStockSchema = z.object({
  posId: z.string().min(1),
  itemId: z.string().min(1),
  txType: z.enum(['RESTOCK', 'DISTRIBUTION', 'DAMAGE', 'TRANSFER_OUT', 'TRANSFER_IN']),
  quantityChange: z.number().int().refine((val) => val !== 0, 'Perubahan kuantitas tidak boleh 0'),
  referenceTicketId: z.string().nullable().optional(),
  notes: z.string().max(200).optional(),
});
export type MutateStockDto = z.infer<typeof MutateStockSchema>;

// 3. TACTICAL MESSAGE CONTRACT
export const TacticalMessageSchema = z.object({
  channel: z.enum(['POSKO_ALL', 'MEDIS', 'LOGISTIK', 'SOS', 'DM']),
  recipientPeerId: z.string().length(16).nullable().optional(),
  contentType: z.enum(['TEXT', 'VOICE_NOTE', 'ALERT']),
  textContent: z.string().max(500).nullable().optional(),
  audioBase64: z.string().max(4000).nullable().optional(),
  audioDurationMs: z.number().int().min(0).max(5000).optional(),
  isUrgent: z.boolean().default(false),
});
export type TacticalMessageDto = z.infer<typeof TacticalMessageSchema>;

// 4. SYNC INGESTION CONTRACT
export const IngestPacketSchema = z.object({
  protocolVersion: z.number().int().default(2),
  packetType: z.number().int(),
  originPosId: z.string().min(1),
  senderPeerId: z.string().min(8).max(32),
  sequenceNumber: z.number().int().min(1),
  payloadBase64: z.string().min(1),
  signatureHex: z.string().length(128),
  timestamp: z.number().int(),
});
export type IngestPacketDto = z.infer<typeof IngestPacketSchema>;

// 5. VECTOR CLOCK PROBE CONTRACT
export const VectorProbeSchema = z.object({
  probeNodeId: z.string(),
  clocks: z.record(z.string().min(1), z.number().int()),
});
export type VectorProbeDto = z.infer<typeof VectorProbeSchema>;
