import { NextRequest, NextResponse } from 'next/server';
import { IngestPacketSchema } from '@/shared/contracts/api-contracts';
import { ServiceContainer } from '@/infrastructure/services/service-container';
import { createProblemResponse } from '@/shared/errors/problem-details';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = IngestPacketSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return createProblemResponse({
        type: 'https://sanidya.id/errors/invalid-payload',
        title: 'Format Paket Tidak Valid',
        status: 422,
        detail: 'Payload paket sinkronisasi tidak sesuai skema biner resmi.',
        code: 'INVALID_PACKET_PAYLOAD',
        invalidParams: parseResult.error.issues.map((i) => ({
          field: i.path.join('.'),
          reason: i.message,
        })),
      });
    }

    const packet = parseResult.data;
    const originPublicKeyHex = req.headers.get('x-origin-pubkey') || '';

    if (!originPublicKeyHex) {
      return createProblemResponse({
        type: 'https://sanidya.id/errors/missing-public-key',
        title: 'Public Key Posko Pengirim Wajib Disertakan',
        status: 400,
        detail: 'Header X-Origin-Pubkey diperlukan untuk memvalidasi tanda tangan digital paket.',
        code: 'MISSING_PUBKEY',
      });
    }

    const container = ServiceContainer.getInstance();
    const result = await container.ingestDeltaBatchUseCase.execute({
      originPoskoId: packet.originPosId,
      senderPeerId: packet.senderPeerId,
      sequenceNumber: packet.sequenceNumber,
      payloadBase64: packet.payloadBase64,
      signatureHex: packet.signatureHex,
      originPublicKeyHex,
    });

    if (!result.ok) {
      return createProblemResponse({
        type: 'https://sanidya.id/errors/ingest-failed',
        title: 'Gagal Memproses Paket Sinkronisasi',
        status: result.error.status || 400,
        detail: result.error.message,
        code: result.error.code,
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: result.value,
      },
      { status: 200 }
    );
  } catch (error) {
    return createProblemResponse({
      type: 'https://sanidya.id/errors/server-error',
      title: 'Kesalahan Server Internal',
      status: 500,
      detail: (error as Error).message,
      code: 'SERVER_ERROR',
    });
  }
}
