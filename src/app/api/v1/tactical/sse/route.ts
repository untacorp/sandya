import { NextRequest } from 'next/server';
import { ServiceContainer } from '@/infrastructure/services/service-container';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const container = ServiceContainer.getInstance();
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();

  // Kirim initial connection handshake event
  const initialData = `data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`;
  await writer.write(encoder.encode(initialData));

  // Subscribe ke tactical stream
  const unsubscribe = container.tacticalStreamService.subscribe(async (msg) => {
  try {
  const payload = `data: ${JSON.stringify({ type: 'MESSAGE', data: msg })}\n\n`;
  await writer.write(encoder.encode(payload));
  } catch {
  // Stream ditutup oleh klien
  }
  });

  // Handle connection close
  req.signal.addEventListener('abort', () => {
  unsubscribe();
  writer.close().catch(() => {});
  });

  return new Response(responseStream.readable, {
  headers: {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  },
  });
}
