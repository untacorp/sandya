import { Result, Ok, Err } from '@/core/shared/result';
import { RefugeeAggregate } from '@/core/domain/refugees/refugee.aggregate';
import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import { IOutboxRepository } from '@/core/domain/sync/outbox.repository.interface';
import { asRefugeeId, asPoskoId, PoskoId } from '@/core/shared/branded-types';

export interface FastIntakeInput {
  poskoId: string;
  fullName: string;
  nationalId?: string | null | undefined;
  gender: 'M' | 'F';
  age: number;
  domicileOrigin?: string | null | undefined;
  shelterLocation?: string | null | undefined;
  missingKinName?: string | null | undefined;
  urgentNeeds?: number[] | undefined;
  vulnerabilities?: number | undefined;
  registeredByUserId: string;
}

export interface FastIntakeOutput {
  refugeeId: string;
  matchedKinCount: number;
}

export class FastIntakeUseCase {
  constructor(
  private readonly refugeeRepo: IRefugeeRepository,
  private readonly outboxRepo: IOutboxRepository
  ) {}

  public async execute(input: FastIntakeInput): Promise<Result<FastIntakeOutput>> {
  // 1. Instansiasi Domain Aggregate
  const aggregateResult = RefugeeAggregate.create({
  id: asRefugeeId(crypto.randomUUID()),
  poskoId: asPoskoId(input.poskoId),
  fullName: input.fullName,
  nationalId: input.nationalId,
  gender: input.gender,
  age: input.age,
  domicileOrigin: input.domicileOrigin,
  shelterLocation: input.shelterLocation,
  missingKinName: input.missingKinName,
  registeredByUserId: input.registeredByUserId,
  });

  if (!aggregateResult.ok) {
  return Err(aggregateResult.error);
  }

  const aggregate = aggregateResult.value;

  // 2. Simpan ke Repository Lokal
  const saveResult = await this.refugeeRepo.save(aggregate);
  if (!saveResult.ok) {
  return Err(saveResult.error);
  }

  // 3. Masukkan ke Transactional Outbox untuk Sync BLE Mesh / QR
  await this.outboxRepo.enqueue({
  poskoId: asPoskoId(input.poskoId),
  topic: 'REFUGEE_INTAKE',
  payload: JSON.stringify(aggregate.toSnapshot()),
  });

  // 4. Deteksi Otomatis Temu Keluarga Lokal (Family Reunion Matcher)
  let matchedKinCount = 0;
  if (input.missingKinName?.trim()) {
  const matchResult = await this.refugeeRepo.findMissingKinMatches(
  asPoskoId(input.poskoId),
  input.missingKinName.trim()
  );
  if (matchResult.ok) {
  matchedKinCount = matchResult.value.length;
  }
  }

  return Ok({
  refugeeId: aggregate.toSnapshot().id,
  matchedKinCount,
  });
  }
}
