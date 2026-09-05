import {
  generateKeyPairSync,
  sign,
  verify,
  createPrivateKey,
  createPublicKey,
  KeyObject,
} from 'node:crypto';

export interface KeyPairResult {
  publicKeyHex: string;
  privateKeyHex: string;
}

export class Ed25519Signer {
  /**
  * Menghasilkan pasangan kunci Ed25519 baru
  */
  public static generateKeyPair(): KeyPairResult {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
  publicKeyEncoding: { type: 'spki', format: 'der' },
  privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  return {
  publicKeyHex: publicKey.toString('hex'),
  privateKeyHex: privateKey.toString('hex'),
  };
  }

  /**
  * Menandatangani payload biner menggunakan private key DER hex
  */
  public static signPayload(payload: Buffer, privateKeyHex: string): string {
  const privKeyDer = Buffer.from(privateKeyHex, 'hex');
  const privateKeyObj = createPrivateKey({
  key: privKeyDer,
  format: 'der',
  type: 'pkcs8',
  });

  const signature = sign(null, payload, privateKeyObj);
  return signature.toString('hex');
  }

  /**
  * Memverifikasi tanda tangan kriptografis dari payload biner
  */
  public static verifySignature(
  payload: Buffer,
  signatureHex: string,
  publicKeyHex: string
  ): boolean {
  try {
  const pubKeyDer = Buffer.from(publicKeyHex, 'hex');
  const publicKeyObj = createPublicKey({
  key: pubKeyDer,
  format: 'der',
  type: 'spki',
  });

  const signatureBuf = Buffer.from(signatureHex, 'hex');
  return verify(null, payload, publicKeyObj, signatureBuf);
  } catch {
  return false;
  }
  }
}

export async function verifyEd25519Signature(
  payload: Buffer,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  return Ed25519Signer.verifySignature(payload, signatureHex, publicKeyHex);
}
