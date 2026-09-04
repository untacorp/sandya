import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { PeerId, PoskoId } from '@/core/shared/branded-types';

export type TacticalChannel = 'POSKO_ALL' | 'MEDIS' | 'LOGISTIK' | 'SOS' | 'DM';
export type MessageContentType = 'TEXT' | 'VOICE_NOTE' | 'ALERT';

export interface TacticalMessageProps {
  id: string;
  channel: TacticalChannel;
  senderPeerId: PeerId;
  senderName: string;
  senderRole: string;
  recipientPeerId?: PeerId | null | undefined;
  contentType: MessageContentType;
  textContent?: string | null | undefined;
  audioBase64?: string | null | undefined;
  audioDurationMs?: number | undefined;
  isUrgent: boolean;
  createdAt: number;
}

export class TacticalMessageEntity {
  private constructor(public readonly props: TacticalMessageProps) {}

  public static create(
    senderPeerId: PeerId,
    senderName: string,
    senderRole: string,
    channel: TacticalChannel,
    contentType: MessageContentType,
    content: {
      textContent?: string | null;
      audioBase64?: string | null;
      audioDurationMs?: number;
      isUrgent?: boolean;
      recipientPeerId?: PeerId | null;
    }
  ): Result<TacticalMessageEntity, DomainError> {
    // 1. Invarian Guest Isolation: Guest / Warga Tamu tidak boleh memancarkan ke saluran apa pun
    if (senderRole === 'PUBLIC_GUEST' || senderRole === 'WARGA_TAMU') {
      return Err(
        new DomainError(
          'GUEST_MUTED',
          'Mode Tamu/Warga tidak memiliki izin untuk memancarkan pesan ke saluran taktis lapangan.',
          403
        )
      );
    }

    // 2. Invarian Saluran Medis: Hanya peran MEDIS & KOORDINATOR / PIMPINAN
    const isMedicalAuthorized = [
      'MEDIS',
      'PETUGAS_MEDIS',
      'KOORDINATOR',
      'KOORDINATOR_POSKO',
      'PEMIMPIN_ORGANISASI',
      'KOMANDAN_MISI',
    ].includes(senderRole);

    if (channel === 'MEDIS' && !isMedicalAuthorized) {
      return Err(
        new DomainError('CHANNEL_RESTRICTED', 'Saluran #medis hanya untuk Tim Medis dan Koordinator.', 403)
      );
    }

    // 3. Invarian Saluran Logistik: Hanya peran LOGISTIK & KOORDINATOR / PIMPINAN
    const isLogisticsAuthorized = [
      'LOGISTIK',
      'PETUGAS_LOGISTIK',
      'KOORDINATOR',
      'KOORDINATOR_POSKO',
      'PEMIMPIN_ORGANISASI',
      'KOMANDAN_MISI',
    ].includes(senderRole);

    if (channel === 'LOGISTIK' && !isLogisticsAuthorized) {
      return Err(
        new DomainError('CHANNEL_RESTRICTED', 'Saluran #logistik hanya untuk Petugas Logistik dan Koordinator.', 403)
      );
    }

    // 4. Invarian Durasi Audio PTT: Maksimal 5 detik
    if (contentType === 'VOICE_NOTE') {
      if (!content.audioBase64) {
        return Err(new DomainError('MISSING_AUDIO', 'Payload rekaman suara PTT tidak ditemukan.', 422));
      }
      if (content.audioDurationMs && content.audioDurationMs > 5000) {
        return Err(
          new DomainError('AUDIO_TOO_LONG', 'Durasi Push-to-Talk dibatasi maksimal 5.000 milidetik (5 detik).', 422)
        );
      }
    }

    const message = new TacticalMessageEntity({
      id: crypto.randomUUID(),
      channel,
      senderPeerId,
      senderName,
      senderRole,
      recipientPeerId: content.recipientPeerId ?? null,
      contentType,
      textContent: content.textContent ?? null,
      audioBase64: content.audioBase64 ?? null,
      audioDurationMs: content.audioDurationMs ?? 0,
      isUrgent: channel === 'SOS' || Boolean(content.isUrgent),
      createdAt: Date.now(),
    });

    return Ok(message);
  }
}
