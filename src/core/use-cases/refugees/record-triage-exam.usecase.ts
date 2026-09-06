import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import { IOutboxRepository } from '@/core/domain/sync/outbox.repository.interface';
import { asRefugeeId, asPoskoId, asEventId } from '@/core/shared/branded-types';
import { TriageCategory, RefugeeEventProps } from '@/core/domain/refugees/refugee.aggregate';
import { DISASTER_NEEDS_CATALOG } from '@/core/codecs/needs-catalog';
import { HTTP_STATUS, RADIX } from '@/core/shared/constants';

export interface PrescriptionItemInput {
  needTokenId: number; // e.g. 0x27 for Paracetamol
  medicineName: string;
  quantity: number;
  unit: string;
  dosage?: string | undefined;
}

export interface RecordTriageExamInput {
  refugeeId: string;
  poskoId: string;
  authorId: string;
  authorName: string;
  authorRole: 'PEMIMPIN_ORGANISASI' | 'KOMANDAN_MISI' | 'KOORDINATOR_POSKO' | 'PETUGAS_MEDIS' | 'PETUGAS_LOGISTIK' | 'RELAWAN_LAPANGAN' | 'WARGA_TAMU';
  triageCategory: TriageCategory;
  vitalSigns: {
  systolic?: number | undefined;
  diastolic?: number | undefined;
  temperature?: number | undefined;
  pulse?: number | undefined;
  spo2?: number | undefined;
  complaint?: string | undefined;
  diagnosis?: string | undefined;
  };
  prescriptions?: PrescriptionItemInput[] | undefined;
}

export interface RecordTriageExamOutput {
  eventId: string;
  logicalSeq: number;
  triageCategory: TriageCategory;
  prescriptionsIssued: number;
  ticketIds: string[];
}

export const TRIAGE_EXAM_CONSTANTS = {
  TOKEN_HEX_PAD_LENGTH: 2,
  TICKET_ID_PREFIX_LENGTH: 8,
  MIN_MEDICINE_QUANTITY: 1,
} as const;

export class RecordTriageExamUseCase {
  constructor(
  private readonly refugeeRepo: IRefugeeRepository,
  private readonly outboxRepo: IOutboxRepository
  ) {}

  public async execute(input: RecordTriageExamInput): Promise<Result<RecordTriageExamOutput>> {
  // 1. RBAC Guard: Hanya peran medis & pimpinan posko yang berwenang
  const authorizedRoles = ['PETUGAS_MEDIS', 'KOORDINATOR_POSKO', 'KOMANDAN_MISI', 'PEMIMPIN_ORGANISASI'];
  if (!authorizedRoles.includes(input.authorRole)) {
  return Err(
  new DomainError(
  'UNAUTHORIZED_ROLE',
  'Akses ditolak: Hanya Petugas Medis Berlisensi atau Koordinator yang berhak menetapkan triase klinis dan meresepkan obat.',
  HTTP_STATUS.FORBIDDEN
  )
  );
  }

  // 2. Fetch refugee from database
  const refugeeId = asRefugeeId(input.refugeeId);
  const refugeeResult = await this.refugeeRepo.findById(refugeeId);
  if (!refugeeResult.ok || !refugeeResult.value) {
  return Err(new DomainError('REFUGEE_NOT_FOUND', 'Data pengungsi tidak ditemukan.', HTTP_STATUS.NOT_FOUND));
  }

  const refugee = refugeeResult.value;

  // 3. Hitung monotonic sequence & causal parent
  const eventsResult = await this.refugeeRepo.getEventsByRefugeeId(refugeeId);
  const existingEvents = eventsResult.ok ? eventsResult.value : [];
  const lastSeq = existingEvents.length > 0
  ? Math.max(...existingEvents.map((e) => e.logicalSeq))
  : 0;
  const lastEvent = existingEvents.length > 0 ? existingEvents[existingEvents.length - 1] : null;

  const newLogicalSeq = lastSeq + 1;
  const newEventId = asEventId(crypto.randomUUID());
  const now = Date.now();

  // Map internal author role
  const authorRoleMap: Record<string, RefugeeEventProps['authorRole']> = {
  PEMIMPIN_ORGANISASI: 'PEMIMPIN',
  KOMANDAN_MISI: 'KOMANDAN',
  KOORDINATOR_POSKO: 'KOORDINATOR',
  PETUGAS_MEDIS: 'MEDIS',
  PETUGAS_LOGISTIK: 'LOGISTIK',
  RELAWAN_LAPANGAN: 'RELAWAN',
  };

  const validatedPrescriptions = (input.prescriptions || []).map((rx) => {
  const catalogItem = DISASTER_NEEDS_CATALOG[rx.needTokenId];
  return {
  needTokenId: rx.needTokenId,
  tokenHex: `0x${rx.needTokenId.toString(RADIX.HEXADECIMAL).padStart(TRIAGE_EXAM_CONSTANTS.TOKEN_HEX_PAD_LENGTH, '0')}`,
  medicineName: catalogItem?.nameId || rx.medicineName,
  quantity: Math.max(TRIAGE_EXAM_CONSTANTS.MIN_MEDICINE_QUANTITY, rx.quantity),
  unit: rx.unit || 'STRIP',
  dosage: rx.dosage || 'Sesuai petunjuk dokter',
  };
  });

  const eventProps: RefugeeEventProps = {
  id: newEventId,
  refugeeId,
  authorId: input.authorId,
  authorName: input.authorName,
  authorRole: authorRoleMap[input.authorRole] || 'MEDIS',
  eventType: 'HEALTH_CHECK',
  eventPayload: {
  triageCategory: input.triageCategory,
  vitalSigns: input.vitalSigns,
  prescriptions: validatedPrescriptions,
  },
  deviceTimestamp: now,
  logicalSeq: newLogicalSeq,
  causalParentId: lastEvent ? lastEvent.id : undefined,
  };

  // 4. Update Aggregate
  refugee.updateTriageStatus(input.triageCategory);
  refugee.appendEvent(eventProps);

  // 5. Save to Repository
  const saveResult = await this.refugeeRepo.save(refugee);
  if (!saveResult.ok) {
  return Err(saveResult.error);
  }

  // 6. Enqueue event to Outbox for mesh gossip
  await this.outboxRepo.enqueue({
  poskoId: asPoskoId(input.poskoId),
  topic: 'TRIAGE_EXAM',
  payload: JSON.stringify(eventProps),
  });

  // 7. Generate Ticket IDs for logistics pharmacy dispatch
  const ticketIds: string[] = validatedPrescriptions.map(
  (rx, idx) => `TKT-RX-${newEventId.slice(0, TRIAGE_EXAM_CONSTANTS.TICKET_ID_PREFIX_LENGTH)}-${idx + 1}`
  );

  return Ok({
  eventId: newEventId,
  logicalSeq: newLogicalSeq,
  triageCategory: input.triageCategory,
  prescriptionsIssued: validatedPrescriptions.length,
  ticketIds,
  });
  }
}
