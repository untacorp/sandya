"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type DisasterPerson,
  type RefugeeEvent,
  type InventoryItem,
  type InventoryTransaction,
  type NeedsTicket,
  type TacticalMessage,
  type MeshPeer,
  type TriageCategory,
  type ActiveSession,
  type UserRole,
  type TacticalChannel,
  type Organization,
  type DisasterMission,
  type Posko,
  type PostStatus,
} from "@/shared/types";

export const POSKO_STORE_CONSTANTS = {
  SIMULATED_CLOUD_LATENCY_MS: 800,
  DEFAULT_BURN_RATE_DAYS: 5,
  RANDOM_ID_4_DIGIT_MIN: 1000,
  RANDOM_ID_4_DIGIT_RANGE: 9000,
  RANDOM_ID_3_DIGIT_MIN: 100,
  RANDOM_ID_3_DIGIT_RANGE: 900,
  DEFAULT_RADIO_AUDIO_DURATION_MS: 4200,
  PEER_A1_LAST_SEEN_OFFSET_MS: 5000,
  PEER_B2_LAST_SEEN_OFFSET_MS: 12000,
  PEER_C3_LAST_SEEN_OFFSET_MS: 25000,
  PEER_D4_LAST_SEEN_OFFSET_MS: 40000,
  INITIAL_LAST_SYNCED_OFFSET_MS: 120000,
} as const;

export interface MacroWaybill {
  id: string;
  missionId: string;
  sourceHub: string;
  targetPoskoId: string;
  targetPoskoName: string;
  itemName: string;
  quantity: number;
  unit: string;
  status: "PREPARING" | "IN_TRANSIT" | "ARRIVED";
  driverName: string;
  dispatchedAt: number;
}

/**
 * Helper to dynamically derive real active officers / mesh peers from store activity.
 */
export function deriveActivePeers(
  messages: TacticalMessage[],
  transactions: InventoryTransaction[],
  refugees: DisasterPerson[],
  currentUserId?: string,
  currentUserName?: string,
  currentPoskoId?: string
): MeshPeer[] {
  const peerMap = new Map<string, MeshPeer>();

  // 1. From tactical messages
  for (const msg of messages) {
    const peerId = msg.senderPeerId;
    const isSelf =
      (peerId && currentUserId && peerId === currentUserId) ||
      (msg.senderName && currentUserName && msg.senderName === currentUserName);
    if (peerId && !isSelf) {
      if (!peerMap.has(peerId)) {
        peerMap.set(peerId, {
          peerId,
          noisePubkey: `noise_${peerId.toLowerCase()}`,
          signingPubkey: `sig_${peerId.toLowerCase()}`,
          aliasName: msg.senderName,
          role: (msg.senderRole as UserRole) || "RELAWAN_LAPANGAN",
          rssi: -65,
          hops: 1,
          lastSeen: msg.createdAt,
          currentPosId: currentPoskoId || "POS-01",
        });
      } else {
        const existing = peerMap.get(peerId)!;
        if (msg.createdAt > existing.lastSeen) {
          existing.lastSeen = msg.createdAt;
          existing.aliasName = msg.senderName;
          existing.role = (msg.senderRole as UserRole) || existing.role;
        }
      }
    }
  }

  // 2. From inventory transactions
  for (const tx of transactions) {
    const isSelf =
      (tx.officerId && currentUserId && tx.officerId === currentUserId) ||
      (tx.officerName && currentUserName && tx.officerName === currentUserName);
    if (tx.officerId && !isSelf) {
      if (!peerMap.has(tx.officerId)) {
        peerMap.set(tx.officerId, {
          peerId: tx.officerId,
          noisePubkey: `noise_${tx.officerId.toLowerCase()}`,
          signingPubkey: `sig_${tx.officerId.toLowerCase()}`,
          aliasName: tx.officerName,
          role: "PETUGAS_LOGISTIK",
          rssi: -70,
          hops: 1,
          lastSeen: tx.deviceTimestamp,
          currentPosId: tx.postId || currentPoskoId || "POS-01",
        });
      }
    }
  }

  // 3. From refugee intake registrations
  for (const ref of refugees) {
    const isSelf =
      (ref.registeredByUserId && currentUserId && ref.registeredByUserId === currentUserId) ||
      (ref.registeredByUserName && currentUserName && ref.registeredByUserName === currentUserName);
    if (ref.registeredByUserId && !isSelf) {
      if (!peerMap.has(ref.registeredByUserId)) {
        peerMap.set(ref.registeredByUserId, {
          peerId: ref.registeredByUserId,
          noisePubkey: `noise_${ref.registeredByUserId.toLowerCase()}`,
          signingPubkey: `sig_${ref.registeredByUserId.toLowerCase()}`,
          aliasName: ref.registeredByUserName,
          role: "RELAWAN_LAPANGAN",
          rssi: -72,
          hops: 1,
          lastSeen: ref.createdAt,
          currentPosId: ref.postId || currentPoskoId || "POS-01",
        });
      }
    }
  }

  return Array.from(peerMap.values()).sort((a, b) => b.lastSeen - a.lastSeen);
}

/**
 * Non-blocking instant write-through push helper.
 */
function triggerInstantPush(
  syncAction: (cloudSync: import("@/infrastructure/sync/cloud-sync.service").CloudSyncService) => Promise<unknown>
) {
  if (typeof window === "undefined") return;
  queueMicrotask(async () => {
    try {
      const { DEFAULT_CLOUD_CONFIG } = await import("@/infrastructure/config/cloud.config");
      if (DEFAULT_CLOUD_CONFIG.driver === "LOCAL_FIRST_OFFLINE") return;
      const { CloudSyncService } = await import("@/infrastructure/sync/cloud-sync.service");
      const cloudSync = new CloudSyncService(DEFAULT_CLOUD_CONFIG);
      await syncAction(cloudSync);
    } catch {
      // Non-fatal background push error; background polling or offline sync will retry
    }
  });
}

/**
 * Broadcast tactical message locally via BroadcastChannel (offline mesh simulation)
 */
function broadcastToLocalMesh(msg: TacticalMessage) {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;
  try {
    const channel = new BroadcastChannel("sandya_mesh_transport_v1");
    const senderId = (msg.senderPeerId || "USR-001").replace(/[^a-fA-F0-9]/g, "").padStart(16, "0").slice(0, 16);
    const payload = Buffer.from(
      JSON.stringify({
        id: msg.id,
        channel: msg.channel,
        senderName: msg.senderName,
        content: msg.textContent || (msg.contentType === "ALERT" ? msg.textContent : "Pesan Suara PTT"),
        isUrgent: msg.isUrgent,
      }),
      "utf8"
    );
    const headerBuf = Buffer.alloc(28);
    headerBuf.writeUInt8(0x02, 0); // version
    headerBuf.writeUInt8(msg.isUrgent ? 0x02 : 0x03, 1); // TACTICAL_BROADCAST : TACTICAL_DIRECT_MSG
    headerBuf.writeUInt8(7, 2); // ttl
    headerBuf.writeUInt8(0, 3); // flags
    headerBuf.writeUInt32BE(Math.floor(Date.now() / 1000), 4);
    const senderBuf = Buffer.from(senderId, "hex");
    senderBuf.copy(headerBuf, 8, 0, 8);
    const recipientBuf = Buffer.from("0000000000000000", "hex");
    recipientBuf.copy(headerBuf, 16, 0, 8);
    headerBuf.writeUInt16BE(1, 24); // seq
    headerBuf.writeUInt16BE(payload.length, 26);
    const rawPacket = Buffer.concat([headerBuf, payload]);
    channel.postMessage(rawPacket.toString("base64"));
    channel.close();
  } catch {
    // Non-blocking
  }
}

