import { deflateSync, inflateSync } from "node:zlib";
import {
  tokenizeFullName,
  detokenizeFullName,
  NameWordToken,
} from "./name-dictionary";
import { BITWISE, RADIX, TIME_CONSTANTS } from "@/core/shared/constants";

export interface DisasterPerson {
  fullName: string;
  nationalId?: string; // 16-digit (opsional / null)
  gender: "M" | "F";
  age: number; // 0..127
  vulnerabilities: number; // bitmask uint8 (8 kategori kerentanan)
  urgentNeeds: number[]; // uint8 token IDs (0x01..0xFF)
  domicileOrigin?: string; // Dusun / Desa asal
  shelterLocation?: string; // Penampungan ("Kelas 2B", "Tenda 04", "GOR Sektor A")
  missingKinName?: string; // Nama keluarga yang terpisah & dicari
}

export interface DisasterManifestV4 {
  poskoName: string;
  defaultRegionCode: string; // 6 digit kode wilayah default (misal "320101")
  timestamp: number;
  persons: DisasterPerson[];
}

export const BITPACKER_CONSTANTS = {
  MANIFEST_MAGIC: "S4",
  MANIFEST_VERSION: 4,
  HEADER_SIZE: 3,
  DEFAULT_REGION_CODE: "320101",
  REGION_CODE_DIGITS: 6,
  REGION_CODE_BYTES: 3,
  NIK_LENGTH: 16,
  NIK_SUFFIX_DIGITS: 10,
  NIK_SAME_REGION_BYTES: 5,
  NIK_FULL_BYTES: 8,
  TOKEN_BYTES: 2,
  TIMESTAMP_BYTES: 4,
  PERSON_COUNT_BYTES: 2,
  MAX_AGE: 127,
  MIN_AGE: 0,
  ZLIB_COMPRESSION_LEVEL: 9,
  FLAG_HAS_NATIONAL_ID: 0x80,
  FLAG_IS_SAME_REGION: 0x40,
  FLAG_HAS_DOMICILE: 0x20,
  FLAG_HAS_SHELTER: 0x10,
  FLAG_HAS_MISSING_KIN: 0x08,
  GENDER_FEMALE_BIT: 0x80,
  AGE_MASK: 0x7f,
  TOKEN_TYPE_LITERAL_FLAG: 0x8000,
  TOKEN_ID_MASK: 0x7fff,
  SHIFT_16: 16,
  SHIFT_8: 8,
} as const;

/**
 * Serializer Ultra-Dense v4 dengan Dynamic Null-Field Bypass
 */
