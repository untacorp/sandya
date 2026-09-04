import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '@/infrastructure/services/service-container';
import { createProblemResponse } from '@/shared/errors/problem-details';
import { asRefugeeId } from '@/core/shared/branded-types';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ refugeeId: string }> }
) {
  try {
    const { refugeeId } = await context.params;
    const container = ServiceContainer.getInstance();

    const result = await container.refugeeRepo.getEventsByRefugeeId(asRefugeeId(refugeeId));
    if (!result.ok) {
      return createProblemResponse({
        type: 'https://sanidya.id/errors/timeline-failed',
        title: 'Gagal Membaca Riwayat Peristiwa',
        status: 500,
        detail: result.error.message,
        code: result.error.code,
      });
    }

    return NextResponse.json({
      success: true,
      refugeeId,
      eventCount: result.value.length,
      timeline: result.value,
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
