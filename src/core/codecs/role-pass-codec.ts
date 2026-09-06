import { Ed25519Signer } from '@/core/crypto/ed25519-signer';
import { IsomorphicEd25519 } from '@/core/crypto/ed25519-isomorphic';
import { Result, Ok, Err, DomainError } from '@/core/shared/result';
import { StaffRole, isStaffRole } from '@/core/shared/roles';
import { HTTP_STATUS, TIME_CONSTANTS } from '@/core/shared/constants';

export interface RolePassPayload {
  orgId: string;
  orgName?: string;
  missionId: string;
  missionName?: string;
  poskoId: string;
  poskoName?: string;
  role: StaffRole;
  userId: string;
  userName: string;
  issuedAt: number;
  expiresAt: number;
}

export interface RolePassEnvelope {
  p: RolePassPayload;
  s: string; // Signature hex
  pk?: string; // Master public key hex (SPKI or Raw)
}

export const ROLE_PASS_CONSTANTS = {
  SHORT_ID_LENGTH: 4,
  DEFAULT_EXPIRATION_DAYS: 14,
  DEFAULT_EXPIRATION_MS: 14 * TIME_CONSTANTS.MS_PER_DAY,
  MIN_MANUAL_PARTS_COUNT: 3,
} as const;

export class RolePassCodec {
  /**
  * Menghasilkan string QR resmi bertanda tangan digital untuk Kartu Tugas Lapangan
  */
  public static issuePass(
  payload: RolePassPayload,
  masterPrivateKeyHex: string,
  masterPublicKeyHex?: string
  ): string {
  const jsonPayload = JSON.stringify(payload);
  let signatureHex = '';

  // If running in Node.js environment
  if (typeof process !== 'undefined' && process.versions?.node) {
  signatureHex = Ed25519Signer.signPayload(Buffer.from(jsonPayload, 'utf8'), masterPrivateKeyHex);
  }

  const envelope: RolePassEnvelope = {
  p: payload,
  s: signatureHex,
  ...(masterPublicKeyHex ? { pk: masterPublicKeyHex } : {}),
  };

  const serialized = JSON.stringify(envelope);
  const base64 = typeof Buffer !== 'undefined'
  ? Buffer.from(serialized, 'utf8').toString('base64')
  : btoa(unescape(encodeURIComponent(serialized)));

  return `SANDYA_PASS_V1:${base64}`;
  }

  /**
  * Menghasilkan string QR resmi bertanda tangan digital secara asinkron (WebCrypto compatible)
  */
  public static async issuePassAsync(
  payload: RolePassPayload,
  masterPrivateKeyHex: string,
  masterPublicKeyHex?: string
  ): Promise<string> {
  const jsonPayload = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const signatureHex = await IsomorphicEd25519.sign(encoder.encode(jsonPayload), masterPrivateKeyHex);

  const envelope: RolePassEnvelope = {
  p: payload,
  s: signatureHex,
  ...(masterPublicKeyHex ? { pk: masterPublicKeyHex } : {}),
  };

  const serialized = JSON.stringify(envelope);
  const base64 = typeof Buffer !== 'undefined'
  ? Buffer.from(serialized, 'utf8').toString('base64')
  : btoa(unescape(encodeURIComponent(serialized)));

  return `SANDYA_PASS_V1:${base64}`;
  }

  /**
  * Menghasilkan kode manual teks alfanumerik ringkas sebagai cadangan jika kamera rusak
  */
  public static generateManualCode(payload: RolePassPayload): string {
  const rolePrefix = payload.role === 'PETUGAS_MEDIS'
  ? 'MED'
  : payload.role === 'PETUGAS_LOGISTIK'
  ? 'LOG'
  : payload.role === 'RELAWAN_LAPANGAN'
  ? 'REL'
  : payload.role === 'KOORDINATOR_POSKO'
  ? 'KOR'
  : payload.role === 'KOMANDAN_MISI'
  ? 'MIS'
  : 'PIM';

  const shortPosko = (payload.poskoId || 'POS')
  .replace(/^POS-/, '')
  .toUpperCase();
  const shortUser = (payload.userId || 'USR')
  .replace(/^USR-/, '')
  .toUpperCase();
  return `SAN-${rolePrefix}-${shortPosko}-${shortUser}`;
  }

