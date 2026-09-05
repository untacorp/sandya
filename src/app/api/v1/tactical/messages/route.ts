import { NextRequest, NextResponse } from 'next/server';
import { TacticalMessageSchema } from '@/shared/contracts/api-contracts';
import { ServiceContainer } from '@/infrastructure/services/service-container';
import { createProblemResponse } from '@/shared/errors/problem-details';
import { TacticalMessageEntity } from '@/core/domain/tactical/tactical.aggregate';
import { asPeerId } from '@/core/shared/branded-types';
import { HTTP_STATUS } from '@/core/shared/constants';

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const channel = searchParams.get('channel') || 'ALL';
  const container = ServiceContainer.getInstance();

  const history = container.tacticalStreamService.getHistory(channel);
  return NextResponse.json({
  success: true,
  count: history.length,
  messages: history,
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

export async function POST(req: NextRequest) {
  try {
  const rawBody = await req.json();
  const parseResult = TacticalMessageSchema.safeParse(rawBody);

  if (!parseResult.success) {
  return createProblemResponse({
  type: 'https://sandya.id/errors/invalid-message',
  title: 'Format Pesan Taktis Tidak Valid',
  status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
  detail: 'Data pesan taktis radio tidak memenuhi validasi skema.',
  code: 'VALIDATION_FAILED',
  invalidParams: parseResult.error.issues.map((i) => ({
  field: i.path.join('.'),
  reason: i.message,
  })),
  });
  }

  const data = parseResult.data;
  const senderPeerId = asPeerId(req.headers.get('x-peer-id') || 'peer-local-001');
  const senderName = req.headers.get('x-user-name') || 'Relawan Lapangan';
  const senderRole = req.headers.get('x-user-role') || 'RELAWAN';

  const entityResult = TacticalMessageEntity.create(
  senderPeerId,
  senderName,
  senderRole,
  data.channel,
  data.contentType,
  {
  textContent: data.textContent,
  audioBase64: data.audioBase64,
  audioDurationMs: data.audioDurationMs,
  isUrgent: data.isUrgent,
  recipientPeerId: data.recipientPeerId ? asPeerId(data.recipientPeerId) : null,
  }
  );

  if (!entityResult.ok) {
  return createProblemResponse({
  type: 'https://sandya.id/errors/message-forbidden',
  title: 'Pesan Taktis Ditolak',
  status: entityResult.error.status || HTTP_STATUS.FORBIDDEN,
  detail: entityResult.error.message,
  code: entityResult.error.code,
  });
  }

  const messageEntity = entityResult.value;
  const container = ServiceContainer.getInstance();
  container.tacticalStreamService.broadcast(messageEntity);

  return NextResponse.json(
  {
  success: true,
  data: messageEntity.props,
  },
  { status: HTTP_STATUS.CREATED }
  );
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
