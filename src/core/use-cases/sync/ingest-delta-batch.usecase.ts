import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { IRefugeeRepository } from '@/core/domain/refugees/refugee.repository.interface';
import { RefugeeAggregate } from '@/core/domain/refugees/refugee.aggregate';
import { unpackManifestV4 } from '@/core/codecs/bitpacker-v4';
import { verifyEd25519Signature } from '@/core/crypto/ed25519-signer';
import { asRefugeeId, asPoskoId } from '@/core/shared/branded-types';

export interface IngestDeltaBatchInput {
  originPoskoId: string;
  senderPeerId: string;
  sequenceNumber: number;
  payloadBase64: string;
  signatureHex: string;
  originPublicKeyHex: string;
}

export interface IngestDeltaBatchOutput {
  ingestedCount: number;
  syncedSequence: number;
  poskoName: string;
}

export class IngestDeltaBatchUseCase {
  constructor(private readonly refugeeRepo: IRefugeeRepository) {}

  public async execute(input: IngestDeltaBatchInput): Promise<Result<IngestDeltaBatchOutput>> {
    // 1. Verifikasi tanda tangan kriptografis Ed25519
    const payloadBuffer = Buffer.from(input.payloadBase64, 'base64');
    const isValidSignature = await verifyEd25519Signature(
      payloadBuffer,
      input.signatureHex,
      input.originPublicKeyHex
    );

    if (!isValidSignature) {
      return Err(
        new DomainError(
          'INVALID_SIGNATURE',
          'Tanda tangan digital paket sinkronisasi tidak valid. Payload terindikasi rusak atau dimanipulasi.',
          401
        )
      );
    }

    // 2. Unpack Ultra-Dense Bitpacking v4
    let manifest;
    try {
      manifest = unpackManifestV4(payloadBuffer);
    } catch (e) {
      return Err(
        new DomainError(
          'MALFORMED_PAYLOAD',
          `Gagal mendekode payload biner Ultra-Dense v4: ${(e as Error).message}`,
          422
        )
      );
    }

    // 3. Konversi ke domain aggregates & simpan batch
    const aggregates: RefugeeAggregate[] = [];
    for (const p of manifest.persons) {
      const aggResult = RefugeeAggregate.create({
        id: asRefugeeId(crypto.randomUUID()),
        poskoId: asPoskoId(input.originPoskoId),
        fullName: p.fullName,
        nationalId: p.nationalId,
        gender: p.gender,
        age: p.age,
        domicileOrigin: p.domicileOrigin,
        shelterLocation: p.shelterLocation,
        missingKinName: p.missingKinName,
        registeredByUserId: input.senderPeerId,
      });

      if (aggResult.ok) {
        aggregates.push(aggResult.value);
      }
    }

    const saveBatchResult = await this.refugeeRepo.saveBatch(aggregates);
    if (!saveBatchResult.ok) {
      return Err(saveBatchResult.error);
    }

    return Ok({
      ingestedCount: saveBatchResult.value,
      syncedSequence: input.sequenceNumber,
      poskoName: manifest.poskoName,
    });
  }
}
