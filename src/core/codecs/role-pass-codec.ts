import { Ed25519Signer } from '@/core/crypto/ed25519-signer';
import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { StaffRole } from '@/core/shared/roles';

export interface RolePassPayload {
  orgId: string;
  missionId: string;
  poskoId: string;
  role: StaffRole;
  userId: string;
  userName: string;
  issuedAt: number;
  expiresAt: number;
}

export class RolePassCodec {
  /**
   * Menghasilkan string QR terenkripsi/bertanda-tangan untuk Kartu Penugasan Lapangan
   */
  public static issuePass(
    payload: RolePassPayload,
    masterPrivateKeyHex: string
  ): string {
    const jsonPayload = JSON.stringify(payload);
    const signatureHex = Ed25519Signer.signPayload(Buffer.from(jsonPayload, 'utf8'), masterPrivateKeyHex);

    const fullObj = {
      p: payload,
      s: signatureHex,
    };

    return `SANIDYA_PASS_V1:${Buffer.from(JSON.stringify(fullObj)).toString('base64')}`;
  }

  /**
   * Memvalidasi dan mendekode QR Kartu Penugasan Petugas
   */
  public static verifyAndDecodePass(
    qrString: string,
    orgMasterPublicKeyHex: string
  ): Result<RolePassPayload, DomainError> {
    if (!qrString.startsWith('SANIDYA_PASS_V1:')) {
      return Err(new DomainError('INVALID_PASS_FORMAT', 'Format QR Pass tidak dikenali.', 400));
    }

    try {
      const base64Content = qrString.replace('SANIDYA_PASS_V1:', '');
      const rawJson = Buffer.from(base64Content, 'base64').toString('utf8');
      const parsed = JSON.parse(rawJson);

      const payload: RolePassPayload = parsed.p;
      const signatureHex: string = parsed.s;

      const payloadBuf = Buffer.from(JSON.stringify(payload), 'utf8');
      const isValid = Ed25519Signer.verifySignature(payloadBuf, signatureHex, orgMasterPublicKeyHex);

      if (!isValid) {
        return Err(
          new DomainError(
            'FORGED_PASS',
            'Tanda tangan digital kartu tugas palsu atau tidak dikeluarkan oleh Master Key organisasi resmi.',
            401
          )
        );
      }

      if (Date.now() > payload.expiresAt) {
        return Err(new DomainError('EXPIRED_PASS', 'Masa berlaku kartu penugasan telah berakhir.', 403));
      }

      return Ok(payload);
    } catch (e) {
      return Err(new DomainError('MALFORMED_PASS', `Gagal membaca isi pass: ${(e as Error).message}`, 422));
    }
  }
}
