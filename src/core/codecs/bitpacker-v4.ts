import { deflateSync, inflateSync } from "node:zlib";
import {
  tokenizeFullName,
  detokenizeFullName,
  NameWordToken,
} from "./name-dictionary";

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

/**
 * Serializer Ultra-Dense v4 dengan Dynamic Null-Field Bypass
 */
export function packManifestV4(manifest: DisasterManifestV4): Buffer {
  const chunks: Buffer[] = [];

  // 1. Header: Magic "S4" (Sanidya v4) + Version 4 (1 byte)
  const headerBuf = Buffer.alloc(3);
  headerBuf.write("S4", 0, 2, "ascii");
  headerBuf.writeUInt8(4, 2);
  chunks.push(headerBuf);

  // 2. Default Region Code (3 bytes uint24)
  const regInt = parseInt(manifest.defaultRegionCode || "320101", 10);
  const regBuf = Buffer.alloc(3);
  regBuf.writeUInt8((regInt >> 16) & 0xff, 0);
  regBuf.writeUInt8((regInt >> 8) & 0xff, 1);
  regBuf.writeUInt8(regInt & 0xff, 2);
  chunks.push(regBuf);

  // 3. Posko Name & Timestamp
  const posNameBytes = Buffer.from(manifest.poskoName, "utf8");
  const posBuf = Buffer.alloc(1 + posNameBytes.length + 4 + 2);
  posBuf.writeUInt8(posNameBytes.length, 0);
  posNameBytes.copy(posBuf, 1);
  const timeOffset = 1 + posNameBytes.length;
  posBuf.writeUInt32BE(Math.floor(manifest.timestamp / 1000), timeOffset);
  posBuf.writeUInt16BE(manifest.persons.length, timeOffset + 4);
  chunks.push(posBuf);

  // 4. Encode Setiap Data Pengungsi
  for (const p of manifest.persons) {
    const hasNationalId = Boolean(p.nationalId && p.nationalId.length === 16);
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
        nameBytes += 2;
      } else {
        const strBuf = Buffer.from(nt.text, "utf8");
        nameBytes += 2 + strBuf.length;
      }
    }

    // Hitung ukuran biner NIK
    let nikBytes = 0;
    if (hasNationalId) {
      nikBytes = isSameRegion ? 5 : 8;
    }

    // Hitung ukuran field opsional
    const domBytes = hasDomicile ? Buffer.from(p.domicileOrigin!, "utf8") : Buffer.alloc(0);
    const shlBytes = hasShelter ? Buffer.from(p.shelterLocation!, "utf8") : Buffer.alloc(0);

    let kinBytes = 0;
    for (const kt of kinTokens) {
      if (kt.type === "TOKEN") {
        kinBytes += 2;
      } else {
        const strBuf = Buffer.from(kt.text, "utf8");
        kinBytes += 2 + strBuf.length;
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
      (hasNationalId ? 0x80 : 0) |
      (isSameRegion ? 0x40 : 0) |
      (hasDomicile ? 0x20 : 0) |
      (hasShelter ? 0x10 : 0) |
      (hasMissingKin ? 0x08 : 0);
    recBuf.writeUInt8(f1, offset);
    offset += 1;

    // Byte 2: Counters (nameTokenCount & needCount)
    const f2 =
      ((nameTokens.length & 0x0f) << 4) |
      (p.urgentNeeds.length & 0x0f);
    recBuf.writeUInt8(f2, offset);
    offset += 1;

    // Byte 3: Gender & Age
    const genderBit = p.gender === "F" ? 0x80 : 0x00;
    const ageVal = Math.min(127, Math.max(0, p.age));
    recBuf.writeUInt8(genderBit | (ageVal & 0x7f), offset);
    offset += 1;

    // Byte 4: Vulnerabilities
    recBuf.writeUInt8(p.vulnerabilities & 0xff, offset);
    offset += 1;

    // NIK (0, 5, atau 8 bytes)
    if (hasNationalId) {
      if (isSameRegion) {
        const suffixStr = p.nationalId!.slice(6);
        const suffixBig = BigInt(suffixStr);
        recBuf.writeUInt8(Number((suffixBig >> 32n) & 0xffn), offset);
        recBuf.writeUInt32BE(Number(suffixBig & 0xffffffffn), offset + 1);
        offset += 5;
      } else {
        recBuf.writeBigUInt64BE(BigInt(p.nationalId!), offset);
        offset += 8;
      }
    }

    // Nama Tokenized
    for (const nt of nameTokens) {
      if (nt.type === "TOKEN") {
        recBuf.writeUInt16BE(nt.tokenId & 0x7fff, offset);
        offset += 2;
      } else {
        const strBuf = Buffer.from(nt.text, "utf8");
        recBuf.writeUInt16BE(0x8000 | (strBuf.length & 0x7fff), offset);
        offset += 2;
        strBuf.copy(recBuf, offset);
        offset += strBuf.length;
      }
    }

    // Urgent Needs (uint8 per token)
    for (const needId of p.urgentNeeds) {
      recBuf.writeUInt8(needId & 0xff, offset);
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
          recBuf.writeUInt16BE(kt.tokenId & 0x7fff, offset);
          offset += 2;
        } else {
          const strBuf = Buffer.from(kt.text, "utf8");
          recBuf.writeUInt16BE(0x8000 | (strBuf.length & 0x7fff), offset);
          offset += 2;
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
  if (buffer.length < 3) throw new Error("Buffer terlalu kecil");

  const magic = buffer.toString("ascii", 0, 2);
  if (magic !== "S4") throw new Error(`Magic identifier tidak cocok: ${magic}`);

  const version = buffer.readUInt8(2);
  if (version !== 4) throw new Error(`Versi tidak didukung: ${version} (harap gunakan V4)`);

  let offset = 3;

  // Default Region Code
  const r0 = buffer.readUInt8(offset);
  const r1 = buffer.readUInt8(offset + 1);
  const r2 = buffer.readUInt8(offset + 2);
  offset += 3;
  const defaultRegionCode = String((r0 << 16) | (r1 << 8) | r2).padStart(6, "0");

  // Posko Name
  const posNameLen = buffer.readUInt8(offset);
  offset += 1;
  const poskoName = buffer.toString("utf8", offset, offset + posNameLen);
  offset += posNameLen;

  // Timestamp & Person Count
  const timestamp = buffer.readUInt32BE(offset) * 1000;
  offset += 4;
  const personCount = buffer.readUInt16BE(offset);
  offset += 2;

  const persons: DisasterPerson[] = [];

  for (let i = 0; i < personCount; i++) {
    const f1 = buffer.readUInt8(offset);
    offset += 1;
    const hasNationalId = (f1 & 0x80) !== 0;
    const isSameRegion = (f1 & 0x40) !== 0;
    const hasDomicile = (f1 & 0x20) !== 0;
    const hasShelter = (f1 & 0x10) !== 0;
    const hasMissingKin = (f1 & 0x08) !== 0;

    const f2 = buffer.readUInt8(offset);
    offset += 1;
    const nameTokenCount = (f2 >> 4) & 0x0f;
    const urgentNeedCount = f2 & 0x0f;

    const b3 = buffer.readUInt8(offset);
    offset += 1;
    const gender = (b3 & 0x80) !== 0 ? "F" : "M";
    const age = b3 & 0x7f;

    const vulnerabilities = buffer.readUInt8(offset);
    offset += 1;

    // NIK
    let nationalId: string | undefined;
    if (hasNationalId) {
      if (isSameRegion) {
        const highByte = BigInt(buffer.readUInt8(offset));
        const low32 = BigInt(buffer.readUInt32BE(offset + 1));
        offset += 5;
        const suffixVal = (highByte << 32n) | low32;
        const suffixStr = suffixVal.toString().padStart(10, "0");
        nationalId = `${defaultRegionCode}${suffixStr}`;
      } else {
        const nikBig = buffer.readBigUInt64BE(offset);
        offset += 8;
        nationalId = nikBig.toString().padStart(16, "0");
      }
    }

    // Nama
    const nameTokens: NameWordToken[] = [];
    for (let nt = 0; nt < nameTokenCount; nt++) {
      const val = buffer.readUInt16BE(offset);
      offset += 2;
      if ((val & 0x8000) === 0) {
        nameTokens.push({ type: "TOKEN", tokenId: val & 0x7fff });
      } else {
        const strLen = val & 0x7fff;
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
        offset += 2;
        if ((val & 0x8000) === 0) {
          kTokens.push({ type: "TOKEN", tokenId: val & 0x7fff });
        } else {
          const strLen = val & 0x7fff;
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
  return deflateSync(buffer, { level: 9 });
}

export function decompressManifestV4(compressed: Buffer): Buffer {
  return inflateSync(compressed);
}
