import { deflateSync, inflateSync } from "node:zlib";
import {
  tokenizeFullName,
  detokenizeFullName,
  NameWordToken,
} from "./name-dictionary";
import { BITWISE, RADIX, TIME_CONSTANTS } from "@/core/shared/constants";

export interface DisasterPerson {
  id?: string;
  poskoId?: string;
  fullName: string;
  nationalId?: string; // 16-digit (opsional / null)
  gender: "M" | "F";
  age: number; // 0..127
  vulnerabilities: number; // bitmask uint8 (8 kategori kerentanan)
  urgentNeeds: number[]; // uint8 token IDs (0x01..0xFF)
  domicileOrigin?: string; // Dusun / Desa asal
  shelterLocation?: string; // Penampungan ("Kelas 2B", "Tenda 04", "GOR Sektor A")
  missingKinName?: string; // Nama keluarga yang terpisah & dicari
  triage?: "GREEN" | "YELLOW" | "RED" | "BLACK"; // Kategori Triase START (2 bits di flags byte)
}

export interface ManifestInventoryItem {
  itemName: string;
  category: "FOOD" | "CLOTHING" | "MEDICAL" | "HYGIENE" | "SHELTER" | "BABY_SUPPLIES";
  currentQuantity: number;
  unit: string;
}

export interface ManifestTransactionItem {
  id: string;
  itemId?: string;
  txType: "RESTOCK" | "DISTRIBUTION" | "DAMAGE" | "TRANSFER";
  quantityChange: number;
  note?: string;
  officerName?: string;
  deviceTimestamp?: number;
}

export interface ManifestRefugeeEvent {
  id: string;
  refugeeId: string;
  authorId?: string;
  authorName: string;
  authorRole: string;
  eventType: "INTAKE" | "HEALTH_CHECK" | "NEED_REPORTED" | "AID_RECEIVED" | "NOTE" | "TRIAGE_UPDATE";
  eventPayloadJson: string;
  deviceTimestamp: number;
  logicalSeq: number;
}

export interface ManifestNeedsTicket {
  id: string;
  refugeeId: string;
  refugeeName: string;
  shelterLocation: string;
  postId?: string;
  itemName: string;
  quantity: number;
  unit: string;
  status: "PENDING" | "ALLOCATED" | "COMPLETED" | "REJECTED" | "CANCELLED";
  urgency: "HIGH" | "MEDIUM" | "LOW";
  createdByUserName?: string;
  createdAt?: number;
  completedAt?: number;
}