export function packManifestV4(manifest: DisasterManifestV4): Buffer {
  const chunks: Buffer[] = [];

  // 1. Header: Magic "S4" (Sandya v4) + Version 4 (1 byte)
  const headerBuf = Buffer.alloc(BITPACKER_CONSTANTS.HEADER_SIZE);
  headerBuf.write(BITPACKER_CONSTANTS.MANIFEST_MAGIC, 0, 2, "ascii");
  headerBuf.writeUInt8(BITPACKER_CONSTANTS.MANIFEST_VERSION, 2);
  chunks.push(headerBuf);

  // 2. Default Region Code (3 bytes uint24)
  const regInt = parseInt(manifest.defaultRegionCode || BITPACKER_CONSTANTS.DEFAULT_REGION_CODE, RADIX.DECIMAL);
  const regBuf = Buffer.alloc(BITPACKER_CONSTANTS.REGION_CODE_BYTES);
  regBuf.writeUInt8((regInt >> BITPACKER_CONSTANTS.SHIFT_16) & BITWISE.BYTE_MASK, 0);
  regBuf.writeUInt8((regInt >> BITPACKER_CONSTANTS.SHIFT_8) & BITWISE.BYTE_MASK, 1);
  regBuf.writeUInt8(regInt & BITWISE.BYTE_MASK, 2);
  chunks.push(regBuf);

  // 3. Posko Name & Timestamp
  const posNameBytes = Buffer.from(manifest.poskoName, "utf8");
  const posBuf = Buffer.alloc(
  1 + posNameBytes.length + BITPACKER_CONSTANTS.TIMESTAMP_BYTES + BITPACKER_CONSTANTS.PERSON_COUNT_BYTES
  );
  posBuf.writeUInt8(posNameBytes.length, 0);
  posNameBytes.copy(posBuf, 1);
  const timeOffset = 1 + posNameBytes.length;
  posBuf.writeUInt32BE(Math.floor(manifest.timestamp / TIME_CONSTANTS.MS_PER_SECOND), timeOffset);
  posBuf.writeUInt16BE(manifest.persons.length, timeOffset + BITPACKER_CONSTANTS.TIMESTAMP_BYTES);
  chunks.push(posBuf);

  // 4. Encode Setiap Data Pengungsi
  for (const p of manifest.persons) {
  const hasNationalId = Boolean(p.nationalId && p.nationalId.length === BITPACKER_CONSTANTS.NIK_LENGTH);
  const isSameRegion = hasNationalId && p.nationalId!.startsWith(manifest.defaultRegionCode);
  const hasDomicile = Boolean(p.domicileOrigin && p.domicileOrigin.trim().length > 0);
  const hasShelter = Boolean(p.shelterLocation && p.shelterLocation.trim().length > 0);
  const hasMissingKin = Boolean(p.missingKinName && p.missingKinName.trim().length > 0);

  const nameTokens = tokenizeFullName(p.fullName);
  const kinTokens = hasMissingKin ? tokenizeFullName(p.missingKinName!) : [];

  // Hitung ukuran biner nama
  let nameBytes = 0;
  for (const nt of nameTokens) {
  if (nt.type === "TOKEN") {
  nameBytes += BITPACKER_CONSTANTS.TOKEN_BYTES;
  } else {
  const strBuf = Buffer.from(nt.text, "utf8");
  nameBytes += BITPACKER_CONSTANTS.TOKEN_BYTES + strBuf.length;
  }
  }

  // Hitung ukuran biner NIK
  let nikBytes = 0;
  if (hasNationalId) {
  nikBytes = isSameRegion
  ? BITPACKER_CONSTANTS.NIK_SAME_REGION_BYTES
  : BITPACKER_CONSTANTS.NIK_FULL_BYTES;
  }

  // Hitung ukuran field opsional
  const domBytes = hasDomicile ? Buffer.from(p.domicileOrigin!, "utf8") : Buffer.alloc(0);
  const shlBytes = hasShelter ? Buffer.from(p.shelterLocation!, "utf8") : Buffer.alloc(0);

  let kinBytes = 0;
  for (const kt of kinTokens) {
  if (kt.type === "TOKEN") {
  kinBytes += BITPACKER_CONSTANTS.TOKEN_BYTES;
  } else {
  const strBuf = Buffer.from(kt.text, "utf8");
  kinBytes += BITPACKER_CONSTANTS.TOKEN_BYTES + strBuf.length;
  }
  }

  const recSize =
  1 + // Presence Flags 1 (hasNik, isSameRegion, hasDomicile, hasShelter, hasMissingKin, reserved)
  1 + // Presence Flags 2 (nameWordCount 4 bits, urgentNeedCount 4 bits)
  1 + // Gender & Age (1 byte)
  1 + // Vulnerabilities (1 byte bitmask)
  nikBytes +
  nameBytes +
  p.urgentNeeds.length * 1 + // 1 Byte per urgent need token (uint8)
  (hasDomicile ? 1 + domBytes.length : 0) +
  (hasShelter ? 1 + shlBytes.length : 0) +
  (hasMissingKin ? 1 + kinBytes : 0);

  const recBuf = Buffer.alloc(recSize);
  let offset = 0;

  // Byte 1: Field Presence Flags
  const f1 =
  (hasNationalId ? BITPACKER_CONSTANTS.FLAG_HAS_NATIONAL_ID : 0) |
  (isSameRegion ? BITPACKER_CONSTANTS.FLAG_IS_SAME_REGION : 0) |
  (hasDomicile ? BITPACKER_CONSTANTS.FLAG_HAS_DOMICILE : 0) |
  (hasShelter ? BITPACKER_CONSTANTS.FLAG_HAS_SHELTER : 0) |
  (hasMissingKin ? BITPACKER_CONSTANTS.FLAG_HAS_MISSING_KIN : 0);
  recBuf.writeUInt8(f1, offset);
  offset += 1;

  // Byte 2: Counters (nameTokenCount & needCount)
  const f2 =
  ((nameTokens.length & BITWISE.NIBBLE_MASK) << BITWISE.NIBBLE_SHIFT) |
  (p.urgentNeeds.length & BITWISE.NIBBLE_MASK);
  recBuf.writeUInt8(f2, offset);
  offset += 1;

  // Byte 3: Gender & Age
  const genderBit = p.gender === "F" ? BITPACKER_CONSTANTS.GENDER_FEMALE_BIT : 0x00;
  const ageVal = Math.min(BITPACKER_CONSTANTS.MAX_AGE, Math.max(BITPACKER_CONSTANTS.MIN_AGE, p.age));
  recBuf.writeUInt8(genderBit | (ageVal & BITPACKER_CONSTANTS.AGE_MASK), offset);
  offset += 1;

  // Byte 4: Vulnerabilities
  recBuf.writeUInt8(p.vulnerabilities & BITWISE.BYTE_MASK, offset);
  offset += 1;

  // NIK (0, 5, atau 8 bytes)
  if (hasNationalId) {
  if (isSameRegion) {
  const suffixStr = p.nationalId!.slice(BITPACKER_CONSTANTS.REGION_CODE_DIGITS);
  const suffixBig = BigInt(suffixStr);
  recBuf.writeUInt8(Number((suffixBig >> BITWISE.BIGINT_SHIFT_32) & BITWISE.BIGINT_BYTE_MASK), offset);
  recBuf.writeUInt32BE(Number(suffixBig & BITWISE.UINT32_MASK), offset + 1);
  offset += BITPACKER_CONSTANTS.NIK_SAME_REGION_BYTES;
  } else {
  recBuf.writeBigUInt64BE(BigInt(p.nationalId!), offset);
  offset += BITPACKER_CONSTANTS.NIK_FULL_BYTES;
  }
  }

  // Nama Tokenized
  for (const nt of nameTokens) {
  if (nt.type === "TOKEN") {
  recBuf.writeUInt16BE(nt.tokenId & BITPACKER_CONSTANTS.TOKEN_ID_MASK, offset);
  offset += BITPACKER_CONSTANTS.TOKEN_BYTES;
  } else {
  const strBuf = Buffer.from(nt.text, "utf8");
  recBuf.writeUInt16BE(BITPACKER_CONSTANTS.TOKEN_TYPE_LITERAL_FLAG | (strBuf.length & BITPACKER_CONSTANTS.TOKEN_ID_MASK), offset);
  offset += BITPACKER_CONSTANTS.TOKEN_BYTES;
  strBuf.copy(recBuf, offset);
  offset += strBuf.length;
  }
  }

  // Urgent Needs (uint8 per token)
  for (const needId of p.urgentNeeds) {
  recBuf.writeUInt8(needId & BITWISE.BYTE_MASK, offset);
  offset += 1;
  }

  // Domicile Origin (Opsional)
  if (hasDomicile) {
  recBuf.writeUInt8(domBytes.length, offset);
  offset += 1;
  domBytes.copy(recBuf, offset);
  offset += domBytes.length;
  }

  // Shelter Location (Opsional)
  if (hasShelter) {
  recBuf.writeUInt8(shlBytes.length, offset);
  offset += 1;
  shlBytes.copy(recBuf, offset);
  offset += shlBytes.length;
  }

  // Missing Kin Name (Opsional)
  if (hasMissingKin) {
  recBuf.writeUInt8(kinTokens.length, offset);
  offset += 1;
  for (const kt of kinTokens) {
  if (kt.type === "TOKEN") {
  recBuf.writeUInt16BE(kt.tokenId & BITPACKER_CONSTANTS.TOKEN_ID_MASK, offset);
  offset += BITPACKER_CONSTANTS.TOKEN_BYTES;
  } else {
  const strBuf = Buffer.from(kt.text, "utf8");
  recBuf.writeUInt16BE(BITPACKER_CONSTANTS.TOKEN_TYPE_LITERAL_FLAG | (strBuf.length & BITPACKER_CONSTANTS.TOKEN_ID_MASK), offset);
  offset += BITPACKER_CONSTANTS.TOKEN_BYTES;
  strBuf.copy(recBuf, offset);
  offset += strBuf.length;
  }
  }
  }

  chunks.push(recBuf);
  }

  return Buffer.concat(chunks);
}

