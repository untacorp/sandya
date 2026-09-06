import { Result, Ok } from '@/core/shared/result';
import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import {
  RefugeeAggregate,
  RefugeeEventProps,
  TriageCategory,
} from '@/core/domain/refugees/refugee.aggregate';
import { RefugeeId, PoskoId, asRefugeeId, asPoskoId, asEventId } from '@/core/shared/branded-types';
import { InMemorySqliteConnection } from '../sqlite-connection';

export class SqliteRefugeeRepository implements IRefugeeRepository {
  constructor(private readonly db: InMemorySqliteConnection) {}

  public async findById(id: RefugeeId): Promise<Result<RefugeeAggregate | null>> {
    const table = this.db.getTable('refugees');
    const row = table.get(id);
    if (!row) {
      return Ok(null);
    }

    const eventsResult = await this.getEventsByRefugeeId(id);
    const existingEvents = eventsResult.ok ? eventsResult.value : [];

    const agg = RefugeeAggregate.reconstitute(
      {
        id: asRefugeeId(row['id'] as string),
        poskoId: asPoskoId(row['post_id'] as string),
        fullName: row['full_name'] as string,
        nationalId: (row['national_id'] as string) || null,
        gender: row['gender'] as 'M' | 'F',
        age: row['age'] as number,
        domicileOrigin: (row['domicile_origin'] as string) || null,
        shelterLocation: (row['shelter_location'] as string) || null,
        missingKinName: (row['missing_kin_name'] as string) || null,
        currentTriage: (row['current_triage'] as TriageCategory) || 'GREEN',
        registeredByUserId: row['registered_by_user_id'] as string,
        createdAt: (row['created_at'] as number) || Date.now(),
        version: (row['version'] as number) || 1,
      },
      existingEvents
    );

  return Ok(agg);
  }

  public async findByPoskoId(poskoId: PoskoId): Promise<Result<RefugeeAggregate[]>> {
  const table = this.db.getTable('refugees');
  const list: RefugeeAggregate[] = [];

  for (const row of table.values()) {
  if (poskoId === 'ALL' || poskoId === asPoskoId('ALL') || row['post_id'] === poskoId) {
  const agg = RefugeeAggregate.reconstitute(
  {
  id: asRefugeeId(row['id'] as string),
  poskoId: asPoskoId(row['post_id'] as string),
  fullName: row['full_name'] as string,
  nationalId: (row['national_id'] as string) || null,
  gender: row['gender'] as 'M' | 'F',
  age: row['age'] as number,
  domicileOrigin: (row['domicile_origin'] as string) || null,
  shelterLocation: (row['shelter_location'] as string) || null,
  missingKinName: (row['missing_kin_name'] as string) || null,
        currentTriage: (row['current_triage'] as TriageCategory) || 'GREEN',
        registeredByUserId: row['registered_by_user_id'] as string,
        createdAt: (row['created_at'] as number) || Date.now(),
        version: (row['version'] as number) || 1,
      },
      []
    );
  list.push(agg);
  }
  }

  return Ok(list);
  }

  public async save(refugee: RefugeeAggregate): Promise<Result<void>> {
  const snap = refugee.toSnapshot();
  const table = this.db.getTable('refugees');
  table.set(snap.id, {
  id: snap.id,
  post_id: snap.poskoId,
  full_name: snap.fullName,
  national_id: snap.nationalId,
  gender: snap.gender,
  age: snap.age,
  domicile_origin: snap.domicileOrigin,
  shelter_location: snap.shelterLocation,
  missing_kin_name: snap.missingKinName,
  current_triage: snap.currentTriage,
  registered_by_user_id: snap.registeredByUserId,
  created_at: snap.createdAt,
  version: snap.version,
  });

  // Simpan event timeline
  const eventsTable = this.db.getTable('refugee_events');
  for (const ev of refugee.getEvents()) {
  eventsTable.set(ev.id, {
  id: ev.id,
  refugee_id: ev.refugeeId,
  author_id: ev.authorId,
  author_name: ev.authorName,
  author_role: ev.authorRole,
  event_type: ev.eventType,
  event_payload: JSON.stringify(ev.eventPayload),
  device_timestamp: ev.deviceTimestamp,
  logical_seq: ev.logicalSeq,
  causal_parent_id: ev.causalParentId ?? null,
  });
  }

  return Ok(undefined);
  }

