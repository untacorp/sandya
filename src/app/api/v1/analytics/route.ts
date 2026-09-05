import { NextRequest, NextResponse } from 'next/server';
import { ServiceContainer } from '@/infrastructure/services/service-container';
import { createProblemResponse } from '@/shared/errors/problem-details';
import { HTTP_STATUS } from '@/core/shared/constants';

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const poskoId = searchParams.get('poskoId') || 'ALL';
  const container = ServiceContainer.getInstance();

  const [triageHeatmap, burnRateForecast, reunionMatches] = await Promise.all([
  container.analyticsService.getTriageHeatmap(poskoId),
  container.analyticsService.getInventoryBurnRate(poskoId),
  container.analyticsService.getFamilyReunionMatches(poskoId),
  ]);

  return NextResponse.json({
  success: true,
  poskoId,
  triageHeatmap,
  burnRateForecast,
  reunionMatches,
  generatedAt: Date.now(),
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
