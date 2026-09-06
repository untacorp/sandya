import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import { IOutboxRepository } from '@/core/domain/sync/outbox.repository.interface';
import { asRefugeeId, asPoskoId, asEventId } from '@/core/shared/branded-types';
import { RefugeeEventProps, TriageCategory } from '@/core/domain/refugees/refugee.aggregate';
import { HTTP_STATUS } from '@/core/shared/constants';

export interface RecordRefugeeEventInput {
  refugeeId: string;
  poskoId: string;
  authorId: string;
  authorName: string;
  authorRole: 'PEMIMPIN' | 'KOMANDAN' | 'KOORDINATOR' | 'MEDIS' | 'LOGISTIK' | 'RELAWAN';
  eventType: 'INTAKE' | 'HEALTH_CHECK' | 'NEED_REPORTED' | 'AID_RECEIVED' | 'TRIAGE_UPDATE' | 'NOTE';
  eventPayload: Record<string, unknown>;
}

export interface RecordRefugeeEventOutput {
  eventId: string;
  logicalSeq: number;
}

export class RecordRefugeeEventUseCase {
  constructor(
  private readonly refugeeRepo: IRefugeeRepository,
  private readonly outboxRepo: IOutboxRepository
  ) {}

  public async execute(input: RecordRefugeeEventInput): Promise<Result<RecordRefugeeEventOutput>> {
  const refugeeId = asRefugeeId(input.refugeeId);
  const refugeeResult = await this.refugeeRepo.findById(refugeeId);

    if (!refugeeResult.ok || !refugeeResult.value) {
      return Err(new DomainError('REFUGEE_NOT_FOUND', 'Data pengungsi tidak ditemukan.', HTTP_STATUS.NOT_FOUND));
    }

    const refugee = refugeeResult.value;

    // RBAC Guard: Event medis klinis (HEALTH_CHECK, TRIAGE_UPDATE) hanya untuk peran MEDIS
    if ((input.eventType === 'HEALTH_CHECK' || input.eventType === 'TRIAGE_UPDATE') && input.authorRole !== 'MEDIS') {
      return Err(
        new DomainError(
          'UNAUTHORIZED_ROLE',
          `Akses ditolak: Pemeriksaan dan penetapan triase klinis hanya dapat dicatat oleh Petugas Medis. Peran Anda: ${input.authorRole}`,
          HTTP_STATUS.FORBIDDEN
        )
      );
    }

  // Ambil riwayat event lama untuk menentukan logical sequence dan causal parent
  const eventsResult = await this.refugeeRepo.getEventsByRefugeeId(refugeeId);
  const existingEvents = eventsResult.ok ? eventsResult.value : [];
  const lastSeq = existingEvents.length > 0
  ? Math.max(...existingEvents.map(e => e.logicalSeq))
  : 0;
  const lastEvent = existingEvents.length > 0 ? existingEvents[existingEvents.length - 1] : null;

  const newLogicalSeq = lastSeq + 1;
  const newEventId = asEventId(crypto.randomUUID());
  const now = Date.now();

  const eventProps: RefugeeEventProps = {
  id: newEventId,
  refugeeId,
  authorId: input.authorId,
  authorName: input.authorName,
  authorRole: input.authorRole,
  eventType: input.eventType,
  eventPayload: input.eventPayload,
  deviceTimestamp: now,
  logicalSeq: newLogicalSeq,
  causalParentId: lastEvent ? lastEvent.id : undefined,
  };

  // Update aggregate
  refugee.appendEvent(eventProps);

  // If it's a triage update, update currentTriage
  if (input.eventType === 'TRIAGE_UPDATE' && input.eventPayload['triageCategory']) {
  refugee.updateTriageStatus(input.eventPayload['triageCategory'] as TriageCategory);
  } else if (input.eventType === 'HEALTH_CHECK' && input.eventPayload['triageCategory']) {
  refugee.updateTriageStatus(input.eventPayload['triageCategory'] as TriageCategory);
  }

  // Persist to repository
  const saveResult = await this.refugeeRepo.save(refugee);
  if (!saveResult.ok) {
  return Err(saveResult.error);
  }

  // Enqueue to outbox for BLE Mesh / QR Sync
  await this.outboxRepo.enqueue({
  poskoId: asPoskoId(input.poskoId),
  topic: 'REFUGEE_EVENT',
  payload: JSON.stringify(eventProps),
  });

  return Ok({
  eventId: newEventId,
  logicalSeq: newLogicalSeq,
  });
  }
}
