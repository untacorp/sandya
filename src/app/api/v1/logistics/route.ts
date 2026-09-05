import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '@/infrastructure/services/service-container';
import { createProblemResponse } from '@/shared/errors/problem-details';
import { asPoskoId } from '@/core/shared/branded-types';
import { HTTP_STATUS } from '@/core/shared/constants';

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const poskoId = searchParams.get('poskoId') || 'posko-demo-001';
  const container = ServiceContainer.getInstance();

  const result = await container.inventoryRepo.findByPoskoId(asPoskoId(poskoId));
  if (!result.ok) {
  return createProblemResponse({
  type: 'https://sandya.id/errors/db-query-failed',
  title: 'Gagal Membaca Data Stok Logistik',
  status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  detail: result.error.message,
  code: result.error.code,
  });
  }

  const snapshots = result.value.map((i) => i.toSnapshot());
  return NextResponse.json({
  success: true,
  count: snapshots.length,
  data: snapshots,
  });
  } catch (error) {
  return createProblemResponse({
  type: 'https://sandya.id/errors/server-error',
  title: 'Kesalahan Server Internal',
  status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  detail: (error as Error).message,
  code: 'SERVER_ERROR',
  });
  }
}