export interface PoskoState {
  // Session
  session: ActiveSession;
  setSessionRole: (role: UserRole) => void;
  setSessionPosko: (poskoId: string, poskoName: string) => void;
  setSessionMission: (missionId: string, missionName: string) => void;
  setSessionOrg: (orgId: string, orgName: string) => void;
  setSessionUser: (userId: string, userName: string) => void;
  setFullSession: (session: Partial<ActiveSession>) => void;

  // Level 1: Organizations & Missions
  organizations: Organization[];
  addOrganization: (org: Omit<Organization, "id" | "createdAt">) => Organization;
  updateOrganization: (orgId: string, data: Partial<Omit<Organization, "id" | "createdAt">>) => void;
  deleteOrganization: (orgId: string) => void;
  missions: DisasterMission[];
  addMission: (mission: Omit<DisasterMission, "id" | "createdAt">) => DisasterMission;
  updateMission: (missionId: string, data: Partial<Omit<DisasterMission, "id" | "createdAt">>) => void;
  deleteMission: (missionId: string) => void;
  closeMission: (missionId: string) => void;

  // Level 2: Posko Directory & Central Logistics
  poskos: Posko[];
  addPosko: (posko: Omit<Posko, "id" | "createdAt" | "currentRefugees">) => Posko;
  updatePosko: (poskoId: string, data: Partial<Omit<Posko, "id" | "createdAt">>) => void;
  deletePosko: (poskoId: string) => void;
  updatePoskoStatus: (poskoId: string, status: PostStatus) => void;
  centralInventory: InventoryItem[];
  missionWaybills: MacroWaybill[];
  issueMissionWaybill: (waybill: Omit<MacroWaybill, "id" | "dispatchedAt">) => void;
  updateWaybillStatus: (waybillId: string, status: MacroWaybill["status"]) => void;
  receiveWaybill: (waybillId: string) => void;

  // Level 3: Refugees & Intake
  refugees: DisasterPerson[];
  refugeeEvents: RefugeeEvent[];
  addRefugee: (refugee: Omit<DisasterPerson, "createdAt"> & { id?: string }) => void;
  updateRefugee: (refugeeId: string, data: Partial<Omit<DisasterPerson, "id" | "createdAt">>) => void;
  deleteRefugee: (refugeeId: string) => void;
  importRefugeeBatch: (persons: Array<Omit<DisasterPerson, "id" | "createdAt"> & { id?: string }>) => void;
  updateRefugeeTriage: (refugeeId: string, triage: TriageCategory) => void;
  addRefugeeEvent: (event: Omit<RefugeeEvent, "id" | "deviceTimestamp"> & { id?: string; deviceTimestamp?: number }) => void;

  // Level 3: Inventory & Single-Writer Ledger
  inventory: InventoryItem[];
  transactions: InventoryTransaction[];
  importInventoryBatch: (items: Array<Omit<InventoryItem, "id" | "postId" | "lastUpdatedAt" | "burnRateDays">>) => void;
  importTransactionBatch: (txs: Array<Omit<InventoryTransaction, "postId"> & { postId?: string }>) => void;
  addRestock: (itemName: string, category: InventoryItem["category"], qty: number, unit: string, id?: string, targetPoskoId?: string) => void;
  recordDamageStock: (itemId: string, qty: number, reason?: string) => boolean;
  updateInventoryItem: (itemId: string, data: Partial<Omit<InventoryItem, "id">>) => void;
  deleteInventoryItem: (itemId: string) => void;
  allocateStock: (ticketId: string, itemId: string, qty: number) => boolean;

  // Level 3: Needs Requests & Distribution
  needsTickets: NeedsTicket[];
  importNeedsTicketsBatch: (tickets: NeedsTicket[]) => void;
  createNeedsTicket: (ticket: Omit<NeedsTicket, "id" | "createdAt" | "status">) => void;
  cancelNeedsTicket: (ticketId: string, reason?: string) => void;
  completeDelivery: (ticketId: string) => void;
  handleRefugeeDeceasedResolution: (params: {
    refugeeId: string;
    cancelMedicalTickets?: boolean;
    generalLogisticsAction?: "CANCEL_ALL" | "TRANSFER_TO_KIN";
    targetKinName?: string;
    targetKinRefugeeId?: string;
    issueMortuaryKit?: boolean;
    mortuaryItemName?: string;
  }) => void;

  // Level 3: Tactical Chat & PTT Radio
  activeChannel: TacticalChannel;
  setActiveChannel: (channel: TacticalChannel) => void;
  messages: TacticalMessage[];
  sendTextMessage: (channel: TacticalChannel, text: string, isUrgent?: boolean) => void;
  sendVoiceMessage: (
    channel: TacticalChannel,
    durationMs: number,
    audioBase64?: string,
    audioWaveform?: number[]
  ) => void;
  triggerSOS: (hazardType: string) => void;
  clearChannelMessages: (channel: TacticalChannel) => void;
  addIncomingMessage: (msg: TacticalMessage) => void;
  importMessagesBatch: (messages: TacticalMessage[]) => void;
  refreshActivePeers: () => void;

  // AI Provider & OCR Gateway (BYOK)
  aiProvider: "SANDYA_GATEWAY" | "GEMINI" | "OPENAI" | "CUSTOM_ENDPOINT" | "OFFLINE_ONLY";
  aiApiKey: string;
  aiBaseUrl: string;
  aiModelName: string;
  setAIConfig: (config: {
    provider: "SANDYA_GATEWAY" | "GEMINI" | "OPENAI" | "CUSTOM_ENDPOINT" | "OFFLINE_ONLY";
    apiKey?: string;
    baseUrl?: string;
    modelName?: string;
  }) => void;

  // Mesh & Sync
  peers: MeshPeer[];
  setPeers: (peers: MeshPeer[]) => void;
  pendingOutboxCount: number;
  lastSyncedAt: number;
  cloudProvider: "MANAGED" | "BYOC";
  cloudEndpoint: string;
  isCloudSyncing: boolean;
  setCloudProvider: (provider: "MANAGED" | "BYOC", endpoint?: string) => void;
  triggerCloudSync: () => Promise<{ success: boolean; message: string }>;
  simulateSync: () => void;
  hydrateStore: (data: {
    inventory?: InventoryItem[];
    refugees?: DisasterPerson[];
    refugeeEvents?: RefugeeEvent[];
    needsTickets?: NeedsTicket[];
  }) => void;
  resetLocalData: () => void;
}

