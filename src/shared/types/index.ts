import {
  ALL_USER_ROLES,
  STAFF_ROLES,
  type UserRole,
  type StaffRole,
} from '@/core/shared/roles';

export {
  ALL_USER_ROLES,
  STAFF_ROLES,
  type UserRole,
  type StaffRole,
};

export type PostType = "MAIN_WAREHOUSE" | "FIELD_SHELTER" | "MEDICAL_POST";
export type PostStatus = "OPERATIONAL_NORMAL" | "HAZARD_EVACUATION" | "STANDBY";
export type MissionStatus = "PREPAREDNESS" | "ACTIVE_EMERGENCY" | "TRANSITION_RECOVERY" | "CLOSED_ARCHIVED";

export type VulnerabilityCategory =
  | "BALITA"
  | "IBU_HAMIL"
  | "LANSIA"
  | "DISABILITAS"
  | "LUKA_BERAT"
  | "PENYAKIT_KRONIS";

export type TriageCategory = "RED" | "YELLOW" | "GREEN" | "BLACK";

export type ItemCategory =
  | "FOOD"
  | "CLOTHING"
  | "MEDICAL"
  | "HYGIENE"
  | "SHELTER"
  | "INFANT"
  | "BABY_SUPPLIES"
  | "ASSISTIVE"
  | "EMERGENCY_TOOLS"
  | "OTHER";

export type TicketStatus = "PENDING" | "ALLOCATED" | "COMPLETED" | "REJECTED" | "CANCELLED";

export type TacticalChannel = "POSKO_ALL" | "MEDIS" | "LOGISTIK" | "SOS";

export interface Organization {
  id: string;
  name: string;
  category: "BPBD_PEMERINTAH" | "PMI_LEMBAGA" | "NGO_YAYASAN" | "KOMUNITAS_MANDIRI";
  masterPubkey: string;
  contactNumber?: string;
  headquartersAddress?: string;
  createdAt: number;
}

export type DisasterType = "GEMPA_BUMI" | "BANJIR_BANDANG" | "ERUPSI_GUNUNG" | "LONGSOR" | "TSUNAMI";

export interface DisasterMission {
  id: string;
  orgId: string;
  name: string;
  disasterType: DisasterType;
  status: MissionStatus;
  targetDays: number;
  location: string;
  createdAt: number;
}

export interface Posko {
  id: string;
  orgId: string;
  missionId: string;
  name: string;
  postType: PostType;
  status: PostStatus;
  capacity: number;
  currentRefugees: number;
  locationLat?: number;
  locationLng?: number;
  locationName: string;
  createdAt: number;
}

export interface DisasterPerson {
  id: string;
  postId: string;
  fullName: string;
  nik: string | null;
  gender: "M" | "F";
  age: number;
  domicileOrigin: string;
  shelterLocation: string;
  missingKinName?: string;
  vulnerabilities: VulnerabilityCategory[];
  urgentNeeds: string[];
  registeredByUserId: string;
  registeredByUserName: string;
  triageStatus?: TriageCategory;
  createdAt: number;
}

export type RefugeeEventType =
  | "INTAKE"
  | "HEALTH_CHECK"
  | "NEED_REPORTED"
  | "AID_RECEIVED"
  | "NOTE"
  | "TRIAGE_UPDATE";

export interface RefugeeEvent {
  id: string;
  refugeeId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  eventType: RefugeeEventType;
  eventPayload: Record<string, unknown>;
  deviceTimestamp: number;
  logicalSeq: number;
  causalParentId?: string;
}

export interface VitalSigns {
  temperature?: number;
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  spo2?: number;
}

export interface PrescriptionItem {
  name: string;
  tokenHex: string;
  dosage: string;
  quantity: number;
}

export interface TriageRecord {
  refugeeId: string;
  triageColor: TriageCategory;
  vitalSigns: VitalSigns;
  complaints: string;
  diagnosis: string;
  prescriptions: PrescriptionItem[];
  doctorId: string;
  doctorName: string;
  timestamp: number;
}

export interface InventoryItem {
  id: string;
  postId: string;
  itemName: string;
  category: ItemCategory;
  currentQuantity: number;
  unit: string;
  burnRateDays: number;
  lastUpdatedAt: number;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  postId: string;
  officerId: string;
  officerName: string;
  txType: "RESTOCK" | "DISTRIBUTION" | "DAMAGE" | "TRANSFER";
  quantityChange: number;
  referenceTicketId?: string;
  note?: string;
  deviceTimestamp: number;
}

export interface NeedsTicket {
  id: string;
  refugeeId: string;
  refugeeName: string;
  shelterLocation: string;
  postId: string;
  itemName: string;
  quantity: number;
  unit: string;
  status: TicketStatus;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  createdByUserId: string;
  createdByUserName: string;
  allocatedByUserId?: string;
  distributedByUserId?: string;
  cancellationReason?: string;
  transferredToRefugeeId?: string;
  transferredToRefugeeName?: string;
  note?: string;
  createdAt: number;
  completedAt?: number;
}

export interface TacticalMessage {
  id: string;
  channel: TacticalChannel;
  senderPeerId: string;
  senderName: string;
  senderRole: UserRole;
  recipientPeerId?: string;
  contentType: "TEXT" | "VOICE_NOTE" | "ALERT";
  textContent?: string;
  audioDurationMs?: number;
  audioWaveform?: number[];
  audioBase64?: string;
  isUrgent?: boolean;
  createdAt: number;
}

export interface MeshPeer {
  peerId: string;
  noisePubkey: string;
  signingPubkey: string;
  aliasName: string;
  role: UserRole;
  currentPosId?: string;
  rssi: number; // e.g. -45 dBm
  hops: number; // 1 to 7
  lastSeen: number;
}

export interface ActiveSession {
  userRole: UserRole;
  userName: string;
  userId: string;
  orgId: string;
  orgName: string;
  missionId: string;
  missionName: string;
  poskoId: string;
  poskoName: string;
}