/**
 * Deserializer Ultra-Dense v4
 */
export function unpackManifestV4(buffer: Buffer): DisasterManifestV4 {
  if (buffer.length < BITPACKER_CONSTANTS.HEADER_SIZE) throw new Error("Buffer terlalu kecil");

  const magic = buffer.toString("ascii", 0, 2);
  if (magic !== BITPACKER_CONSTANTS.MANIFEST_MAGIC) throw new Error(`Magic identifier tidak cocok: ${magic}`);

  const version = buffer.readUInt8(2);
  if (version !== BITPACKER_CONSTANTS.MANIFEST_VERSION) throw new Error(`Versi tidak didukung: ${version} (harap gunakan V4)`);

  let offset = BITPACKER_CONSTANTS.HEADER_SIZE;

  // Default Region Code
  const r0 = buffer.readUInt8(offset);
  const r1 = buffer.readUInt8(offset + 1);
  const r2 = buffer.readUInt8(offset + 2);
  offset += BITPACKER_CONSTANTS.REGION_CODE_BYTES;
  const defaultRegionCode = String((r0 << BITPACKER_CONSTANTS.SHIFT_16) | (r1 << BITPACKER_CONSTANTS.SHIFT_8) | r2).padStart(
  BITPACKER_CONSTANTS.REGION_CODE_DIGITS,
  "0"
  );

  // Posko Name
  const posNameLen = buffer.readUInt8(offset);
  offset += 1;
  const poskoName = buffer.toString("utf8", offset, offset + posNameLen);
  offset += posNameLen;

  // Timestamp & Person Count
  const timestamp = buffer.readUInt32BE(offset) * TIME_CONSTANTS.MS_PER_SECOND;
  offset += BITPACKER_CONSTANTS.TIMESTAMP_BYTES;
  const personCount = buffer.readUInt16BE(offset);
  offset += BITPACKER_CONSTANTS.PERSON_COUNT_BYTES;

  const persons: DisasterPerson[] = [];

  for (let i = 0; i < personCount; i++) {
  const f1 = buffer.readUInt8(offset);
  offset += 1;
  const hasNationalId = (f1 & BITPACKER_CONSTANTS.FLAG_HAS_NATIONAL_ID) !== 0;
  const isSameRegion = (f1 & BITPACKER_CONSTANTS.FLAG_IS_SAME_REGION) !== 0;
  const hasDomicile = (f1 & BITPACKER_CONSTANTS.FLAG_HAS_DOMICILE) !== 0;
  const hasShelter = (f1 & BITPACKER_CONSTANTS.FLAG_HAS_SHELTER) !== 0;
  const hasMissingKin = (f1 & BITPACKER_CONSTANTS.FLAG_HAS_MISSING_KIN) !== 0;

  const f2 = buffer.readUInt8(offset);
  offset += 1;
  const nameTokenCount = (f2 >> BITWISE.NIBBLE_SHIFT) & BITWISE.NIBBLE_MASK;
  const urgentNeedCount = f2 & BITWISE.NIBBLE_MASK;

  const b3 = buffer.readUInt8(offset);
  offset += 1;
  const gender = (b3 & BITPACKER_CONSTANTS.GENDER_FEMALE_BIT) !== 0 ? "F" : "M";
  const age = b3 & BITPACKER_CONSTANTS.AGE_MASK;

  const vulnerabilities = buffer.readUInt8(offset);
  offset += 1;

  // NIK
  let nationalId: string | undefined;
  if (hasNationalId) {
  if (isSameRegion) {
  const highByte = BigInt(buffer.readUInt8(offset));
  const low32 = BigInt(buffer.readUInt32BE(offset + 1));
  offset += BITPACKER_CONSTANTS.NIK_SAME_REGION_BYTES;
  const suffixVal = (highByte << BITWISE.BIGINT_SHIFT_32) | low32;
  const suffixStr = suffixVal.toString().padStart(BITPACKER_CONSTANTS.NIK_SUFFIX_DIGITS, "0");
  nationalId = `${defaultRegionCode}${suffixStr}`;
  } else {
  const nikBig = buffer.readBigUInt64BE(offset);
  offset += BITPACKER_CONSTANTS.NIK_FULL_BYTES;
  nationalId = nikBig.toString().padStart(BITPACKER_CONSTANTS.NIK_LENGTH, "0");
  }
  }

  // Nama
  const nameTokens: NameWordToken[] = [];
  for (let nt = 0; nt < nameTokenCount; nt++) {
  const val = buffer.readUInt16BE(offset);
  offset += BITPACKER_CONSTANTS.TOKEN_BYTES;
  if ((val & BITPACKER_CONSTANTS.TOKEN_TYPE_LITERAL_FLAG) === 0) {
  nameTokens.push({ type: "TOKEN", tokenId: val & BITPACKER_CONSTANTS.TOKEN_ID_MASK });
  } else {
  const strLen = val & BITPACKER_CONSTANTS.TOKEN_ID_MASK;
  const str = buffer.toString("utf8", offset, offset + strLen);
  offset += strLen;
  nameTokens.push({ type: "LITERAL", text: str });
  }
  }
  const fullName = detokenizeFullName(nameTokens);

  // Urgent Needs (uint8)
  const urgentNeeds: number[] = [];
  for (let un = 0; un < urgentNeedCount; un++) {
  urgentNeeds.push(buffer.readUInt8(offset));
  offset += 1;
  }

  // Domicile Origin
  let domicileOrigin: string | undefined;
  if (hasDomicile) {
  const dLen = buffer.readUInt8(offset);
  offset += 1;
  domicileOrigin = buffer.toString("utf8", offset, offset + dLen);
  offset += dLen;
  }

  // Shelter Location
  let shelterLocation: string | undefined;
  if (hasShelter) {
  const sLen = buffer.readUInt8(offset);
  offset += 1;
  shelterLocation = buffer.toString("utf8", offset, offset + sLen);
  offset += sLen;
  }

  // Missing Kin Name
  let missingKinName: string | undefined;
  if (hasMissingKin) {
  const kinCount = buffer.readUInt8(offset);
  offset += 1;
  const kTokens: NameWordToken[] = [];
  for (let kt = 0; kt < kinCount; kt++) {
  const val = buffer.readUInt16BE(offset);
  offset += BITPACKER_CONSTANTS.TOKEN_BYTES;
  if ((val & BITPACKER_CONSTANTS.TOKEN_TYPE_LITERAL_FLAG) === 0) {
  kTokens.push({ type: "TOKEN", tokenId: val & BITPACKER_CONSTANTS.TOKEN_ID_MASK });
  } else {
  const strLen = val & BITPACKER_CONSTANTS.TOKEN_ID_MASK;
  const str = buffer.toString("utf8", offset, offset + strLen);
  offset += strLen;
  kTokens.push({ type: "LITERAL", text: str });
  }
  }
  missingKinName = detokenizeFullName(kTokens);
  }

  persons.push({
  fullName,
  nationalId,
  gender,
  age,
  vulnerabilities,
  urgentNeeds,
  domicileOrigin,
  shelterLocation,
  missingKinName,
  });
  }

  return {
  poskoName,
  defaultRegionCode,
  timestamp,
  persons,
  };
}

export function compressManifestV4(buffer: Buffer): Buffer {
  return deflateSync(buffer, { level: BITPACKER_CONSTANTS.ZLIB_COMPRESSION_LEVEL });
}

export function decompressManifestV4(compressed: Buffer): Buffer {
  return inflateSync(compressed);
}