export const usePoskoStore = create<PoskoState>()(
  persist(
    (set, get) => ({
      // Default Session (uninitialized or configured by active user)
      session: {
        userId: "USR-001",
        userName: "Petugas Posko",
        userRole: "KOORDINATOR_POSKO",
        orgId: "",
        orgName: "",
        missionId: "",
        missionName: "",
        poskoId: "",
        poskoName: "",
      },
      setSessionRole: (role) =>
        set((state) => ({ session: { ...state.session, userRole: role } })),
      setSessionPosko: (poskoId, poskoName) =>
        set((state) => ({ session: { ...state.session, poskoId, poskoName } })),
      setSessionMission: (missionId, missionName) =>
        set((state) => ({ session: { ...state.session, missionId, missionName } })),
      setSessionOrg: (orgId, orgName) =>
        set((state) => ({ session: { ...state.session, orgId, orgName } })),
      setSessionUser: (userId, userName) =>
        set((state) => ({ session: { ...state.session, userId, userName } })),
      setFullSession: (sessionData) =>
        set((state) => ({ session: { ...state.session, ...sessionData } })),

      // Level 1: Organizations (Pristine - Zero Mock Data)
      organizations: [],

      addOrganization: (orgData) => {
        const existingIds = new Set(get().organizations.map((o) => o.id));
        let nextIdx = get().organizations.length + 1;
        let candidateId = `ORG-${String(nextIdx).padStart(2, "0")}`;
        while (existingIds.has(candidateId)) {
          nextIdx++;
          candidateId = `ORG-${String(nextIdx).padStart(2, "0")}`;
        }
        const newOrg: Organization = {
          ...orgData,
          id: candidateId,
          createdAt: Date.now(),
        };
        set((state) => ({
          organizations: [newOrg, ...state.organizations],
          session: state.session.orgId
            ? state.session
            : { ...state.session, orgId: newOrg.id, orgName: newOrg.name },
        }));
        return newOrg;
      },

      updateOrganization: (orgId, data) => {
        set((state) => {
          const existing = state.organizations.find((o) => o.id === orgId);
          let updatedOrgs: Organization[];
          if (existing) {
            updatedOrgs = state.organizations.map((o) =>
              o.id === orgId ? { ...o, ...data } : o
            );
          } else {
            const newOrg: Organization = {
              id: orgId,
              name: data.name || state.session.orgName || "Organisasi Baru",
              category: data.category || "BPBD_PEMERINTAH",
              masterPubkey: data.masterPubkey || `did:sandya:org_${orgId}`,
              contactNumber: data.contactNumber,
              headquartersAddress: data.headquartersAddress,
              createdAt: Date.now(),
            };
            updatedOrgs = [newOrg, ...state.organizations];
          }

          return {
            organizations: updatedOrgs,
            session:
              state.session.orgId === orgId && data.name
                ? { ...state.session, orgName: data.name }
                : state.session,
          };
        });
      },

      deleteOrganization: (orgId) => {
        set((state) => ({
          organizations: state.organizations.filter((o) => o.id !== orgId),
        }));
      },

      // Level 1: Disaster Missions (Pristine - Zero Mock Data)
      missions: [],

      addMission: (missionData) => {
        const existingIds = new Set(get().missions.map((m) => m.id));
        const year = new Date().getFullYear();
        let nextIdx = get().missions.length + 1;
        let candidateId = `MSN-${year}-${String(nextIdx).padStart(2, "0")}`;
        while (existingIds.has(candidateId)) {
          nextIdx++;
          candidateId = `MSN-${year}-${String(nextIdx).padStart(2, "0")}`;
        }
        const newMission: DisasterMission = {
          ...missionData,
          id: candidateId,
          createdAt: Date.now(),
        };
        set((state) => ({
          missions: [newMission, ...state.missions],
          session: state.session.missionId
            ? state.session
            : { ...state.session, missionId: newMission.id, missionName: newMission.name },
        }));
        return newMission;
      },

      updateMission: (missionId, data) => {
        set((state) => ({
          missions: state.missions.map((m) =>
            m.id === missionId ? { ...m, ...data } : m
          ),
          session:
            state.session.missionId === missionId && data.name
              ? { ...state.session, missionName: data.name }
              : state.session,
        }));
      },

      deleteMission: (missionId) => {
        set((state) => ({
          missions: state.missions.filter((m) => m.id !== missionId),
          poskos: state.poskos.filter((p) => p.missionId !== missionId),
        }));
      },

      closeMission: (missionId) => {
        set((state) => ({
          missions: state.missions.map((m) =>
            m.id === missionId ? { ...m, status: "CLOSED_ARCHIVED" as const } : m
          ),
        }));
      },

      // Level 2: Posko Directory (Pristine - Zero Mock Data)
      poskos: [],

      addPosko: (poskoData) => {
        const existingIds = new Set(get().poskos.map((p) => p.id));
        let nextIdx = get().poskos.length + 1;
        let candidateId = `POS-${String(nextIdx).padStart(2, "0")}`;
        while (existingIds.has(candidateId)) {
          nextIdx++;
          candidateId = `POS-${String(nextIdx).padStart(2, "0")}`;
        }
        const newPosko: Posko = {
          ...poskoData,
          id: candidateId,
          currentRefugees: 0,
          createdAt: Date.now(),
        };
        set((state) => ({
          poskos: [...state.poskos, newPosko],
          session: {
            ...state.session,
            poskoId: newPosko.id,
            poskoName: newPosko.name,
            ...(newPosko.missionId ? { missionId: newPosko.missionId } : {}),
          },
        }));
        return newPosko;
      },

  updatePosko: (poskoId, data) => {
  set((state) => ({
  poskos: state.poskos.map((p) =>
  p.id === poskoId ? { ...p, ...data } : p
  ),
  session:
  state.session.poskoId === poskoId && data.name
  ? { ...state.session, poskoName: data.name }
  : state.session,
  }));
  },

  deletePosko: (poskoId) => {
  set((state) => ({
  poskos: state.poskos.filter((p) => p.id !== poskoId),
  }));
  },

  updatePoskoStatus: (poskoId, status) => {
  set((state) => ({
  poskos: state.poskos.map((p) =>
  p.id === poskoId ? { ...p, status } : p
  ),
  }));
  },

  // Level 2: Central Warehouse Inventory (Pristine)
  centralInventory: [],

  // Level 2: Macro Waybills (Pristine)
  missionWaybills: [],

  issueMissionWaybill: (waybillData) => {
  const newWaybill: MacroWaybill = {
  ...waybillData,
  id: `MWB-${String(get().missionWaybills.length + 1).padStart(2, "0")}`,
  dispatchedAt: Date.now(),
  };
  set((state) => ({
  missionWaybills: [newWaybill, ...state.missionWaybills],
  }));
  },

  updateWaybillStatus: (waybillId, status) => {
  set((state) => ({
  missionWaybills: state.missionWaybills.map((w) =>
  w.id === waybillId ? { ...w, status } : w
  ),
  }));
  },

  receiveWaybill: (waybillId) => {
  const wb = get().missionWaybills.find((w) => w.id === waybillId);
  if (!wb) return;
  set((state) => ({
  missionWaybills: state.missionWaybills.map((w) =>
  w.id === waybillId ? { ...w, status: "ARRIVED" as const } : w
  ),
  }));
  const catMap: Record<string, InventoryItem["category"]> = {
  Beras: "FOOD",
  Susu: "BABY_SUPPLIES",
  Selimut: "CLOTHING",
  Tenda: "SHELTER",
  Paracetamol: "MEDICAL",
  Sabun: "HYGIENE",
  };
  let cat: InventoryItem["category"] = "FOOD";
  for (const [key, c] of Object.entries(catMap)) {
  if (wb.itemName.toLowerCase().includes(key.toLowerCase())) {
  cat = c;
  break;
  }
  }
  get().addRestock(wb.itemName, cat, wb.quantity, wb.unit, undefined, wb.targetPoskoId);
  },

      // Level 3: Refugees (Pristine - Zero Mock Data)
      refugees: [],
      refugeeEvents: [],

      addRefugee: (refugee) => {
        const state = get();
        if (refugee.nik) {
          const existing = state.refugees.find((r) => r.nik && r.nik === refugee.nik);
          if (existing) {
            set((s) => ({
              refugees: s.refugees.map((r) =>
                r.id === existing.id ? { ...r, ...refugee } : r
              ),
              pendingOutboxCount: s.pendingOutboxCount + 1,
            }));
            return;
          }
        }
        const newPerson: DisasterPerson = {
          ...refugee,
          id: refugee.id || `REF-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_RANGE)}`,
          createdAt: Date.now(),
        };

        const intakeEvent: RefugeeEvent = {
          id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          refugeeId: newPerson.id,
          authorId: newPerson.registeredByUserId || state.session.userId || "USR-001",
          authorName: newPerson.registeredByUserName || state.session.userName || "Petugas Registrasi",
          authorRole: (state.session.userRole as UserRole) || "PETUGAS_REGISTRASI",
          eventType: "INTAKE",
          eventPayload: {
            fullName: newPerson.fullName,
            gender: newPerson.gender,
            age: newPerson.age,
            shelterLocation: newPerson.shelterLocation,
            vulnerabilities: newPerson.vulnerabilities,
            urgentNeeds: newPerson.urgentNeeds,
          },
          deviceTimestamp: Date.now(),
          logicalSeq: 1,
        };

        const generatedTickets: NeedsTicket[] = [];
        if (refugee.urgentNeeds && refugee.urgentNeeds.length > 0) {
          refugee.urgentNeeds.forEach((need, idx) => {
            generatedTickets.push({
              id: `TKT-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_RANGE)}${idx}`,
              refugeeId: newPerson.id,
              refugeeName: newPerson.fullName,
              shelterLocation: newPerson.shelterLocation,
              postId: newPerson.postId,
              itemName: need,
              quantity: 1,
              unit: need.toLowerCase().includes("beras") ? "karung" : need.toLowerCase().includes("galon") ? "galon" : "paket",
              status: "PENDING",
              urgency: "HIGH",
              createdByUserId: newPerson.registeredByUserId,
              createdByUserName: newPerson.registeredByUserName,
              createdAt: Date.now(),
            });
          });
        }

        set((s) => ({
          refugees: [newPerson, ...s.refugees],
          refugeeEvents: [intakeEvent, ...s.refugeeEvents],
          poskos: s.poskos.map((p) =>
            p.id === newPerson.postId
              ? { ...p, currentRefugees: (p.currentRefugees || 0) + 1 }
              : p
          ),
          needsTickets: [...generatedTickets, ...s.needsTickets],
          pendingOutboxCount: s.pendingOutboxCount + 1 + generatedTickets.length,
        }));

        triggerInstantPush(async (cloudSync) => {
          await cloudSync.syncPoskos(get().poskos);
          await cloudSync.syncRefugees([newPerson]);
          await cloudSync.syncRefugeeEvents([intakeEvent]);
          if (generatedTickets.length > 0) {
            await cloudSync.syncNeedsTickets(generatedTickets);
          }
        });
      },

      updateRefugee: (refugeeId, data) => {
        const state = get();
        const updated = state.refugees.map((r) =>
          r.id === refugeeId ? { ...r, ...data } : r
        );
        const target = updated.find((r) => r.id === refugeeId);
        set((s) => ({
          refugees: updated,
          pendingOutboxCount: s.pendingOutboxCount + 1,
        }));

        if (target) {
          triggerInstantPush(async (cloudSync) => {
            await cloudSync.syncRefugees([target]);
          });
        }
      },

      deleteRefugee: (refugeeId) => {
        const target = get().refugees.find((r) => r.id === refugeeId);
        set((state) => ({
          refugees: state.refugees.filter((r) => r.id !== refugeeId),
          refugeeEvents: state.refugeeEvents.filter((e) => e.refugeeId !== refugeeId),
          poskos: target
            ? state.poskos.map((p) =>
                p.id === target.postId
                  ? { ...p, currentRefugees: Math.max(0, (p.currentRefugees || 1) - 1) }
                  : p
              )
            : state.poskos,
          pendingOutboxCount: state.pendingOutboxCount + 1,
        }));
      },

      importRefugeeBatch: (persons) => {
        const state = get();
        const currentList = [...state.refugees];
        const currentEvents = [...state.refugeeEvents];
        const newTickets: NeedsTicket[] = [];
        const newRefugeesToPush: DisasterPerson[] = [];
        const newEventsToPush: RefugeeEvent[] = [];
        let newAddedCount = 0;

        for (const p of persons) {
          const existingIdx = currentList.findIndex((r) => {
            if (p.id && r.id && p.id === r.id) return true;
            if (p.nik && r.nik && p.nik === r.nik) return true;
            const matchName = r.fullName.trim().toLowerCase() === p.fullName.trim().toLowerCase();
            const matchGender = r.gender === p.gender;
            const matchAge = r.age === p.age;
            const matchDomicile = (!p.domicileOrigin && !r.domicileOrigin) || (p.domicileOrigin === r.domicileOrigin);
            return matchName && matchGender && matchAge && matchDomicile;
          });

          if (existingIdx >= 0) {
            currentList[existingIdx] = {
              ...currentList[existingIdx],
              ...p,
              id: currentList[existingIdx].id,
              postId: p.postId || currentList[existingIdx].postId,
              missingKinName: p.missingKinName !== undefined ? p.missingKinName : currentList[existingIdx].missingKinName,
              vulnerabilities: p.vulnerabilities || currentList[existingIdx].vulnerabilities,
              urgentNeeds: p.urgentNeeds || currentList[existingIdx].urgentNeeds,
              createdAt: currentList[existingIdx].createdAt,
            };
            newRefugeesToPush.push(currentList[existingIdx]);
          } else {
            const newPerson: DisasterPerson = {
              ...p,
              id: p.id || `REF-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_RANGE)}`,
              createdAt: Date.now(),
            };
            currentList.unshift(newPerson);
            newRefugeesToPush.push(newPerson);
            newAddedCount++;

            const intakeEvt: RefugeeEvent = {
              id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              refugeeId: newPerson.id,
              authorId: newPerson.registeredByUserId || state.session.userId || "USR-001",
              authorName: newPerson.registeredByUserName || state.session.userName || "Petugas Registrasi",
              authorRole: (state.session.userRole as UserRole) || "PETUGAS_REGISTRASI",
              eventType: "INTAKE",
              eventPayload: {
                fullName: newPerson.fullName,
                gender: newPerson.gender,
                age: newPerson.age,
                shelterLocation: newPerson.shelterLocation,
                vulnerabilities: newPerson.vulnerabilities,
                urgentNeeds: newPerson.urgentNeeds,
              },
              deviceTimestamp: Date.now(),
              logicalSeq: 1,
            };
            currentEvents.unshift(intakeEvt);
            newEventsToPush.push(intakeEvt);

            if (newPerson.urgentNeeds && newPerson.urgentNeeds.length > 0) {
              newPerson.urgentNeeds.forEach((need, idx) => {
                newTickets.push({
                  id: `TKT-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_RANGE)}${idx}`,
                  refugeeId: newPerson.id,
                  refugeeName: newPerson.fullName,
                  shelterLocation: newPerson.shelterLocation,
                  postId: newPerson.postId,
                  itemName: need,
                  quantity: 1,
                  unit: need.toLowerCase().includes("beras") ? "karung" : need.toLowerCase().includes("galon") ? "galon" : "paket",
                  status: "PENDING",
                  urgency: "HIGH",
                  createdByUserId: newPerson.registeredByUserId,
                  createdByUserName: newPerson.registeredByUserName,
                  createdAt: Date.now(),
                });
              });
            }
          }
        }

        set((s) => ({
          refugees: currentList,
          refugeeEvents: currentEvents,
          needsTickets: [...newTickets, ...s.needsTickets],
          pendingOutboxCount: s.pendingOutboxCount + newAddedCount + newTickets.length,
        }));

        triggerInstantPush(async (cloudSync) => {
          await cloudSync.syncPoskos(get().poskos);
          if (newRefugeesToPush.length > 0) {
            await cloudSync.syncRefugees(newRefugeesToPush);
          }
          if (newEventsToPush.length > 0) {
            await cloudSync.syncRefugeeEvents(newEventsToPush);
          }
          if (newTickets.length > 0) {
            await cloudSync.syncNeedsTickets(newTickets);
          }
        });
      },

      updateRefugeeTriage: (refugeeId, triage) => {
        const state = get();
        const updatedRefugees = state.refugees.map((r) =>
          r.id === refugeeId ? { ...r, triageStatus: triage } : r
        );
        const target = updatedRefugees.find((r) => r.id === refugeeId);

        const triageEvent: RefugeeEvent = {
          id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          refugeeId,
          authorId: state.session.userId || "USR-001",
          authorName: state.session.userName || "Petugas Medis",
          authorRole: (state.session.userRole as UserRole) || "PETUGAS_MEDIS",
          eventType: "TRIAGE_UPDATE",
          eventPayload: { triageStatus: triage },
          deviceTimestamp: Date.now(),
          logicalSeq: (state.refugeeEvents.filter((e) => e.refugeeId === refugeeId).length + 1),
        };

        set((s) => ({
          refugees: updatedRefugees,
          refugeeEvents: [triageEvent, ...s.refugeeEvents],
          pendingOutboxCount: s.pendingOutboxCount + 1,
        }));

        triggerInstantPush(async (cloudSync) => {
          if (target) await cloudSync.syncRefugees([target]);
          await cloudSync.syncRefugeeEvents([triageEvent]);
        });
      },

      addRefugeeEvent: (event) => {
        const state = get();
        const newEvt: RefugeeEvent = {
          ...event,
          id: event.id || `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          deviceTimestamp: event.deviceTimestamp || Date.now(),
          logicalSeq: event.logicalSeq || (state.refugeeEvents.filter((e) => e.refugeeId === event.refugeeId).length + 1),
        };

        set((s) => ({
          refugeeEvents: [newEvt, ...s.refugeeEvents],
          pendingOutboxCount: s.pendingOutboxCount + 1,
        }));

        triggerInstantPush(async (cloudSync) => {
          await cloudSync.syncRefugeeEvents([newEvt]);
        });
      },

  // Level 3: Inventory (Pristine - Zero Mock Data)
  inventory: [],
  transactions: [],

  importInventoryBatch: (items) => {
    set((state) => {
      const currentList = [...state.inventory];
      let newAddedCount = 0;

      for (const item of items) {
        const existingIdx = currentList.findIndex((i) => 
          i.itemName.toLowerCase() === item.itemName.toLowerCase() && 
          i.category === item.category &&
          i.unit.toLowerCase() === item.unit.toLowerCase()
        );

        if (existingIdx >= 0) {
          // Idempotent upsert: perbarui kuantitas (menggunakan nilai dari QR yang menjadi source of truth dari Posko asal)
          currentList[existingIdx] = {
            ...currentList[existingIdx],
            currentQuantity: item.currentQuantity,
            lastUpdatedAt: Date.now(),
          };
        } else {
          // Tambah item baru
          currentList.unshift({
            ...item,
            id: `INV-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_RANGE)}`,
            postId: state.session.poskoId,
            burnRateDays: POSKO_STORE_CONSTANTS.DEFAULT_BURN_RATE_DAYS,
            lastUpdatedAt: Date.now(),
          });
          newAddedCount++;
        }
      }

      return {
        inventory: currentList,
        pendingOutboxCount: state.pendingOutboxCount + newAddedCount,
      };
    });
  },

  importTransactionBatch: (txs) => {
    set((state) => {
      const currentList = [...state.transactions];
      const existingIds = new Set(currentList.map((t) => t.id));
      let newAddedCount = 0;

      for (const tx of txs) {
        if (!existingIds.has(tx.id)) {
          currentList.unshift({
            ...tx,
            postId: tx.postId || state.session.poskoId,
            deviceTimestamp: tx.deviceTimestamp || Date.now(),
          });
          existingIds.add(tx.id);
          newAddedCount++;
        }
      }

      return {
        transactions: currentList,
        pendingOutboxCount: state.pendingOutboxCount + newAddedCount,
      };
    });
  },

  addRestock: (itemName, category, qty, unit, id, targetPoskoId) => {
    const state = get();
    const currentPoskoId = targetPoskoId || state.session.poskoId;
    const existingIndex = state.inventory.findIndex(
      (i) => i.itemName.toLowerCase() === itemName.toLowerCase() && i.postId === currentPoskoId
    );
    const updatedInventory = [...state.inventory];
    let itemId =
      id ||
      (existingIndex >= 0
        ? updatedInventory[existingIndex].id
        : `INV-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_RANGE)}`);

    if (existingIndex >= 0) {
      if (id) {
        itemId = id;
      } else {
        itemId = updatedInventory[existingIndex].id;
      }
      updatedInventory[existingIndex] = {
        ...updatedInventory[existingIndex],
        id: itemId,
        postId: currentPoskoId,
        currentQuantity: updatedInventory[existingIndex].currentQuantity + qty,
        lastUpdatedAt: Date.now(),
      };
    } else {
      updatedInventory.push({
        id: itemId,
        postId: currentPoskoId,
        itemName,
        category,
        currentQuantity: qty,
        unit,
        burnRateDays: POSKO_STORE_CONSTANTS.DEFAULT_BURN_RATE_DAYS,
        lastUpdatedAt: Date.now(),
      });
    }

    const tx: InventoryTransaction = {
      id: `TX-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_RANGE)}`,
      itemId,
      postId: currentPoskoId,
      officerId: state.session.userId,
      officerName: state.session.userName,
      txType: "RESTOCK",
      quantityChange: qty,
      note: "Penerimaan barang masuk gudang",
      deviceTimestamp: Date.now(),
    };

    set({
      inventory: updatedInventory,
      transactions: [tx, ...state.transactions],
      pendingOutboxCount: state.pendingOutboxCount + 1,
    });
  },

  recordDamageStock: (itemId, qty, reason) => {
    const state = get();
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item || item.currentQuantity < qty || qty <= 0) return false;

    const updatedInventory = state.inventory.map((i) =>
      i.id === itemId
        ? { ...i, currentQuantity: i.currentQuantity - qty, lastUpdatedAt: Date.now() }
        : i
    );

    const tx: InventoryTransaction = {
      id: `TX-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_RANGE)}`,
      itemId,
      postId: item.postId || state.session.poskoId,
      officerId: state.session.userId,
      officerName: state.session.userName,
      txType: "DAMAGE",
      quantityChange: -qty,
      note: reason || "Pencatatan barang rusak / kadaluwarsa",
      deviceTimestamp: Date.now(),
    };

    set({
      inventory: updatedInventory,
      transactions: [tx, ...state.transactions],
      pendingOutboxCount: state.pendingOutboxCount + 1,
    });

    return true;
  },

  updateInventoryItem: (itemId, data) => {
  set((state) => ({
  inventory: state.inventory.map((i) =>
  i.id === itemId ? { ...i, ...data, lastUpdatedAt: Date.now() } : i
  ),
  pendingOutboxCount: state.pendingOutboxCount + 1,
  }));
  },

  deleteInventoryItem: (itemId) => {
  set((state) => ({
  inventory: state.inventory.filter((i) => i.id !== itemId),
  pendingOutboxCount: state.pendingOutboxCount + 1,
  }));
  },

  allocateStock: (ticketId, itemId, qty) => {
  const state = get();
  const item = state.inventory.find((i) => i.id === itemId);
  if (!item || item.currentQuantity < qty) return false;

  const updatedInventory = state.inventory.map((i) =>
  i.id === itemId
  ? { ...i, currentQuantity: i.currentQuantity - qty, lastUpdatedAt: Date.now() }
  : i
  );

  const updatedTickets = state.needsTickets.map((t) =>
  t.id === ticketId
  ? { ...t, status: "ALLOCATED" as const, allocatedByUserId: state.session.userId }
  : t
  );

  const tx: InventoryTransaction = {
  id: `TX-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_RANGE)}`,
  itemId,
  postId: state.session.poskoId,
  officerId: state.session.userId,
  officerName: state.session.userName,
  txType: "DISTRIBUTION",
  quantityChange: -qty,
  referenceTicketId: ticketId,
  note: "Alokasi tiket kebutuhan warga",
  deviceTimestamp: Date.now(),
  };

  set({
  inventory: updatedInventory,
  needsTickets: updatedTickets,
  transactions: [tx, ...state.transactions],
  pendingOutboxCount: state.pendingOutboxCount + 1,
  });

  return true;
  },

  // Needs Tickets (Pristine - Zero Mock Data)
  needsTickets: [],

  importNeedsTicketsBatch: (tickets) => {
    set((state) => {
      const existingMap = new Map(state.needsTickets.map((t) => [t.id, t]));
      let newCount = 0;
      for (const tkt of tickets) {
        const existing = existingMap.get(tkt.id);
        if (!existing) {
          existingMap.set(tkt.id, {
            ...tkt,
            postId: tkt.postId || state.session.poskoId,
          });
          newCount++;
        } else {
          existingMap.set(tkt.id, {
            ...existing,
            ...tkt,
          });
        }
      }
      return {
        needsTickets: Array.from(existingMap.values()),
        pendingOutboxCount: state.pendingOutboxCount + newCount,
      };
    });
  },

  createNeedsTicket: (ticket) => {
  const newTicket: NeedsTicket = {
  ...ticket,
  id: `TKT-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_RANGE)}`,
  status: "PENDING",
  createdAt: Date.now(),
  };
  set((state) => ({
  needsTickets: [newTicket, ...state.needsTickets],
  pendingOutboxCount: state.pendingOutboxCount + 1,
  }));
  },

  cancelNeedsTicket: (ticketId, reason) => {
    set((state) => ({
      needsTickets: state.needsTickets.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              status: "CANCELLED" as const,
              cancellationReason: reason || "Dibatalkan oleh petugas",
            }
          : t
      ),
      pendingOutboxCount: state.pendingOutboxCount + 1,
    }));
  },

  completeDelivery: (ticketId) => {
    set((state) => ({
      needsTickets: state.needsTickets.map((t) =>
        t.id === ticketId
          ? { ...t, status: "COMPLETED" as const, completedAt: Date.now() }
          : t
      ),
      pendingOutboxCount: state.pendingOutboxCount + 1,
    }));
  },

  handleRefugeeDeceasedResolution: (params) => {
    const state = get();
    const targetRefugee = state.refugees.find((r) => r.id === params.refugeeId);
    if (!targetRefugee) return;

    const cancelMed = params.cancelMedicalTickets ?? true;
    const genAction = params.generalLogisticsAction ?? "CANCEL_ALL";
    const now = Date.now();

    // 1. Update refugee triage status to BLACK
    const updatedRefugees = state.refugees.map((r) =>
      r.id === params.refugeeId ? { ...r, triageStatus: "BLACK" as const } : r
    );

    let currentInventory = [...state.inventory];
    const newTransactions: InventoryTransaction[] = [];
    const updatedTickets = [...state.needsTickets];

    // Helper to identify medical items
    const isMedical = (name: string) => {
      const lower = name.toLowerCase();
      const medicalTokens = [
        "obat", "medis", "paracetamol", "amoxicillin", "oralit", "infus",
        "p3k", "vitamin", "salep", "antibiotik", "antasida", "captopril",
        "ibuprofen", "dexamethasone", "kasa", "perban", "betadine", "injeksi"
      ];
      return medicalTokens.some((t) => lower.includes(t));
    };

    for (let i = 0; i < updatedTickets.length; i++) {
      const t = updatedTickets[i];
      if (
        t.refugeeId !== params.refugeeId &&
        t.refugeeName.toLowerCase() !== targetRefugee.fullName.toLowerCase()
      ) {
        continue;
      }

      if (t.status === "COMPLETED" || t.status === "REJECTED" || t.status === "CANCELLED") {
        continue;
      }

      const itemIsMed = isMedical(t.itemName);

      if (itemIsMed && cancelMed) {
        // Rollback inventory allocation if previously allocated
        if (t.status === "ALLOCATED") {
          const invIdx = currentInventory.findIndex(
            (inv) =>
              inv.itemName.toLowerCase().includes(t.itemName.toLowerCase()) ||
              t.itemName.toLowerCase().includes(inv.itemName.toLowerCase())
          );
          if (invIdx >= 0) {
            const inv = currentInventory[invIdx];
            currentInventory[invIdx] = {
              ...inv,
              currentQuantity: inv.currentQuantity + t.quantity,
              lastUpdatedAt: now,
            };
            newTransactions.push({
              id: `TX-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_RANGE)}`,
              itemId: inv.id,
              postId: state.session.poskoId,
              officerId: state.session.userId,
              officerName: state.session.userName,
              txType: "RESTOCK",
              quantityChange: t.quantity,
              referenceTicketId: t.id,
              note: `Rollback alokasi obat tiket ${t.id}: Pasien wafat (Triase Hitam)`,
              deviceTimestamp: now,
            });
          }
        }

        updatedTickets[i] = {
          ...t,
          status: "CANCELLED",
          cancellationReason: "Pasien wafat (Triase Hitam / Deceased)",
          note: (t.note ? t.note + " | " : "") + "Dibatalkan otomatis: Pasien wafat.",
        };
      } else if (!itemIsMed) {
        if (genAction === "CANCEL_ALL") {
          if (t.status === "ALLOCATED") {
            const invIdx = currentInventory.findIndex(
              (inv) =>
                inv.itemName.toLowerCase().includes(t.itemName.toLowerCase()) ||
                t.itemName.toLowerCase().includes(inv.itemName.toLowerCase())
            );
            if (invIdx >= 0) {
              const inv = currentInventory[invIdx];
              currentInventory[invIdx] = {
                ...inv,
                currentQuantity: inv.currentQuantity + t.quantity,
                lastUpdatedAt: now,
              };
              newTransactions.push({
                id: `TX-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_RANGE)}`,
                itemId: inv.id,
                postId: state.session.poskoId,
                officerId: state.session.userId,
                officerName: state.session.userName,
                txType: "RESTOCK",
                quantityChange: t.quantity,
                referenceTicketId: t.id,
                note: `Rollback alokasi logistik tiket ${t.id}: Warga wafat (Triase Hitam)`,
                deviceTimestamp: now,
              });
            }
          }

          updatedTickets[i] = {
            ...t,
            status: "CANCELLED",
            cancellationReason: "Warga wafat (Triase Hitam / Deceased)",
            note: (t.note ? t.note + " | " : "") + "Dibatalkan: Warga wafat.",
          };
        } else if (genAction === "TRANSFER_TO_KIN") {
          const kinName =
            params.targetKinName?.trim() ||
            targetRefugee.missingKinName ||
            "Kerabat / Wali Tenda";
          updatedTickets[i] = {
            ...t,
            refugeeName: `${kinName} (Ahli Waris / Tenda ${targetRefugee.shelterLocation})`,
            transferredToRefugeeId: params.targetKinRefugeeId,
            transferredToRefugeeName: kinName,
            note:
              (t.note ? t.note + " | " : "") +
              `Dialihkan dari almarhum ${targetRefugee.fullName} ke ${kinName}.`,
          };
        }
      }
    }

    // Issue mortuary kit if requested
    if (params.issueMortuaryKit) {
      const mortuaryName = params.mortuaryItemName?.trim() || "Kain Kafan & Perlengkapan Jenazah";
      const mortuaryTicket: NeedsTicket = {
        id: `TKT-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_RANGE)}${Date.now().toString().slice(-2)}`,
        refugeeId: targetRefugee.id,
        refugeeName: `Pemulasaran Jenazah Almarhum ${targetRefugee.fullName}`,
        shelterLocation: targetRefugee.shelterLocation,
        postId: targetRefugee.postId || state.session.poskoId,
        itemName: mortuaryName,
        quantity: 1,
        unit: "paket",
        status: "PENDING",
        urgency: "HIGH",
        createdByUserId: state.session.userId,
        createdByUserName: state.session.userName,
        note: `Kebutuhan pemulasaran darurat jenazah almarhum ${targetRefugee.fullName}.`,
        createdAt: now,
      };
      updatedTickets.unshift(mortuaryTicket);
    }

    set({
      refugees: updatedRefugees,
      inventory: currentInventory,
      transactions: [...newTransactions, ...state.transactions],
      needsTickets: updatedTickets,
      pendingOutboxCount: state.pendingOutboxCount + 1 + newTransactions.length,
    });
  },

  // Tactical Chat & PTT (Pristine - Zero Mock Data)
  activeChannel: "POSKO_ALL",
  setActiveChannel: (channel) => set({ activeChannel: channel }),

  messages: [],

  sendTextMessage: (channel, text, isUrgent = false) => {
    const state = get();
    const senderId = state.session.userId || "USR-001";
    const senderName = state.session.userName || "Petugas Lapangan";
    const senderRole = state.session.userRole || "RELAWAN_LAPANGAN";
    const msg: TacticalMessage = {
      id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      channel,
      senderPeerId: senderId,
      senderName,
      senderRole,
      contentType: "TEXT",
      textContent: text,
      isUrgent,
      createdAt: Date.now(),
    };

    const updatedMessages = [...state.messages, msg];
    const updatedPeers = deriveActivePeers(
      updatedMessages,
      state.transactions,
      state.refugees,
      state.session.userId,
      state.session.userName,
      state.session.poskoId
    );

    set((s) => ({
      messages: updatedMessages,
      peers: updatedPeers,
      pendingOutboxCount: s.pendingOutboxCount + 1,
    }));

    broadcastToLocalMesh(msg);

    triggerInstantPush(async (cloudSync) => {
      await cloudSync.syncTacticalMessages([msg]);
    });
  },

  sendVoiceMessage: (channel, durationMs, audioBase64, audioWaveform) => {
    const state = get();
    const senderId = state.session.userId || "USR-001";
    const senderName = state.session.userName || "Petugas Lapangan";
    const senderRole = state.session.userRole || "RELAWAN_LAPANGAN";
    const msg: TacticalMessage = {
      id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      channel,
      senderPeerId: senderId,
      senderName,
      senderRole,
      contentType: "VOICE_NOTE",
      audioDurationMs: durationMs,
      audioWaveform: audioWaveform || [25, 40, 65, 85, 90, 75, 60, 45, 30, 15],
      audioBase64,
      createdAt: Date.now(),
    };

    const updatedMessages = [...state.messages, msg];
    const updatedPeers = deriveActivePeers(
      updatedMessages,
      state.transactions,
      state.refugees,
      state.session.userId,
      state.session.userName,
      state.session.poskoId
    );

    set((s) => ({
      messages: updatedMessages,
      peers: updatedPeers,
      pendingOutboxCount: s.pendingOutboxCount + 1,
    }));

    broadcastToLocalMesh(msg);

    triggerInstantPush(async (cloudSync) => {
      await cloudSync.syncTacticalMessages([msg]);
    });
  },

  clearChannelMessages: (channel) => {
    set((state) => ({
      messages: state.messages.filter((m) => m.channel !== channel),
    }));
  },

  triggerSOS: (hazardType) => {
    const state = get();
    const senderId = state.session.userId || "USR-001";
    const senderName = state.session.userName || "Petugas Lapangan";
    const senderRole = state.session.userRole || "RELAWAN_LAPANGAN";
    const msg: TacticalMessage = {
      id: `MSG-SOS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      channel: "SOS",
      senderPeerId: senderId,
      senderName,
      senderRole,
      contentType: "ALERT",
      textContent: `🚨 PERINGATAN DARURAT: ${hazardType} terdeteksi di sekitar posko! Evakuasi siaga!`,
      isUrgent: true,
      createdAt: Date.now(),
    };

    const updatedMessages = [...state.messages, msg];
    const updatedPeers = deriveActivePeers(
      updatedMessages,
      state.transactions,
      state.refugees,
      state.session.userId,
      state.session.userName,
      state.session.poskoId
    );

    set((s) => ({
      messages: updatedMessages,
      peers: updatedPeers,
      activeChannel: "SOS",
      pendingOutboxCount: s.pendingOutboxCount + 1,
    }));

    broadcastToLocalMesh(msg);

    triggerInstantPush(async (cloudSync) => {
      await cloudSync.syncTacticalMessages([msg]);
    });
  },

  importMessagesBatch: (newMsgs) => {
    set((state) => {
      const existingMap = new Map(state.messages.map((m) => [m.id, m]));
      let added = 0;
      for (const msg of newMsgs) {
        if (!existingMap.has(msg.id)) {
          existingMap.set(msg.id, msg);
          added++;
        }
      }
      if (added === 0) return state;

      const merged = Array.from(existingMap.values()).sort((a, b) => a.createdAt - b.createdAt);
      const updatedPeers = deriveActivePeers(
        merged,
        state.transactions,
        state.refugees,
        state.session.userId,
        state.session.userName,
        state.session.poskoId
      );

      return {
        messages: merged,
        peers: updatedPeers,
      };
    });
  },

  refreshActivePeers: () => {
    set((state) => ({
      peers: deriveActivePeers(
        state.messages,
        state.transactions,
        state.refugees,
        state.session.userId,
        state.session.userName,
        state.session.poskoId
      ),
    }));
  },

  addIncomingMessage: (msg) => {
    set((s) => ({
      messages: s.messages.some((m) => m.id === msg.id) ? s.messages : [...s.messages, msg],
    }));
  },

  // Mesh Peers & Sync (Pristine - Zero Mock Data)
  peers: [],

  pendingOutboxCount: 0,
  lastSyncedAt: Date.now(),
  cloudProvider: "MANAGED",
  cloudEndpoint: "https://api.sandya.id",
  isCloudSyncing: false,

  setCloudProvider: (provider, endpoint) =>
    set({
      cloudProvider: provider,
      cloudEndpoint: endpoint || "https://api.sandya.id",
    }),

      triggerCloudSync: async () => {
        set({ isCloudSyncing: true });
        try {
          const { DEFAULT_CLOUD_CONFIG } = await import("@/infrastructure/config/cloud.config");
          const { CloudSyncService } = await import("@/infrastructure/sync/cloud-sync.service");

          const cloudSync = new CloudSyncService(DEFAULT_CLOUD_CONFIG);
          const state = get();

          // 1. Push hierarchically to satisfy Foreign Key constraints in Supabase
          // Level 0: Organizations
          await cloudSync.syncOrganizations(state.organizations);
          // Level 1: Disaster Missions (FK -> organizations)
          await cloudSync.syncMissions(state.missions);
          // Level 2: Poskos / Posts (FK -> missions, organizations)
          await cloudSync.syncPoskos(state.poskos);
          // Level 3: Refugees & Inventory Items (FK -> posts)
          await cloudSync.syncRefugees(state.refugees);
          await cloudSync.syncInventory(state.inventory, state.transactions);
          // Level 4: Refugee Events & Needs Tickets (FK -> refugees, posts)
          await cloudSync.syncRefugeeEvents(state.refugeeEvents || []);
          await cloudSync.syncNeedsTickets(state.needsTickets);
          // Level 5: Tactical Messages & Outbox Queue
          await cloudSync.syncTacticalMessages(state.messages);
          await cloudSync.pushOutboxToCloud();

          // 2. Pull remote updates from Cloud
          const pullResult = await cloudSync.pullFromCloud(state.session.poskoId);
          if (pullResult.data) {
            const d = pullResult.data;
            set((curr) => {
              // Merge organizations
              const orgMap = new Map(curr.organizations.map((o) => [o.id, o]));
              if (d.organizations && d.organizations.length > 0) {
                for (const o of d.organizations) orgMap.set(o.id, { ...orgMap.get(o.id), ...o });
              }

              // Merge missions
              const msnMap = new Map(curr.missions.map((m) => [m.id, m]));
              if (d.missions && d.missions.length > 0) {
                for (const m of d.missions) msnMap.set(m.id, { ...msnMap.get(m.id), ...m });
              }

              // Merge poskos
              const posMap = new Map(curr.poskos.map((p) => [p.id, p]));
              if (d.poskos && d.poskos.length > 0) {
                for (const p of d.poskos) posMap.set(p.id, { ...posMap.get(p.id), ...p });
              }

              // Merge refugees
              const refMap = new Map(curr.refugees.map((r) => [r.id, r]));
              if (d.refugees && d.refugees.length > 0) {
                for (const r of d.refugees) refMap.set(r.id, { ...refMap.get(r.id), ...r });
              }

              // Merge refugee events
              const evtMap = new Map((curr.refugeeEvents || []).map((e) => [e.id, e]));
              if (d.refugeeEvents && d.refugeeEvents.length > 0) {
                for (const e of d.refugeeEvents) evtMap.set(e.id, { ...evtMap.get(e.id), ...e });
              }

              // Reconcile and dynamically calibrate currentRefugees per posko
              const mergedRefugees = Array.from(refMap.values());
              for (const [pId, pos] of posMap.entries()) {
                const countForPosko = mergedRefugees.filter((r) => r.postId === pId).length;
                posMap.set(pId, { ...pos, currentRefugees: countForPosko });
              }

              // Merge inventory
              const invMap = new Map(curr.inventory.map((i) => [i.id, i]));
              if (d.inventory && d.inventory.length > 0) {
                for (const i of d.inventory) invMap.set(i.id, { ...invMap.get(i.id), ...i });
              }

              // Merge tickets
              const tktMap = new Map(curr.needsTickets.map((t) => [t.id, t]));
              if (d.needsTickets && d.needsTickets.length > 0) {
                for (const t of d.needsTickets) tktMap.set(t.id, { ...tktMap.get(t.id), ...t });
              }

              // Merge messages
              const msgMap = new Map(curr.messages.map((m) => [m.id, m]));
              if (d.messages && d.messages.length > 0) {
                for (const m of d.messages) msgMap.set(m.id, { ...msgMap.get(m.id), ...m });
              }

              const mergedMessages = Array.from(msgMap.values()).sort((a, b) => a.createdAt - b.createdAt);
              const mergedEvents = Array.from(evtMap.values()).sort((a, b) => b.deviceTimestamp - a.deviceTimestamp);
              const updatedPeers = deriveActivePeers(
                mergedMessages,
                curr.transactions,
                mergedRefugees,
                curr.session.userId,
                curr.session.userName,
                curr.session.poskoId
              );

              return {
                organizations: Array.from(orgMap.values()),
                missions: Array.from(msnMap.values()),
                poskos: Array.from(posMap.values()),
                refugees: mergedRefugees,
                refugeeEvents: mergedEvents,
                inventory: Array.from(invMap.values()),
                needsTickets: Array.from(tktMap.values()),
                messages: mergedMessages,
                peers: updatedPeers,
                pendingOutboxCount: 0,
                lastSyncedAt: Date.now(),
                isCloudSyncing: false,
              };
            });
          } else {
            set({
              pendingOutboxCount: 0,
              lastSyncedAt: Date.now(),
              isCloudSyncing: false,
            });
          }

          const finalState = get();
          return {
            success: true,
            message: `Sinkronisasi Supabase Cloud (${
              finalState.cloudProvider === "MANAGED" ? "Cloud Resmi Sandya" : `BYOC: ${finalState.cloudEndpoint}`
            }) berhasil. ${finalState.refugees.length} data warga dan ${finalState.inventory.length} data logistik tersinkron.`,
          };
        } catch (err: unknown) {
          set({ isCloudSyncing: false });
          return {
            success: false,
            message: (err as Error)?.message || "Gagal menghubungi server cloud.",
          };
        }
      },

      // AI Provider & OCR Gateway Config (BYOK)
      aiProvider: "GEMINI",
      aiApiKey: "",
      aiBaseUrl: "",
      aiModelName: "gemini-2.0-flash",
      setAIConfig: (config) =>
        set((state) => ({
          aiProvider: config.provider,
          aiApiKey: config.apiKey !== undefined ? config.apiKey : state.aiApiKey,
          aiBaseUrl: config.baseUrl !== undefined ? config.baseUrl : state.aiBaseUrl,
          aiModelName: config.modelName !== undefined ? config.modelName : state.aiModelName,
        })),

      simulateSync: () => {
        set({
          pendingOutboxCount: 0,
          lastSyncedAt: Date.now(),
        });
      },

      hydrateStore: (data) =>
        set((state) => {
          const existingInvMap = new Map(state.inventory.map((i) => [i.id, i]));
          if (data.inventory) {
            for (const item of data.inventory) {
              existingInvMap.set(item.id, item);
            }
          }

          const existingRefMap = new Map(state.refugees.map((r) => [r.id, r]));
          if (data.refugees) {
            for (const person of data.refugees) {
              existingRefMap.set(person.id, person);
            }
          }

          const existingEvtMap = new Map((state.refugeeEvents || []).map((e) => [e.id, e]));
          if (data.refugeeEvents) {
            for (const evt of data.refugeeEvents) {
              existingEvtMap.set(evt.id, evt);
            }
          }

          const existingTktMap = new Map(state.needsTickets.map((t) => [t.id, t]));
          if (data.needsTickets) {
            for (const tkt of data.needsTickets) {
              existingTktMap.set(tkt.id, tkt);
            }
          }

          return {
            inventory: Array.from(existingInvMap.values()),
            refugees: Array.from(existingRefMap.values()),
            refugeeEvents: Array.from(existingEvtMap.values()),
            needsTickets: Array.from(existingTktMap.values()),
          };
        }),

      setPeers: (peers) => set({ peers }),

      resetLocalData: () => {
        set({
          organizations: [],
          missions: [],
          poskos: [],
          refugees: [],
          inventory: [],
          transactions: [],
          needsTickets: [],
          messages: [],
          peers: [],
          pendingOutboxCount: 0,
        });
      },
    }),
    {
      name: "sandya_offline_posko_v1",
      partialize: (state) => ({
        session: state.session,
        organizations: state.organizations,
        missions: state.missions,
        poskos: state.poskos,
        refugees: state.refugees,
        refugeeEvents: state.refugeeEvents,
        inventory: state.inventory,
        transactions: state.transactions,
        needsTickets: state.needsTickets,
        messages: state.messages,
        pendingOutboxCount: state.pendingOutboxCount,
        lastSyncedAt: state.lastSyncedAt,
        cloudProvider: state.cloudProvider,
        cloudEndpoint: state.cloudEndpoint,
        aiProvider: state.aiProvider,
        aiApiKey: state.aiApiKey,
        aiBaseUrl: state.aiBaseUrl,
        aiModelName: state.aiModelName,
      }),
      onRehydrateStorage: () => (state) => {
        // Ephemeral mesh radio signals must never persist across reloads
        if (state) {
          state.peers = [];
        }
      },
    }
  )
);
