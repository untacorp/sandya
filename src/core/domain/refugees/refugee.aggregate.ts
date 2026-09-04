import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { RefugeeId, PoskoId, EventId, asEventId } from '@/core/shared/branded-types';

export type Gender = 'M' | 'F';
export type TriageCategory = 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';

export interface CreateRefugeeProps {
  id: RefugeeId;
  poskoId: PoskoId;
  fullName: string;
  nationalId?: string | null | undefined;
  gender: Gender;
  age: number;
  domicileOrigin?: string | null | undefined;
  shelterLocation?: string | null | undefined;
  missingKinName?: string | null | undefined;
  registeredByUserId: string;
}

export interface RefugeeEventProps {
  id: EventId;
  refugeeId: RefugeeId;
  authorId: string;
  authorName: string;
  authorRole: 'PEMIMPIN' | 'KOMANDAN' | 'KOORDINATOR' | 'MEDIS' | 'LOGISTIK' | 'RELAWAN';
  eventType: 'INTAKE' | 'HEALTH_CHECK' | 'NEED_REPORTED' | 'AID_RECEIVED' | 'TRIAGE_UPDATE' | 'NOTE';
  eventPayload: Record<string, unknown>;
  deviceTimestamp: number;
  logicalSeq: number;
  causalParentId?: string | null | undefined;
}

export class RefugeeAggregate {
  private constructor(
    private readonly id: RefugeeId,
    private readonly poskoId: PoskoId,
    private fullName: string,
    private nationalId: string | null,
    private gender: Gender,
    private age: number,
    private domicileOrigin: string | null,
    private shelterLocation: string | null,
    private missingKinName: string | null,
    private currentTriage: TriageCategory,
    private readonly registeredByUserId: string,
    private readonly createdAt: number,
    private version: number,
    private readonly events: RefugeeEventProps[] = []
  ) {}

  public static create(props: CreateRefugeeProps): Result<RefugeeAggregate, DomainError> {
    const trimmedName = props.fullName.trim();
    if (trimmedName.length < 2) {
      return Err(new DomainError('INVALID_NAME', 'Nama pengungsi wajib diisi minimal 2 karakter.', 422));
    }

    if (props.age < 0 || props.age > 127) {
      return Err(new DomainError('INVALID_AGE', 'Usia pengungsi harus berada dalam rentang 0 - 127 tahun.', 422));
    }

    if (props.nationalId && !/^\d{16}$/.test(props.nationalId)) {
      return Err(new DomainError('INVALID_NIK', 'Format NIK harus berupa 16 digit angka.', 422));
    }

    const now = Date.now();
    const aggregate = new RefugeeAggregate(
      props.id,
      props.poskoId,
      trimmedName,
      props.nationalId ?? null,
      props.gender,
      props.age,
      props.domicileOrigin?.trim() ?? null,
      props.shelterLocation?.trim() ?? null,
      props.missingKinName?.trim() ?? null,
      'GREEN',
      props.registeredByUserId,
      now,
      1,
      []
    );

    // Initial intake event
    aggregate.events.push({
      id: asEventId(crypto.randomUUID()),
      refugeeId: props.id,
      authorId: props.registeredByUserId,
      authorName: 'Registrar',
      authorRole: 'RELAWAN',
      eventType: 'INTAKE',
      eventPayload: {
        registeredAt: now,
        initialShelter: props.shelterLocation ?? null,
      },
      deviceTimestamp: now,
      logicalSeq: 1,
    });

    return Ok(aggregate);
  }

  public recordTriageCheck(
    authorId: string,
    authorName: string,
    authorRole: 'KOORDINATOR' | 'MEDIS' | 'RELAWAN',
    triageCategory: TriageCategory,
    vitalSigns: { systolic?: number; diastolic?: number; temperature?: number; complaint?: string },
    logicalSeq: number
  ): Result<void, DomainError> {
    this.currentTriage = triageCategory;
    this.version += 1;

    this.events.push({
      id: asEventId(crypto.randomUUID()),
      refugeeId: this.id,
      authorId,
      authorName,
      authorRole: authorRole as any,
      eventType: 'TRIAGE_UPDATE',
      eventPayload: {
        triageCategory,
        vitalSigns,
      },
      deviceTimestamp: Date.now(),
      logicalSeq,
    });

    return Ok(undefined);
  }

  public updateShelterLocation(newLocation: string): Result<void, DomainError> {
    if (!newLocation.trim()) {
      return Err(new DomainError('INVALID_LOCATION', 'Lokasi penampungan tidak boleh kosong.', 422));
    }
    this.shelterLocation = newLocation.trim();
    this.version += 1;
    return Ok(undefined);
  }

  public toSnapshot() {
    return Object.freeze({
      id: this.id,
      poskoId: this.poskoId,
      fullName: this.fullName,
      nationalId: this.nationalId,
      gender: this.gender,
      age: this.age,
      domicileOrigin: this.domicileOrigin,
      shelterLocation: this.shelterLocation,
      missingKinName: this.missingKinName,
      currentTriage: this.currentTriage,
      registeredByUserId: this.registeredByUserId,
      createdAt: this.createdAt,
      version: this.version,
    });
  }

  public getEvents(): ReadonlyArray<RefugeeEventProps> {
    return Object.freeze([...this.events]);
  }
}
