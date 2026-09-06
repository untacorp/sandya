import { Result } from '@/core/shared/result';
import { RefugeeAggregate, RefugeeEventProps } from './refugee.aggregate';
import { RefugeeId, PoskoId } from '@/core/shared/branded-types';

export interface IRefugeeRepository {
  findById(id: RefugeeId): Promise<Result<RefugeeAggregate | null>>;
  findByPoskoId(poskoId: PoskoId): Promise<Result<RefugeeAggregate[]>>;
  save(refugee: RefugeeAggregate): Promise<Result<void>>;
  saveBatch(refugees: RefugeeAggregate[]): Promise<Result<number>>;
  getEventsByRefugeeId(refugeeId: RefugeeId): Promise<Result<RefugeeEventProps[]>>;
  findMissingKinMatches(poskoId: PoskoId, missingName: string): Promise<Result<RefugeeAggregate[]>>;
  saveRawEvents(events: RefugeeEventProps[]): Promise<Result<void>>;
  getAllEvents(): Promise<Result<RefugeeEventProps[]>>;
}