export interface DisasterManifestV4 {
  poskoId?: string;
  poskoName: string;
  defaultRegionCode: string; // 6 digit kode wilayah default (misal "320101")
  timestamp: number;
  persons: DisasterPerson[];
  inventory?: ManifestInventoryItem[];
  transactions?: ManifestTransactionItem[];
  personIds?: string[];
  events?: ManifestRefugeeEvent[];
  tickets?: ManifestNeedsTicket[];
  personPoskoIds?: string[];
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
  // Bits 1-2 (0x06) encode triage: 00=GREEN, 01=YELLOW, 10=RED, 11=BLACK
  TRIAGE_BITS_MASK: 0x06,
  TRIAGE_BITS_SHIFT: 1,
  TRIAGE_GREEN: 0,
  TRIAGE_YELLOW: 1,
  TRIAGE_RED: 2,
  TRIAGE_BLACK: 3,
  GENDER_FEMALE_BIT: 0x80,
  AGE_MASK: 0x7f,
  TOKEN_TYPE_LITERAL_FLAG: 0x8000,
  TOKEN_ID_MASK: 0x7fff,
  SHIFT_16: 16,
  SHIFT_8: 8,
  INVENTORY_COUNT_BYTES: 2,
  CATEGORY_MAP: {
    "FOOD": 0,
    "CLOTHING": 1,
    "MEDICAL": 2,
    "HYGIENE": 3,
    "SHELTER": 4,
    "BABY_SUPPLIES": 5,
  } as Record<string, number>,
  CATEGORY_ARRAY: ["FOOD", "CLOTHING", "MEDICAL", "HYGIENE", "SHELTER", "BABY_SUPPLIES"] as const,
  TX_TYPE_MAP: {
    RESTOCK: 0,
    DISTRIBUTION: 1,
    DAMAGE: 2,
    TRANSFER: 3,
  } as Record<string, number>,
  TX_TYPE_ARRAY: ["RESTOCK", "DISTRIBUTION", "DAMAGE", "TRANSFER"] as const,
  TRANSACTION_COUNT_BYTES: 2,
  EVENT_TYPE_MAP: {
    INTAKE: 0,
    HEALTH_CHECK: 1,
    NEED_REPORTED: 2,
    AID_RECEIVED: 3,
    NOTE: 4,
    TRIAGE_UPDATE: 5,
  } as Record<string, number>,
  EVENT_TYPE_ARRAY: ["INTAKE", "HEALTH_CHECK", "NEED_REPORTED", "AID_RECEIVED", "NOTE", "TRIAGE_UPDATE"] as const,
  TICKET_STATUS_MAP: {
    PENDING: 0,
    ALLOCATED: 1,
    COMPLETED: 2,
    REJECTED: 3,
    CANCELLED: 3,
  } as Record<string, number>,
  TICKET_STATUS_ARRAY: ["PENDING", "ALLOCATED", "COMPLETED", "REJECTED"] as const,
  TICKET_URGENCY_MAP: {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  } as Record<string, number>,
  TICKET_URGENCY_ARRAY: ["HIGH", "MEDIUM", "LOW"] as const,
  VULNERABILITY_BITMASK_MAP: {
    BALITA: 0x01,
    IBU_HAMIL: 0x02,
    LANSIA: 0x04,
    DISABILITAS: 0x08,
    LUKA_BERAT: 0x10,
    PENYAKIT_KRONIS: 0x20,
  } as const,
} as const;

export function vulnerabilitiesToBitmask(vulnerabilities: readonly string[]): number {
  let mask = 0;
  for (const v of vulnerabilities) {
    const bit = BITPACKER_CONSTANTS.VULNERABILITY_BITMASK_MAP[v as keyof typeof BITPACKER_CONSTANTS.VULNERABILITY_BITMASK_MAP];
    if (bit) mask |= bit;
  }
  return mask;
}

