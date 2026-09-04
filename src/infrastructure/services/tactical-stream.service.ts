import { TacticalMessageEntity, TacticalMessageProps } from '@/core/domain/tactical/tactical.aggregate';

type MessageSubscriber = (msg: TacticalMessageProps) => void;

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
    if (this.messageHistory.length > 200) {
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
  public getHistory(channel?: string, limit: number = 50): TacticalMessageProps[] {
    let filtered = this.messageHistory;
    if (channel && channel !== 'ALL') {
      filtered = this.messageHistory.filter((m) => m.channel === channel);
    }
    return filtered.slice(-limit);
  }
}
