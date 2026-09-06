import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { RefugeeAggregate } from '@/core/domain/refugees/refugee.aggregate';
import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import { IOutboxRepository } from '@/core/domain/sync/outbox.repository.interface';
import { asRefugeeId, asPoskoId } from '@/core/shared/branded-types';
import { HTTP_STATUS } from '@/core/shared/constants';
import { type VulnerabilityCategory } from '@/shared/types';

export interface BulkIntakeMemberInput {
  fullName: string;
  nationalId?: string | null | undefined;
  gender: 'M' | 'F';
  age: number;
  vulnerabilities?: VulnerabilityCategory[] | undefined;
  urgentNeeds?: string[] | undefined;
  missingKinName?: string | null | undefined;
  shelterLocation?: string | null | undefined;
  domicileOrigin?: string | null | undefined;
}

export interface BulkIntakeInput {
  poskoId: string;
  defaultDomicileOrigin: string;
  defaultShelterLocation: string;
  members: BulkIntakeMemberInput[];
  registeredByUserId: string;
}

export interface BulkIntakeOutput {
  registeredCount: number;
  refugeeIds: string[];
  matchedKinCount: number;
}

export class BulkIntakeUseCase {
  constructor(
    private readonly refugeeRepo: IRefugeeRepository,
    private readonly outboxRepo: IOutboxRepository
  ) {}

  public async execute(input: BulkIntakeInput): Promise<Result<BulkIntakeOutput>> {
    if (!input.members || input.members.length === 0) {
      return Err(
        new DomainError(
          'EMPTY_BULK_INTAKE',
          'Daftar anggota pengungsi untuk pendaftaran massal tidak boleh kosong.',
          HTTP_STATUS.UNPROCESSABLE_ENTITY
        )
      );
    }

    const createdAggregates: RefugeeAggregate[] = [];
    const refugeeIds: string[] = [];

    // 1. Validasi & Buat seluruh domain aggregate terlebih dahulu (Atomic all-or-nothing check)
    for (let i = 0; i < input.members.length; i++) {
      const member = input.members[i];
      const memberOrigin = member.domicileOrigin?.trim() || input.defaultDomicileOrigin?.trim() || 'Wilayah Posko';
      const memberShelter = member.shelterLocation?.trim() || input.defaultShelterLocation?.trim() || 'Tenda Umum';

      const aggResult = RefugeeAggregate.create({
        id: asRefugeeId(crypto.randomUUID()),
        poskoId: asPoskoId(input.poskoId),
        fullName: member.fullName,
        nationalId: member.nationalId,
        gender: member.gender,
        age: member.age,
        domicileOrigin: memberOrigin,
        shelterLocation: memberShelter,
        missingKinName: member.missingKinName,
        vulnerabilities: member.vulnerabilities,
        urgentNeeds: member.urgentNeeds,
        registeredByUserId: input.registeredByUserId,
      });

      if (!aggResult.ok) {
        return Err(
          new DomainError(
            aggResult.error.code,
            `Gagal pada anggota ke-${i + 1} (${member.fullName || 'Tanpa Nama'}): ${aggResult.error.message}`,
            aggResult.error.status
          )
        );
      }

      createdAggregates.push(aggResult.value);
      refugeeIds.push(aggResult.value.toSnapshot().id);
    }

    // 2. Simpan secara batch ke Repository SQLite Lokal
    const saveResult = await this.refugeeRepo.saveBatch(createdAggregates);
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    // 3. Masukkan ke Transactional Outbox Queue untuk setiap warga
    for (const agg of createdAggregates) {
      await this.outboxRepo.enqueue({
        poskoId: asPoskoId(input.poskoId),
        topic: 'REFUGEE_INTAKE',
        payload: JSON.stringify(agg.toSnapshot()),
      });
    }

    // 4. Deteksi Temu Keluarga untuk setiap kerabat yang dicari
    let matchedKinCount = 0;
    for (const member of input.members) {
      if (member.missingKinName?.trim()) {
        const matchRes = await this.refugeeRepo.findMissingKinMatches(
          asPoskoId(input.poskoId),
          member.missingKinName.trim()
        );
        if (matchRes.ok) {
          matchedKinCount += matchRes.value.length;
        }
      }
    }

    return Ok({
      registeredCount: createdAggregates.length,
      refugeeIds,
      matchedKinCount,
    });
  }
}