export function bitmaskToVulnerabilities(mask: number): ("BALITA" | "IBU_HAMIL" | "LANSIA" | "DISABILITAS" | "LUKA_BERAT" | "PENYAKIT_KRONIS")[] {
  const result: ("BALITA" | "IBU_HAMIL" | "LANSIA" | "DISABILITAS" | "LUKA_BERAT" | "PENYAKIT_KRONIS")[] = [];
  for (const [name, bit] of Object.entries(BITPACKER_CONSTANTS.VULNERABILITY_BITMASK_MAP)) {
    if ((mask & bit) !== 0) {
      result.push(name as "BALITA" | "IBU_HAMIL" | "LANSIA" | "DISABILITAS" | "LUKA_BERAT" | "PENYAKIT_KRONIS");
    }
  }
  return result;
}

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
  const triageCode = p.triage === "YELLOW" ? BITPACKER_CONSTANTS.TRIAGE_YELLOW
    : p.triage === "RED" ? BITPACKER_CONSTANTS.TRIAGE_RED
    : p.triage === "BLACK" ? BITPACKER_CONSTANTS.TRIAGE_BLACK
    : BITPACKER_CONSTANTS.TRIAGE_GREEN;
  const f1 =
  (hasNationalId ? BITPACKER_CONSTANTS.FLAG_HAS_NATIONAL_ID : 0) |
  (isSameRegion ? BITPACKER_CONSTANTS.FLAG_IS_SAME_REGION : 0) |
  (hasDomicile ? BITPACKER_CONSTANTS.FLAG_HAS_DOMICILE : 0) |
  (hasShelter ? BITPACKER_CONSTANTS.FLAG_HAS_SHELTER : 0) |
  (hasMissingKin ? BITPACKER_CONSTANTS.FLAG_HAS_MISSING_KIN : 0) |
  ((triageCode << BITPACKER_CONSTANTS.TRIAGE_BITS_SHIFT) & BITPACKER_CONSTANTS.TRIAGE_BITS_MASK);
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

  // 5. Encode Inventory (Opsional, ditambahkan di akhir buffer)
  const hasInventory = Boolean(manifest.inventory && manifest.inventory.length > 0);
  const hasTransactions = Boolean(manifest.transactions && manifest.transactions.length > 0);

  if (hasInventory) {
    const invCountBuf = Buffer.alloc(BITPACKER_CONSTANTS.INVENTORY_COUNT_BYTES);
    invCountBuf.writeUInt16BE(manifest.inventory!.length, 0);
    chunks.push(invCountBuf);

    for (const inv of manifest.inventory!) {
      const nameBuf = Buffer.from(inv.itemName, "utf8");
      const unitBuf = Buffer.from(inv.unit, "utf8");
      
      const invSize = 
        1 + // Category (3 bits) & Name Length (5 bits)
        nameBuf.length + 
        2 + // Quantity (uint16)
        1 + // Unit Length (uint8)
        unitBuf.length;
        
      const invBuf = Buffer.alloc(invSize);
      let invOffset = 0;
      
      const categoryNum = BITPACKER_CONSTANTS.CATEGORY_MAP[inv.category] ?? 0;
      // category (3 bits), name length (5 bits, capped at 31)
      const nameLenCapped = Math.min(31, nameBuf.length);
      invBuf.writeUInt8(((categoryNum & 0x07) << 5) | (nameLenCapped & 0x1F), invOffset);
      invOffset += 1;
      
      nameBuf.copy(invBuf, invOffset, 0, nameLenCapped);
      invOffset += nameLenCapped;
      
      invBuf.writeUInt16BE(Math.min(0xFFFF, inv.currentQuantity), invOffset);
      invOffset += 2;
      
      invBuf.writeUInt8(unitBuf.length, invOffset);
      invOffset += 1;
      
      unitBuf.copy(invBuf, invOffset);
      invOffset += unitBuf.length;
      
      chunks.push(invBuf);
    }
  } else if (hasTransactions) {
    // Sisipkan placeholder 0 inventory agar unpacker mengetahui ada seksi transaksi setelahnya
    const emptyInvBuf = Buffer.alloc(BITPACKER_CONSTANTS.INVENTORY_COUNT_BYTES);
    emptyInvBuf.writeUInt16BE(0, 0);
    chunks.push(emptyInvBuf);
  }

  // 6. Encode Transactions (Opsional, catatan barang keluar masuk)
  if (hasTransactions) {
    const txCountBuf = Buffer.alloc(BITPACKER_CONSTANTS.TRANSACTION_COUNT_BYTES);
    txCountBuf.writeUInt16BE(manifest.transactions!.length, 0);
    chunks.push(txCountBuf);

    for (const tx of manifest.transactions!) {
      const idBuf = Buffer.from(tx.id || "", "utf8");
      const noteBuf = Buffer.from(tx.note || "", "utf8");
      const officerBuf = Buffer.from(tx.officerName || "", "utf8");

      const idLenCapped = Math.min(31, idBuf.length);
      const noteLenCapped = Math.min(63, noteBuf.length);
      const officerLenCapped = Math.min(31, officerBuf.length);

      const txSize =
        1 + // txType (uint8)
        4 + // quantityChange (int32BE)
        4 + // deviceTimestamp (uint32BE)
        1 + idLenCapped +
        1 + noteLenCapped +
        1 + officerLenCapped;

      const txBuf = Buffer.alloc(txSize);
      let txOffset = 0;

      const typeNum = BITPACKER_CONSTANTS.TX_TYPE_MAP[tx.txType] ?? 0;
      txBuf.writeUInt8(typeNum & 0xFF, txOffset);
      txOffset += 1;

      txBuf.writeInt32BE(tx.quantityChange, txOffset);
      txOffset += 4;

      const tsSec = Math.floor((tx.deviceTimestamp || Date.now()) / 1000);
      txBuf.writeUInt32BE(tsSec, txOffset);
      txOffset += 4;

      txBuf.writeUInt8(idLenCapped, txOffset);
      txOffset += 1;
      idBuf.copy(txBuf, txOffset, 0, idLenCapped);
      txOffset += idLenCapped;

      txBuf.writeUInt8(noteLenCapped, txOffset);
      txOffset += 1;
      noteBuf.copy(txBuf, txOffset, 0, noteLenCapped);
      txOffset += noteLenCapped;

      txBuf.writeUInt8(officerLenCapped, txOffset);
      txOffset += 1;
      officerBuf.copy(txBuf, txOffset, 0, officerLenCapped);
      txOffset += officerLenCapped;

      chunks.push(txBuf);
    }
  }

  // 7. Encode Person IDs (Opsional, menjaga identitas ID pengungsi tetap persisten antar-posko)
  const personIds = manifest.personIds || manifest.persons.map((p) => p.id).filter(Boolean) as string[];
  const hasPersonIds = personIds.length > 0;
  const hasEvents = Boolean(manifest.events && manifest.events.length > 0);
  const hasTickets = Boolean(manifest.tickets && manifest.tickets.length > 0);
  const hasPoskoId = Boolean(manifest.poskoId && manifest.poskoId.trim().length > 0);
  const personPoskoList = manifest.persons.map((p) => p.poskoId || manifest.poskoId || "");
  const hasPersonPoskos = personPoskoList.some((pid) => pid.length > 0);
  const hasPoskoMetadata = hasPoskoId || hasPersonPoskos;

  // Sisipkan padding txCount=0 jika ada seksi lanjutan tapi transaksi kosong
  if (!hasTransactions && (hasPersonIds || hasEvents || hasTickets || hasPoskoMetadata)) {
    const emptyTxBuf = Buffer.alloc(BITPACKER_CONSTANTS.TRANSACTION_COUNT_BYTES);
    emptyTxBuf.writeUInt16BE(0, 0);
    chunks.push(emptyTxBuf);
  }

  if (hasPersonIds) {
    const pIdCountBuf = Buffer.alloc(2);
    pIdCountBuf.writeUInt16BE(personIds.length, 0);
    chunks.push(pIdCountBuf);

    for (const pid of personIds) {
      const pBuf = Buffer.from(pid, "utf8");
      const pLenCapped = Math.min(36, pBuf.length);
      const itemBuf = Buffer.alloc(1 + pLenCapped);
      itemBuf.writeUInt8(pLenCapped, 0);
      pBuf.copy(itemBuf, 1, 0, pLenCapped);
      chunks.push(itemBuf);
    }
  } else if (hasEvents || hasTickets || hasPoskoMetadata) {
    const emptyPIdBuf = Buffer.alloc(2);
    emptyPIdBuf.writeUInt16BE(0, 0);
    chunks.push(emptyPIdBuf);
  }

  // 8. Encode Events (Opsional, Kronologi & Rekam Peristiwa)
  if (hasEvents) {
    const evCountBuf = Buffer.alloc(2);
    evCountBuf.writeUInt16BE(manifest.events!.length, 0);
    chunks.push(evCountBuf);

    for (const ev of manifest.events!) {
      const idBuf = Buffer.from(ev.id || "", "utf8");
      const refIdBuf = Buffer.from(ev.refugeeId || "", "utf8");
      const authBuf = Buffer.from(ev.authorName || "", "utf8");
      const roleBuf = Buffer.from(ev.authorRole || "RELAWAN", "utf8");
      const payloadBuf = Buffer.from(ev.eventPayloadJson || "{}", "utf8");

      const idLen = Math.min(36, idBuf.length);
      const refIdLen = Math.min(36, refIdBuf.length);
      const authLen = Math.min(24, authBuf.length);
      const roleLen = Math.min(16, roleBuf.length);
      const pLen = Math.min(512, payloadBuf.length);

      const evSize = 1 + idLen + 1 + refIdLen + 1 + authLen + 1 + roleLen + 1 + 2 + 4 + 2 + pLen;
      const evBuf = Buffer.alloc(evSize);
      let evOff = 0;

      evBuf.writeUInt8(idLen, evOff++);
      idBuf.copy(evBuf, evOff, 0, idLen);
      evOff += idLen;

      evBuf.writeUInt8(refIdLen, evOff++);
      refIdBuf.copy(evBuf, evOff, 0, refIdLen);
      evOff += refIdLen;

      evBuf.writeUInt8(authLen, evOff++);
      authBuf.copy(evBuf, evOff, 0, authLen);
      evOff += authLen;

      evBuf.writeUInt8(roleLen, evOff++);
      roleBuf.copy(evBuf, evOff, 0, roleLen);
      evOff += roleLen;

      const typeNum = BITPACKER_CONSTANTS.EVENT_TYPE_MAP[ev.eventType] ?? 0;
      evBuf.writeUInt8(typeNum & 0xFF, evOff++);

      evBuf.writeUInt16BE(ev.logicalSeq || 1, evOff);
      evOff += 2;

      const tsSec = Math.floor((ev.deviceTimestamp || Date.now()) / 1000);
      evBuf.writeUInt32BE(tsSec, evOff);
      evOff += 4;

      evBuf.writeUInt16BE(pLen, evOff);
      evOff += 2;
      payloadBuf.copy(evBuf, evOff, 0, pLen);
      evOff += pLen;

      chunks.push(evBuf);
    }
  } else if (hasTickets || hasPoskoMetadata) {
    const emptyEvBuf = Buffer.alloc(2);
    emptyEvBuf.writeUInt16BE(0, 0);
    chunks.push(emptyEvBuf);
  }

  // 9. Encode Tickets (Opsional, Data Distribusi Bantuan)
  if (hasTickets) {
    const tktCountBuf = Buffer.alloc(2);
    tktCountBuf.writeUInt16BE(manifest.tickets!.length, 0);
    chunks.push(tktCountBuf);

    for (const tkt of manifest.tickets!) {
      const idBuf = Buffer.from(tkt.id || "", "utf8");
      const refIdBuf = Buffer.from(tkt.refugeeId || "", "utf8");
      const refNameBuf = Buffer.from(tkt.refugeeName || "", "utf8");
      const shelterBuf = Buffer.from(tkt.shelterLocation || "", "utf8");
      const itemBuf = Buffer.from(tkt.itemName || "", "utf8");
      const unitBuf = Buffer.from(tkt.unit || "paket", "utf8");
      const authBuf = Buffer.from(tkt.createdByUserName || "Petugas", "utf8");

      const idLen = Math.min(24, idBuf.length);
      const refIdLen = Math.min(36, refIdBuf.length);
      const refNameLen = Math.min(32, refNameBuf.length);
      const shelterLen = Math.min(32, shelterBuf.length);
      const itemLen = Math.min(32, itemBuf.length);
      const unitLen = Math.min(16, unitBuf.length);
      const authLen = Math.min(24, authBuf.length);

      const tktSize = 1 + idLen + 1 + refIdLen + 1 + refNameLen + 1 + shelterLen + 1 + itemLen + 2 + 1 + unitLen + 1 + 1 + 1 + authLen + 4 + 4;
      const tktBuf = Buffer.alloc(tktSize);
      let tOff = 0;

      tktBuf.writeUInt8(idLen, tOff++);
      idBuf.copy(tktBuf, tOff, 0, idLen);
      tOff += idLen;

      tktBuf.writeUInt8(refIdLen, tOff++);
      refIdBuf.copy(tktBuf, tOff, 0, refIdLen);
      tOff += refIdLen;

      tktBuf.writeUInt8(refNameLen, tOff++);
      refNameBuf.copy(tktBuf, tOff, 0, refNameLen);
      tOff += refNameLen;

      tktBuf.writeUInt8(shelterLen, tOff++);
      shelterBuf.copy(tktBuf, tOff, 0, shelterLen);
      tOff += shelterLen;

      tktBuf.writeUInt8(itemLen, tOff++);
      itemBuf.copy(tktBuf, tOff, 0, itemLen);
      tOff += itemLen;

      tktBuf.writeUInt16BE(Math.min(0xFFFF, tkt.quantity || 1), tOff);
      tOff += 2;

      tktBuf.writeUInt8(unitLen, tOff++);
      unitBuf.copy(tktBuf, tOff, 0, unitLen);
      tOff += unitLen;

      const statusNum = BITPACKER_CONSTANTS.TICKET_STATUS_MAP[tkt.status] ?? 0;
      tktBuf.writeUInt8(statusNum & 0xFF, tOff++);

      const urgencyNum = BITPACKER_CONSTANTS.TICKET_URGENCY_MAP[tkt.urgency] ?? 0;
      tktBuf.writeUInt8(urgencyNum & 0xFF, tOff++);

      tktBuf.writeUInt8(authLen, tOff++);
      authBuf.copy(tktBuf, tOff, 0, authLen);
      tOff += authLen;

      const cTsSec = Math.floor((tkt.createdAt || Date.now()) / 1000);
      tktBuf.writeUInt32BE(cTsSec, tOff);
      tOff += 4;

      const compTsSec = tkt.completedAt ? Math.floor(tkt.completedAt / 1000) : 0;
      tktBuf.writeUInt32BE(compTsSec, tOff);
      tOff += 4;

      chunks.push(tktBuf);
    }
  } else if (hasPoskoMetadata) {
    const emptyTktBuf = Buffer.alloc(2);
    emptyTktBuf.writeUInt16BE(0, 0);
    chunks.push(emptyTktBuf);
  }

  // 10. Encode Posko Metadata (Opsional, Rekonsiliasi Temu Keluarga Lintas Posko)
  if (hasPoskoMetadata) {
    const posIdStr = manifest.poskoId || "";
    const posIdBuf = Buffer.from(posIdStr, "utf8");
    const posIdLen = Math.min(32, posIdBuf.length);

    const metaHeader = Buffer.alloc(1 + posIdLen + 2);
    metaHeader.writeUInt8(posIdLen, 0);
    posIdBuf.copy(metaHeader, 1, 0, posIdLen);
    metaHeader.writeUInt16BE(hasPersonPoskos ? manifest.persons.length : 0, 1 + posIdLen);
    chunks.push(metaHeader);

    if (hasPersonPoskos) {
      for (const p of manifest.persons) {
        const pPosStr = p.poskoId || posIdStr;
        const pPosBuf = Buffer.from(pPosStr, "utf8");
        const pLen = Math.min(32, pPosBuf.length);
        const cellBuf = Buffer.alloc(1 + pLen);
        cellBuf.writeUInt8(pLen, 0);
        pPosBuf.copy(cellBuf, 1, 0, pLen);
        chunks.push(cellBuf);
      }
    }
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
  const triageCode = (f1 & BITPACKER_CONSTANTS.TRIAGE_BITS_MASK) >> BITPACKER_CONSTANTS.TRIAGE_BITS_SHIFT;
  const triage = triageCode === BITPACKER_CONSTANTS.TRIAGE_RED ? "RED" as const
    : triageCode === BITPACKER_CONSTANTS.TRIAGE_YELLOW ? "YELLOW" as const
    : triageCode === BITPACKER_CONSTANTS.TRIAGE_BLACK ? "BLACK" as const
    : "GREEN" as const;

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
  triage,
  });
  }

  // 5. Decode Inventory (Opsional)
  const inventory: ManifestInventoryItem[] = [];
  if (offset + BITPACKER_CONSTANTS.INVENTORY_COUNT_BYTES <= buffer.length) {
    const invCount = buffer.readUInt16BE(offset);
    offset += BITPACKER_CONSTANTS.INVENTORY_COUNT_BYTES;

    for (let i = 0; i < invCount; i++) {
      if (offset >= buffer.length) break;

      const firstByte = buffer.readUInt8(offset);
      offset += 1;
      
      const categoryNum = (firstByte >> 5) & 0x07;
      const nameLen = firstByte & 0x1F;
      
      const itemName = buffer.toString("utf8", offset, offset + nameLen);
      offset += nameLen;
      
      const currentQuantity = buffer.readUInt16BE(offset);
      offset += 2;
      
      const unitLen = buffer.readUInt8(offset);
      offset += 1;
      
      const unit = buffer.toString("utf8", offset, offset + unitLen);
      offset += unitLen;
      
      const category = BITPACKER_CONSTANTS.CATEGORY_ARRAY[categoryNum] || "FOOD";
      
      inventory.push({
        itemName,
        category,
        currentQuantity,
        unit
      });
    }
  }

  // 6. Decode Transactions (Opsional, catatan barang keluar masuk)
  const transactions: ManifestTransactionItem[] = [];
  if (offset + BITPACKER_CONSTANTS.TRANSACTION_COUNT_BYTES <= buffer.length) {
    const txCount = buffer.readUInt16BE(offset);
    offset += BITPACKER_CONSTANTS.TRANSACTION_COUNT_BYTES;

    for (let i = 0; i < txCount; i++) {
      if (offset >= buffer.length) break;

      const typeNum = buffer.readUInt8(offset);
      offset += 1;
      const txType = BITPACKER_CONSTANTS.TX_TYPE_ARRAY[typeNum] || "RESTOCK";

      const quantityChange = buffer.readInt32BE(offset);
      offset += 4;

      const tsSec = buffer.readUInt32BE(offset);
      offset += 4;
      const deviceTimestamp = tsSec * 1000;

      const idLen = buffer.readUInt8(offset);
      offset += 1;
      const id = buffer.toString("utf8", offset, offset + idLen);
      offset += idLen;

      const noteLen = buffer.readUInt8(offset);
      offset += 1;
      const note = buffer.toString("utf8", offset, offset + noteLen);
      offset += noteLen;

      const officerNameLen = buffer.readUInt8(offset);
      offset += 1;
      const officerName = buffer.toString("utf8", offset, offset + officerNameLen);
      offset += officerNameLen;

      transactions.push({
        id,
        txType,
        quantityChange,
        note: note || undefined,
        officerName: officerName || undefined,
        deviceTimestamp,
      });
    }
  }

  // 7. Decode Person IDs (Opsional)
  const personIds: string[] = [];
  if (offset + 2 <= buffer.length) {
    const pIdCount = buffer.readUInt16BE(offset);
    offset += 2;

    for (let i = 0; i < pIdCount; i++) {
      if (offset >= buffer.length) break;
      const pLen = buffer.readUInt8(offset);
      offset += 1;
      const pid = buffer.toString("utf8", offset, offset + pLen);
      offset += pLen;
      personIds.push(pid);
      if (i < persons.length) {
        persons[i]!.id = pid;
      }
    }
  }

  // 8. Decode Events (Opsional, Kronologi & Rekam Peristiwa)
  const events: ManifestRefugeeEvent[] = [];
  if (offset + 2 <= buffer.length) {
    const evCount = buffer.readUInt16BE(offset);
    offset += 2;

    for (let i = 0; i < evCount; i++) {
      if (offset >= buffer.length) break;

      const idLen = buffer.readUInt8(offset);
      offset += 1;
      const id = buffer.toString("utf8", offset, offset + idLen);
      offset += idLen;

      const refIdLen = buffer.readUInt8(offset);
      offset += 1;
      const refugeeId = buffer.toString("utf8", offset, offset + refIdLen);
      offset += refIdLen;

      const authLen = buffer.readUInt8(offset);
      offset += 1;
      const authorName = buffer.toString("utf8", offset, offset + authLen);
      offset += authLen;

      const roleLen = buffer.readUInt8(offset);
      offset += 1;
      const authorRole = buffer.toString("utf8", offset, offset + roleLen);
      offset += roleLen;

      const typeNum = buffer.readUInt8(offset);
      offset += 1;
      const eventType = BITPACKER_CONSTANTS.EVENT_TYPE_ARRAY[typeNum] || "NOTE";

      const logicalSeq = buffer.readUInt16BE(offset);
      offset += 2;

      const tsSec = buffer.readUInt32BE(offset);
      offset += 4;
      const deviceTimestamp = tsSec * 1000;

      const pLen = buffer.readUInt16BE(offset);
      offset += 2;
      const eventPayloadJson = buffer.toString("utf8", offset, offset + pLen);
      offset += pLen;

      events.push({
        id,
        refugeeId,
        authorName,
        authorRole,
        eventType,
        logicalSeq,
        deviceTimestamp,
        eventPayloadJson,
      });
    }
  }

  // 9. Decode Tickets (Opsional, Data Distribusi Bantuan)
  const tickets: ManifestNeedsTicket[] = [];
  if (offset + 2 <= buffer.length) {
    const tktCount = buffer.readUInt16BE(offset);
    offset += 2;

    for (let i = 0; i < tktCount; i++) {
      if (offset >= buffer.length) break;

      const idLen = buffer.readUInt8(offset);
      offset += 1;
      const id = buffer.toString("utf8", offset, offset + idLen);
      offset += idLen;

      const refIdLen = buffer.readUInt8(offset);
      offset += 1;
      const refugeeId = buffer.toString("utf8", offset, offset + refIdLen);
      offset += refIdLen;

      const refNameLen = buffer.readUInt8(offset);
      offset += 1;
      const refugeeName = buffer.toString("utf8", offset, offset + refNameLen);
      offset += refNameLen;

      const shelterLen = buffer.readUInt8(offset);
      offset += 1;
      const shelterLocation = buffer.toString("utf8", offset, offset + shelterLen);
      offset += shelterLen;

      const itemLen = buffer.readUInt8(offset);
      offset += 1;
      const itemName = buffer.toString("utf8", offset, offset + itemLen);
      offset += itemLen;

      const quantity = buffer.readUInt16BE(offset);
      offset += 2;

      const unitLen = buffer.readUInt8(offset);
      offset += 1;
      const unit = buffer.toString("utf8", offset, offset + unitLen);
      offset += unitLen;

      const statusNum = buffer.readUInt8(offset);
      offset += 1;
      const status = BITPACKER_CONSTANTS.TICKET_STATUS_ARRAY[statusNum] || "PENDING";

      const urgencyNum = buffer.readUInt8(offset);
      offset += 1;
      const urgency = BITPACKER_CONSTANTS.TICKET_URGENCY_ARRAY[urgencyNum] || "HIGH";

      const authLen = buffer.readUInt8(offset);
      offset += 1;
      const createdByUserName = buffer.toString("utf8", offset, offset + authLen);
      offset += authLen;

      const cTsSec = buffer.readUInt32BE(offset);
      offset += 4;
      const createdAt = cTsSec * 1000;

      const compTsSec = buffer.readUInt32BE(offset);
      offset += 4;
      const completedAt = compTsSec > 0 ? compTsSec * 1000 : undefined;

      tickets.push({
        id,
        refugeeId,
        refugeeName,
        shelterLocation,
        itemName,
        quantity,
        unit,
        status,
        urgency,
        createdByUserName,
        createdAt,
        completedAt,
      });
    }
  }

  // 10. Decode Posko Metadata (Opsional, Rekonsiliasi Temu Keluarga Lintas Posko)
  let poskoId: string | undefined;
  if (offset < buffer.length) {
    const posIdLen = buffer.readUInt8(offset);
    offset += 1;
    if (posIdLen > 0 && offset + posIdLen <= buffer.length) {
      poskoId = buffer.toString("utf8", offset, offset + posIdLen);
      offset += posIdLen;
    }

    if (offset + 2 <= buffer.length) {
      const pPosCount = buffer.readUInt16BE(offset);
      offset += 2;
      for (let i = 0; i < pPosCount; i++) {
        if (offset >= buffer.length) break;
        const len = buffer.readUInt8(offset);
        offset += 1;
        const pPos = buffer.toString("utf8", offset, offset + len);
        offset += len;
        if (i < persons.length && pPos) {
          persons[i]!.poskoId = pPos;
        }
      }
    }
  }

  // Set default poskoId on persons if missing
  if (poskoId) {
    for (const p of persons) {
      if (!p.poskoId) {
        p.poskoId = poskoId;
      }
    }
  }

  return {
    poskoId,
    poskoName,
    defaultRegionCode,
    timestamp,
    persons,
    inventory: inventory.length > 0 ? inventory : undefined,
    transactions: transactions.length > 0 ? transactions : undefined,
    personIds: personIds.length > 0 ? personIds : undefined,
    events: events.length > 0 ? events : undefined,
    tickets: tickets.length > 0 ? tickets : undefined,
  };
}

export function compressManifestV4(buffer: Buffer): Buffer {
  return deflateSync(buffer, { level: BITPACKER_CONSTANTS.ZLIB_COMPRESSION_LEVEL });
}

export function decompressManifestV4(compressed: Buffer): Buffer {
  return inflateSync(compressed);
}