  public async saveBatch(refugees: RefugeeAggregate[]): Promise<Result<number>> {
  for (const r of refugees) {
  await this.save(r);
  }
  return Ok(refugees.length);
  }

  public async getEventsByRefugeeId(
  refugeeId: RefugeeId
  ): Promise<Result<RefugeeEventProps[]>> {
  const table = this.db.getTable('refugee_events');
  const events: RefugeeEventProps[] = [];

    for (const row of table.values()) {
      if (row['refugee_id'] === refugeeId) {
        events.push({
          id: asEventId(row['id'] as string),
          refugeeId: asRefugeeId(row['refugee_id'] as string),
          authorId: row['author_id'] as string,
          authorName: row['author_name'] as string,
          authorRole: row['author_role'] as RefugeeEventProps['authorRole'],
          eventType: row['event_type'] as RefugeeEventProps['eventType'],
          eventPayload: JSON.parse(row['event_payload'] as string),
          deviceTimestamp: row['device_timestamp'] as number,
          logicalSeq: row['logical_seq'] as number,
          causalParentId: (row['causal_parent_id'] as string) || undefined,
        });
      }
    }

    events.sort((a, b) => a.logicalSeq - b.logicalSeq);
    return Ok(events);
  }

  public async findMissingKinMatches(
    poskoId: PoskoId,
    missingName: string
  ): Promise<Result<RefugeeAggregate[]>> {
    const table = this.db.getTable('refugees');
    const matches: RefugeeAggregate[] = [];
    const cleanSearch = missingName.trim().toLowerCase();

    for (const row of table.values()) {
      const name = (row['full_name'] as string).toLowerCase();
      if (name.includes(cleanSearch) || cleanSearch.includes(name)) {
        const agg = RefugeeAggregate.reconstitute(
          {
            id: asRefugeeId(row['id'] as string),
            poskoId: asPoskoId(row['post_id'] as string),
            fullName: row['full_name'] as string,
            nationalId: (row['national_id'] as string) || null,
            gender: row['gender'] as 'M' | 'F',
            age: row['age'] as number,
            domicileOrigin: (row['domicile_origin'] as string) || null,
            shelterLocation: (row['shelter_location'] as string) || null,
            missingKinName: (row['missing_kin_name'] as string) || null,
            currentTriage: (row['current_triage'] as TriageCategory) || 'GREEN',
            registeredByUserId: row['registered_by_user_id'] as string,
            createdAt: (row['created_at'] as number) || Date.now(),
            version: (row['version'] as number) || 1,
          },
          []
        );
        matches.push(agg);
      }
    }

  return Ok(matches);
  }

  public async saveRawEvents(events: RefugeeEventProps[]): Promise<Result<void>> {
    const table = this.db.getTable('refugee_events');
    for (const ev of events) {
      table.set(ev.id, {
        id: ev.id,
        refugee_id: ev.refugeeId,
        author_id: ev.authorId,
        author_name: ev.authorName,
        author_role: ev.authorRole,
        event_type: ev.eventType,
        event_payload: typeof ev.eventPayload === 'string' ? ev.eventPayload : JSON.stringify(ev.eventPayload),
        device_timestamp: ev.deviceTimestamp,
        logical_seq: ev.logicalSeq,
        causal_parent_id: ev.causalParentId ?? null,
      });
    }
    return Ok(undefined);
  }

  public async getAllEvents(): Promise<Result<RefugeeEventProps[]>> {
    const table = this.db.getTable('refugee_events');
    const events: RefugeeEventProps[] = [];

    for (const row of table.values()) {
      events.push({
        id: row['id'] as any,
        refugeeId: asRefugeeId(row['refugee_id'] as string),
        authorId: row['author_id'] as string,
        authorName: row['author_name'] as string,
        authorRole: row['author_role'] as any,
        eventType: row['event_type'] as any,
        eventPayload: typeof row['event_payload'] === 'string' ? JSON.parse(row['event_payload']) : row['event_payload'],
        deviceTimestamp: row['device_timestamp'] as number,
        logicalSeq: row['logical_seq'] as number,
        causalParentId: (row['causal_parent_id'] as string) || undefined,
      });
    }

    events.sort((a, b) => a.deviceTimestamp - b.deviceTimestamp);
    return Ok(events);
  }
}
