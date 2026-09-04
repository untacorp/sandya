import { NextRequest, NextResponse } from 'next/server';
import { MutateStockSchema } from '@/shared/contracts/api-contracts';
import { ServiceContainer } from '@/infrastructure/services/service-container';
import { createProblemResponse } from '@/shared/errors/problem-details';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = MutateStockSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return createProblemResponse({
        type: 'https://sanidya.id/errors/invalid-input',
        title: 'Format Input Mutasi Tidak Valid',
        status: 422,
        detail: 'Data mutasi stok logistik tidak memenuhi validasi skema.',
        code: 'VALIDATION_FAILED',
        invalidParams: parseResult.error.issues.map((i) => ({
          field: i.path.join('.'),
          reason: i.message,
        })),
      });
    }

    const data = parseResult.data;
    const officerRole = req.headers.get('x-user-role') || 'LOGISTIK';
    const officerId = req.headers.get('x-user-id') || 'officer-001';

    const container = ServiceContainer.getInstance();
    const result = await container.mutateStockUseCase.execute({
      poskoId: data.posId,
      itemId: data.itemId,
      officerId,
      officerRole,
      txType: data.txType,
      quantityChange: data.quantityChange,
      logicalSeq: Date.now(),
      referenceTicketId: data.referenceTicketId,
      notes: data.notes,
    });

    if (!result.ok) {
      return createProblemResponse({
        type: 'https://sanidya.id/errors/stock-mutation-failed',
        title: 'Mutasi Stok Gagal Dilakukan',
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
