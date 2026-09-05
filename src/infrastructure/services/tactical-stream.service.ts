import { TacticalMessageEntity, TacticalMessageProps } from '@/core/domain/tactical/tactical.aggregate';

type MessageSubscriber = (msg: TacticalMessageProps) => void;

export const TACTICAL_STREAM_CONSTANTS = {
  MAX_IN_MEMORY_HISTORY: 200,
  DEFAULT_HISTORY_LIMIT: 50,
} as const;

export class TacticalStreamService {
  private subscribers = new Set<MessageSubscriber>();
  private messageHistory: TacticalMessageProps[] = [];

  /**
  * Menambahkan subscriber untuk menerima stream pesan taktis secara real-time
  */
  public subscribe(callback: MessageSubscriber): () => void {
  this.subscribers.add(callback);
  return () => {
  this.subscribers.delete(callback);
  };
  }

  /**
  * Memancarkan pesan baru ke seluruh subscriber yang terhubung
  */
  public broadcast(message: TacticalMessageEntity): void {
  const props = message.props;
  this.messageHistory.push(props);

  // Batasi histori in-memory maksimal 200 pesan terakhir
  if (this.messageHistory.length > TACTICAL_STREAM_CONSTANTS.MAX_IN_MEMORY_HISTORY) {
  this.messageHistory.shift();
  }

  for (const sub of this.subscribers) {
  try {
  sub(props);
  } catch (err) {
  console.error('Error dispatching message to tactical subscriber:', err);
  }
  }
  }

  /**
  * Mengambil riwayat pesan taktis berdasarkan channel
  */
  public getHistory(
  channel?: string,
  limit: number = TACTICAL_STREAM_CONSTANTS.DEFAULT_HISTORY_LIMIT
  ): TacticalMessageProps[] {
  let filtered = this.messageHistory;
  if (channel && channel !== 'ALL') {
  filtered = this.messageHistory.filter((m) => m.channel === channel);
  }
  return filtered.slice(-limit);
  }
}
