/**
 * Branded Nominal Types
 * Mencegah bug fatal tertukarnya ID entitas yang berbeda tipe (misal: ID Posko tertukar dengan ID Pengungsi).
 */

export type Branded<T, BrandTag extends string> = T & { readonly __brand: BrandTag };

export type RefugeeId = Branded<string, 'RefugeeId'>;
export type PoskoId = Branded<string, 'PoskoId'>;
export type MissionId = Branded<string, 'MissionId'>;
export type OrgId = Branded<string, 'OrgId'>;
export type ItemId = Branded<string, 'ItemId'>;
export type TicketId = Branded<string, 'TicketId'>;
export type PeerId = Branded<string, 'PeerId'>;
export type EventId = Branded<string, 'EventId'>;
export type OutboxId = Branded<string, 'OutboxId'>;

export function asRefugeeId(id: string): RefugeeId {
  return id as RefugeeId;
}

export function asPoskoId(id: string): PoskoId {
  return id as PoskoId;
}

export function asMissionId(id: string): MissionId {
  return id as MissionId;
}

export function asOrgId(id: string): OrgId {
  return id as OrgId;
}

export function asItemId(id: string): ItemId {
  return id as ItemId;
}

export function asTicketId(id: string): TicketId {
  return id as TicketId;
}

export function asPeerId(id: string): PeerId {
  return id as PeerId;
}

export function asEventId(id: string): EventId {
  return id as EventId;
}

export function asOutboxId(id: string): OutboxId {
  return id as OutboxId;
}
