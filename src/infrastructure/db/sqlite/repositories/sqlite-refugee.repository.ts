import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import {
  RefugeeAggregate,
  RefugeeEventProps,
} from '@/core/domain/refugees/refugee.aggregate';
import { RefugeeId, PoskoId, asRefugeeId, asPoskoId } from '@/core/shared/branded-types';
import { InMemorySqliteConnection } from '../sqlite-connection';

export class SqliteRefugeeRepository implements IRefugeeRepository {
  constructor(private readonly db: InMemorySqliteConnection) {}

  public async findById(id: RefugeeId): Promise<Result<RefugeeAggregate | null>> {
    const table = this.db.getTable('refugees');
    const row = table.get(id);
    if (!row) {
      return Ok(null);
    }

    const aggResult = RefugeeAggregate.create({
      id: asRefugeeId(row['id'] as string),
      poskoId: asPoskoId(row['post_id'] as string),
      fullName: row['full_name'] as string,
      nationalId: (row['national_id'] as string) || null,
      gender: row['gender'] as 'M' | 'F',
      age: row['age'] as number,
      domicileOrigin: (row['domicile_origin'] as string) || null,
      shelterLocation: (row['shelter_location'] as string) || null,
      missingKinName: (row['missing_kin_name'] as string) || null,
      registeredByUserId: row['registered_by_user_id'] as string,
    });

    if (!aggResult.ok) {
      return Err(aggResult.error);
    }

    return Ok(aggResult.value);
  }

  public async findByPoskoId(poskoId: PoskoId): Promise<Result<RefugeeAggregate[]>> {
    const table = this.db.getTable('refugees');
    const list: RefugeeAggregate[] = [];

    for (const row of table.values()) {
      if (row['post_id'] === poskoId) {
        const aggResult = RefugeeAggregate.create({
          id: asRefugeeId(row['id'] as string),
          poskoId: asPoskoId(row['post_id'] as string),
          fullName: row['full_name'] as string,
          nationalId: (row['national_id'] as string) || null,
          gender: row['gender'] as 'M' | 'F',
          age: row['age'] as number,
          domicileOrigin: (row['domicile_origin'] as string) || null,
          shelterLocation: (row['shelter_location'] as string) || null,
          missingKinName: (row['missing_kin_name'] as string) || null,
          registeredByUserId: row['registered_by_user_id'] as string,
        });

        if (aggResult.ok) {
          list.push(aggResult.value);
        }
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
          id: row['id'] as any,
          refugeeId: asRefugeeId(row['refugee_id'] as string),
          authorId: row['author_id'] as string,
          authorName: row['author_name'] as string,
          authorRole: row['author_role'] as any,
          eventType: row['event_type'] as any,
          eventPayload: JSON.parse(row['event_payload'] as string),
          deviceTimestamp: row['device_timestamp'] as number,
          logicalSeq: row['logical_seq'] as number,
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
        const aggResult = RefugeeAggregate.create({
          id: asRefugeeId(row['id'] as string),
          poskoId: asPoskoId(row['post_id'] as string),
          fullName: row['full_name'] as string,
          nationalId: (row['national_id'] as string) || null,
          gender: row['gender'] as 'M' | 'F',
          age: row['age'] as number,
          domicileOrigin: (row['domicile_origin'] as string) || null,
          shelterLocation: (row['shelter_location'] as string) || null,
          missingKinName: (row['missing_kin_name'] as string) || null,
          registeredByUserId: row['registered_by_user_id'] as string,
        });
        if (aggResult.ok) {
          matches.push(aggResult.value);
        }
      }
    }

    return Ok(matches);
  }
}