  /**
  * Memvalidasi dan mendekode QR Kartu Penugasan Petugas secara asinkron (Universal Web & Node)
  */
  public static async verifyAndDecodePass(
  qrOrCode: string,
  expectedOrgPubkey?: string
  ): Promise<Result<RolePassPayload, DomainError>> {
  const trimmed = qrOrCode.trim();

  // 1. Check for manual backup code format
  if (trimmed.startsWith('SAN-')) {
  const parts = trimmed.split('-');
  if (parts.length >= ROLE_PASS_CONSTANTS.MIN_MANUAL_PARTS_COUNT) {
  const roleCode = parts[1];
  let role: StaffRole = 'RELAWAN_LAPANGAN';
  if (roleCode === 'MED') role = 'PETUGAS_MEDIS';
  else if (roleCode === 'LOG') role = 'PETUGAS_LOGISTIK';
  else if (roleCode === 'KOR') role = 'KOORDINATOR_POSKO';
  else if (roleCode === 'MIS') role = 'KOMANDAN_MISI';
  else if (roleCode === 'PIM') role = 'PEMIMPIN_ORGANISASI';

  return Ok({
  orgId: 'ORG-LOCAL',
  missionId: 'MSN-LOCAL',
  poskoId: `POS-${parts[2] || '01'}`,
  role,
  userId: `USR-${parts[3] || 'MANUAL'}`,
  userName: `Petugas (${role.replace('_', ' ')})`,
  issuedAt: Date.now(),
  expiresAt: Date.now() + ROLE_PASS_CONSTANTS.DEFAULT_EXPIRATION_MS,
  });
  }
  }

  // 2. Standard QR code format
  if (!trimmed.startsWith('SANDYA_PASS_V1:')) {
  return Err(new DomainError('INVALID_PASS_FORMAT', 'Format QR Pass tidak dikenali.', HTTP_STATUS.BAD_REQUEST));
  }

  try {
  const base64Content = trimmed.replace('SANDYA_PASS_V1:', '');
  const rawJson = typeof Buffer !== 'undefined'
  ? Buffer.from(base64Content, 'base64').toString('utf8')
  : decodeURIComponent(escape(atob(base64Content)));

  const parsed = JSON.parse(rawJson) as RolePassEnvelope;
  const payload = parsed.p;
  const signatureHex = parsed.s;
  const pubkeyToVerify = expectedOrgPubkey || parsed.pk;

  if (!pubkeyToVerify) {
  return Err(
  new DomainError(
  'MISSING_PUBKEY',
  'Kunci publik organisasi tidak ditemukan untuk memverifikasi tanda tangan kartu.',
  HTTP_STATUS.BAD_REQUEST
  )
  );
  }

  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  const isValid = await IsomorphicEd25519.verify(payloadBytes, signatureHex, pubkeyToVerify);

  if (!isValid) {
  return Err(
  new DomainError(
  'FORGED_PASS',
  'Tanda tangan digital kartu tugas palsu atau tidak dikeluarkan oleh Master Key resmi.',
  HTTP_STATUS.UNAUTHORIZED
  )
  );
  }

  if (Date.now() > payload.expiresAt) {
  return Err(new DomainError('EXPIRED_PASS', 'Masa berlaku kartu penugasan telah berakhir.', HTTP_STATUS.FORBIDDEN));
  }

  return Ok(payload);
  } catch (e) {
  return Err(new DomainError('MALFORMED_PASS', `Gagal membaca isi pass: ${(e as Error).message}`, HTTP_STATUS.UNPROCESSABLE_ENTITY));
  }
  }

  /**
  * Synchronous decoder (digunakan untuk unit test Node.js kompatibilitas mundur)
  */
  public static verifyAndDecodePassSync(
  qrString: string,
  orgMasterPublicKeyHex: string
  ): Result<RolePassPayload, DomainError> {
  if (!qrString.startsWith('SANDYA_PASS_V1:')) {
  return Err(new DomainError('INVALID_PASS_FORMAT', 'Format QR Pass tidak dikenali.', HTTP_STATUS.BAD_REQUEST));
  }

  try {
  const base64Content = qrString.replace('SANDYA_PASS_V1:', '');
  const rawJson = Buffer.from(base64Content, 'base64').toString('utf8');
  const parsed = JSON.parse(rawJson) as RolePassEnvelope;

  const payload = parsed.p;
  const signatureHex = parsed.s;
  const pubkey = orgMasterPublicKeyHex || parsed.pk || '';

  const payloadBuf = Buffer.from(JSON.stringify(payload), 'utf8');
  const isValid = Ed25519Signer.verifySignature(payloadBuf, signatureHex, pubkey);

  if (!isValid) {
  return Err(
  new DomainError(
  'FORGED_PASS',
  'Tanda tangan digital kartu tugas palsu atau tidak dikeluarkan oleh Master Key organisasi resmi.',
  HTTP_STATUS.UNAUTHORIZED
  )
  );
  }

  if (Date.now() > payload.expiresAt) {
  return Err(new DomainError('EXPIRED_PASS', 'Masa berlaku kartu penugasan telah berakhir.', HTTP_STATUS.FORBIDDEN));
  }

  return Ok(payload);
  } catch (e) {
  return Err(new DomainError('MALFORMED_PASS', `Gagal membaca isi pass: ${(e as Error).message}`, HTTP_STATUS.UNPROCESSABLE_ENTITY));
  }
  }
}
