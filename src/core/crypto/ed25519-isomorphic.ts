import { RADIX } from '@/core/shared/constants';

/**
 * Isomorphic Ed25519 Cryptographic Module
 * Bekerja di Web Browser (Web Crypto API `crypto.subtle`), Node.js, dan Tauri Desktop/Mobile
 */

export interface KeyPairResult {
  publicKeyHex: string; // SPKI format or Raw 32-byte hex
  privateKeyHex: string; // PKCS8 format 48-byte hex
  rawPublicKeyHex: string; // Clean 32-byte hex for display / QR payload
}

export const ED25519_CONSTANTS = {
  HEX_CHARS_PER_BYTE: 2,
  HEX_PAD_LENGTH: 2,
  RAW_PUBLIC_KEY_BYTES: 32,
} as const;

function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  const len = cleanHex.length;
  const bytes = new Uint8Array(len / ED25519_CONSTANTS.HEX_CHARS_PER_BYTE);
  for (let i = 0; i < len; i += ED25519_CONSTANTS.HEX_CHARS_PER_BYTE) {
  bytes[i / ED25519_CONSTANTS.HEX_CHARS_PER_BYTE] = parseInt(
  cleanHex.substring(i, i + ED25519_CONSTANTS.HEX_CHARS_PER_BYTE),
  RADIX.HEXADECIMAL
  );
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
  hex += bytes[i]!.toString(RADIX.HEXADECIMAL).padStart(ED25519_CONSTANTS.HEX_PAD_LENGTH, '0');
  }
  return hex;
}

export class IsomorphicEd25519 {
  /**
  * Menghasilkan pasangan kunci Ed25519 baru secara asinkron
  */
  public static async generateKeyPair(): Promise<KeyPairResult> {
  const keyPair = await globalThis.crypto.subtle.generateKey(
  { name: 'Ed25519' },
  true,
  ['sign', 'verify']
  );

  const spkiBuffer = await globalThis.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const rawBuffer = await globalThis.crypto.subtle.exportKey('raw', keyPair.publicKey);
  const pkcs8Buffer = await globalThis.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
  publicKeyHex: bytesToHex(new Uint8Array(spkiBuffer)),
  privateKeyHex: bytesToHex(new Uint8Array(pkcs8Buffer)),
  rawPublicKeyHex: bytesToHex(new Uint8Array(rawBuffer)),
  };
  }

  /**
  * Menandatangani payload menggunakan private key PKCS8 hex
  */
  public static async sign(payload: Uint8Array, privateKeyHex: string): Promise<string> {
  const privBytes = hexToBytes(privateKeyHex);
  const privateKey = await globalThis.crypto.subtle.importKey(
  'pkcs8',
  privBytes as unknown as BufferSource,
  { name: 'Ed25519' },
  true,
  ['sign']
  );

  const signature = await globalThis.crypto.subtle.sign(
  { name: 'Ed25519' },
  privateKey,
  payload as unknown as BufferSource
  );

  return bytesToHex(new Uint8Array(signature));
  }

  /**
  * Memverifikasi tanda tangan digital dari payload
  * Mendukung public key berformat SPKI DER hex (44B) maupun RAW hex (32B)
  */
  public static async verify(
  payload: Uint8Array,
  signatureHex: string,
  publicKeyHex: string
  ): Promise<boolean> {
  try {
  const pubBytes = hexToBytes(publicKeyHex);
  const format: 'spki' | 'raw' = pubBytes.length === ED25519_CONSTANTS.RAW_PUBLIC_KEY_BYTES ? 'raw' : 'spki';

  const publicKey = await globalThis.crypto.subtle.importKey(
  format,
  pubBytes as unknown as BufferSource,
  { name: 'Ed25519' },
  true,
  ['verify']
  );

  const sigBytes = hexToBytes(signatureHex);
  return await globalThis.crypto.subtle.verify(
  { name: 'Ed25519' },
  publicKey,
  sigBytes as unknown as BufferSource,
  payload as unknown as BufferSource
  );
  } catch {
  return false;
  }
  }
}
