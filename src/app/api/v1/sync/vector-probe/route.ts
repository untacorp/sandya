import { NextRequest, NextResponse } from 'next/server';
import { VectorProbeSchema } from '@/shared/contracts/api-contracts';
import { ServiceContainer } from '@/infrastructure/services/service-container';
import { createProblemResponse } from '@/shared/errors/problem-details';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = VectorProbeSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return createProblemResponse({
        type: 'https://sanidya.id/errors/invalid-probe',
        title: 'Format Vector Probe Tidak Valid',
        status: 422,
        detail: 'Data probe vector clock tidak sesuai spesifikasi.',
        code: 'INVALID_PROBE',
        invalidParams: parseResult.error.issues.map((i) => ({
          field: i.path.join('.'),
          reason: i.message,
        })),
      });
    }

    const { probeNodeId, clocks } = parseResult.data;
    const container = ServiceContainer.getInstance();

    // Komparasi sequence lokal vs remote probe untuk menghitung delta
    const deltaRequirements: Record<string, { fromSeq: number; toSeq: number }> = {};

    // Cek perbedaan clock
    for (const [poskoId, claimedSeq] of Object.entries(clocks)) {
      // Misal: jika local sequence kita lebih rendah dari remote, minta delta
      // Untuk probe handshake, kita kembalikan acknowledgments
    }

    return NextResponse.json({
      success: true,
      probeNodeId,
      status: 'HANDSHAKE_ACKNOWLEDGED',
      serverTimestamp: Date.now(),
      deltaRequired: Object.keys(deltaRequirements).length > 0,
      deltaRequests: deltaRequirements,
    });
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
