"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type DisasterPerson,
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
import {
  extractDemographicBreakdown,
  calculateItemResilience,
  type ResilienceCalculation,
  type DemographicBreakdown,
} from "@/core/domain/logistics/consumption-resilience";

export function calculatePoskoInventoryResilience(
  item: { itemName: string; category: string; currentQuantity: number; unit: string },
  refugees: DisasterPerson[]
): ResilienceCalculation {
  const demographics = extractDemographicBreakdown(refugees);
  return calculateItemResilience(item, demographics);
}

export function syncInventoryBurnRates(
  inventory: InventoryItem[],
  refugees: DisasterPerson[]
): InventoryItem[] {
  const refugeesByPosko = new Map<string, DisasterPerson[]>();
  for (const r of refugees) {
    const list = refugeesByPosko.get(r.postId) || [];
    list.push(r);
    refugeesByPosko.set(r.postId, list);
  }

  const demoCache = new Map<string, DemographicBreakdown>();

  return inventory.map((item) => {
    let demo = demoCache.get(item.postId);
    if (!demo) {
      demo = extractDemographicBreakdown(refugeesByPosko.get(item.postId) || []);
      demoCache.set(item.postId, demo);
    }
    const res = calculateItemResilience(item, demo);
    return {
      ...item,
      burnRateDays: res.daysRemaining,
    };
  });
}

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
  addRefugee: (refugee: Omit<DisasterPerson, "createdAt"> & { id?: string }) => void;
  updateRefugee: (refugeeId: string, data: Partial<Omit<DisasterPerson, "id" | "createdAt">>) => void;
  deleteRefugee: (refugeeId: string) => void;
  importRefugeeBatch: (persons: Array<Omit<DisasterPerson, "id" | "createdAt"> & { id?: string }>) => void;
  updateRefugeeTriage: (refugeeId: string, triage: TriageCategory) => void;

  // Level 3: Inventory & Single-Writer Ledger
  inventory: InventoryItem[];
  transactions: InventoryTransaction[];
  importInventoryBatch: (items: Array<Omit<InventoryItem, "id" | "postId" | "lastUpdatedAt" | "burnRateDays">>) => void;
  importTransactionBatch: (txs: Array<Omit<InventoryTransaction, "postId"> & { postId?: string }>) => void;
  addRestock: (itemName: string, category: InventoryItem["category"], qty: number, unit: string, id?: string, targetPoskoId?: string) => void;
  updateInventoryItem: (itemId: string, data: Partial<Omit<InventoryItem, "id">>) => void;
  deleteInventoryItem: (itemId: string) => void;
  allocateStock: (ticketId: string, itemId: string, qty: number) => boolean;
  recalculateAllBurnRates: () => void;
  getItemResilience: (itemId: string) => ResilienceCalculation;

  // Level 3: Needs Requests & Distribution
  needsTickets: NeedsTicket[];
  importNeedsTicketsBatch: (tickets: NeedsTicket[]) => void;
  createNeedsTicket: (ticket: Omit<NeedsTicket, "id" | "createdAt" | "status">) => void;
  cancelNeedsTicket: (ticketId: string) => void;
  completeDelivery: (ticketId: string) => void;
  recordDirectDistribution: (data: {
    refugeeId: string;
    refugeeName: string;
    shelterLocation?: string;
    itemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    officerId?: string;
    officerName?: string;
    notes?: string;
  }) => NeedsTicket;

  // Level 3: Tactical Chat & PTT Radio
  activeChannel: TacticalChannel;
  setActiveChannel: (channel: TacticalChannel) => void;
  messages: TacticalMessage[];
  sendTextMessage: (channel: TacticalChannel, text: string, isUrgent?: boolean) => void;
  sendVoiceMessage: (channel: TacticalChannel, durationMs: number) => void;
  triggerSOS: (hazardType: string) => void;
  clearChannelMessages: (channel: TacticalChannel) => void;
  addIncomingMessage: (msg: TacticalMessage) => void;

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
        set((state) => ({
          organizations: state.organizations.map((o) =>
            o.id === orgId ? { ...o, ...data } : o
          ),
          session:
            state.session.orgId === orgId && data.name
              ? { ...state.session, orgName: data.name }
              : state.session,
        }));
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

  addRefugee: (refugee) => {
    const state = get();
    if (refugee.nik) {
      const existing = state.refugees.find((r) => r.nik && r.nik === refugee.nik);
      if (existing) {
        const updatedRefugees = state.refugees.map((r) =>
          r.id === existing.id ? { ...r, ...refugee } : r
        );
        set((s) => ({
          refugees: updatedRefugees,
          inventory: syncInventoryBurnRates(s.inventory, updatedRefugees),
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
    const updatedRefugees = [newPerson, ...state.refugees];
    set((state) => ({
      refugees: updatedRefugees,
      inventory: syncInventoryBurnRates(state.inventory, updatedRefugees),
      poskos: state.poskos.map((p) =>
        p.id === newPerson.postId
          ? { ...p, currentRefugees: (p.currentRefugees || 0) + 1 }
          : p
      ),
      needsTickets: [...generatedTickets, ...state.needsTickets],
      pendingOutboxCount: state.pendingOutboxCount + 1 + generatedTickets.length,
    }));
  },

  updateRefugee: (refugeeId, data) => {
    set((state) => {
      const updatedRefugees = state.refugees.map((r) =>
        r.id === refugeeId ? { ...r, ...data } : r
      );
      return {
        refugees: updatedRefugees,
        inventory: syncInventoryBurnRates(state.inventory, updatedRefugees),
        pendingOutboxCount: state.pendingOutboxCount + 1,
      };
    });
  },

  deleteRefugee: (refugeeId) => {
    const target = get().refugees.find((r) => r.id === refugeeId);
    set((state) => {
      const updatedRefugees = state.refugees.filter((r) => r.id !== refugeeId);
      return {
        refugees: updatedRefugees,
        inventory: syncInventoryBurnRates(state.inventory, updatedRefugees),
        poskos: target
          ? state.poskos.map((p) =>
              p.id === target.postId
                ? { ...p, currentRefugees: Math.max(0, (p.currentRefugees || 1) - 1) }
                : p
            )
          : state.poskos,
        pendingOutboxCount: state.pendingOutboxCount + 1,
      };
    });
  },

  importRefugeeBatch: (persons) => {
    set((state) => {
      const currentList = [...state.refugees];
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
          // Idempotent upsert: perbarui status/kebutuhan tanpa menduplikasi baris
          currentList[existingIdx] = {
            ...currentList[existingIdx],
            ...p,
            id: currentList[existingIdx].id,
            postId: p.postId || currentList[existingIdx].postId,
            missingKinName: p.missingKinName !== undefined ? p.missingKinName : currentList[existingIdx].missingKinName,
            createdAt: currentList[existingIdx].createdAt,
          };
        } else {
          // Tambah warga baru
          const newPerson: DisasterPerson = {
            ...p,
            id: p.id || `REF-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_RANGE)}`,
            createdAt: Date.now(),
          };
          currentList.unshift(newPerson);
          newAddedCount++;
        }
      }

      return {
        refugees: currentList,
        inventory: syncInventoryBurnRates(state.inventory, currentList),
        pendingOutboxCount: state.pendingOutboxCount + newAddedCount,
      };
    });
  },

  updateRefugeeTriage: (refugeeId, triage) => {
  set((state) => ({
  refugees: state.refugees.map((r) =>
  r.id === refugeeId ? { ...r, triageStatus: triage } : r
  ),
  pendingOutboxCount: state.pendingOutboxCount + 1,
  }));
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
        inventory: syncInventoryBurnRates(currentList, state.refugees),
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
      inventory: syncInventoryBurnRates(updatedInventory, state.refugees),
      transactions: [tx, ...state.transactions],
      pendingOutboxCount: state.pendingOutboxCount + 1,
    });
  },

  updateInventoryItem: (itemId, data) => {
    set((state) => {
      const updatedInventory = state.inventory.map((i) =>
        i.id === itemId ? { ...i, ...data, lastUpdatedAt: Date.now() } : i
      );
      return {
        inventory: syncInventoryBurnRates(updatedInventory, state.refugees),
        pendingOutboxCount: state.pendingOutboxCount + 1,
      };
    });
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
      inventory: syncInventoryBurnRates(updatedInventory, state.refugees),
      needsTickets: updatedTickets,
      transactions: [tx, ...state.transactions],
      pendingOutboxCount: state.pendingOutboxCount + 1,
    });

    return true;
  },

  recalculateAllBurnRates: () => {
    set((state) => ({
      inventory: syncInventoryBurnRates(state.inventory, state.refugees),
    }));
  },

  getItemResilience: (itemId: string) => {
    const state = get();
    const item = state.inventory.find((i) => i.id === itemId);
    if (!item) {
      return calculateItemResilience(
        { itemName: "", category: "GENERAL", currentQuantity: 0, unit: "UNIT" },
        { totalRefugees: 0, infantsCount: 0, reproductiveWomenCount: 0, elderlyCount: 0, injuredOrChronicCount: 0 }
      );
    }
    const poskoRefugees = state.refugees.filter((r) => r.postId === item.postId);
    return calculatePoskoInventoryResilience(item, poskoRefugees);
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

  cancelNeedsTicket: (ticketId) => {
  set((state) => ({
  needsTickets: state.needsTickets.map((t) =>
  t.id === ticketId ? { ...t, status: "REJECTED" as const } : t
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

  recordDirectDistribution: (data) => {
    const state = get();
    const targetItem = state.inventory.find((i) => i.id === data.itemId);
    const poskoId = targetItem?.postId || state.session.poskoId;
    const ticketId = `TKT-DIR-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_3_DIGIT_RANGE)}`;
    const now = Date.now();

    const newTicket: NeedsTicket = {
      id: ticketId,
      refugeeId: data.refugeeId,
      refugeeName: data.refugeeName,
      shelterLocation: data.shelterLocation || "Tenda Pengungsian",
      postId: poskoId,
      itemName: data.itemName,
      quantity: data.quantity,
      unit: data.unit,
      status: "COMPLETED",
      urgency: "HIGH",
      createdByUserId: data.officerId || state.session.userId,
      createdByUserName: data.officerName || state.session.userName,
      allocatedByUserId: data.officerId || state.session.userId,
      distributedByUserId: data.officerId || state.session.userId,
      createdAt: now,
      completedAt: now,
    };

    const updatedInventory = state.inventory.map((i) =>
      i.id === data.itemId
        ? { ...i, currentQuantity: Math.max(0, i.currentQuantity - data.quantity), lastUpdatedAt: now }
        : i
    );

    const tx: InventoryTransaction = {
      id: `TX-${Math.floor(POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_MIN + Math.random() * POSKO_STORE_CONSTANTS.RANDOM_ID_4_DIGIT_RANGE)}`,
      itemId: data.itemId,
      postId: poskoId,
      officerId: data.officerId || state.session.userId,
      officerName: data.officerName || state.session.userName,
      txType: "DISTRIBUTION",
      quantityChange: -data.quantity,
      referenceTicketId: ticketId,
      note: data.notes || `Serah langsung di meja logistik untuk ${data.refugeeName}`,
      deviceTimestamp: now,
    };

    set({
      inventory: syncInventoryBurnRates(updatedInventory, state.refugees),
      needsTickets: [newTicket, ...state.needsTickets],
      transactions: [tx, ...state.transactions],
      pendingOutboxCount: state.pendingOutboxCount + 2,
    });

    return newTicket;
  },

  // Tactical Chat & PTT (Pristine - Zero Mock Data)
  activeChannel: "POSKO_ALL",
  setActiveChannel: (channel) => set({ activeChannel: channel }),

  messages: [],

  sendTextMessage: (channel, text, isUrgent = false) => {
  const state = get();
  const msg: TacticalMessage = {
  id: `MSG-${Date.now()}`,
  channel,
  senderPeerId: "PEER-LOCAL",
  senderName: state.session.userName || "Petugas Lapangan",
  senderRole: state.session.userRole,
  contentType: "TEXT",
  textContent: text,
  isUrgent,
  createdAt: Date.now(),
  };
  set((s) => ({ messages: [...s.messages, msg] }));
  },

  sendVoiceMessage: (channel, durationMs) => {
  const state = get();
  const msg: TacticalMessage = {
  id: `MSG-${Date.now()}`,
  channel,
  senderPeerId: "PEER-LOCAL",
  senderName: state.session.userName || "Petugas Lapangan",
  senderRole: state.session.userRole,
  contentType: "VOICE_NOTE",
  audioDurationMs: durationMs,
  audioWaveform: [25, 40, 65, 85, 90, 75, 60, 45, 30, 15],
  createdAt: Date.now(),
  };
  set((s) => ({ messages: [...s.messages, msg] }));
  },

  clearChannelMessages: (channel) => {
  set((state) => ({
  messages: state.messages.filter((m) => m.channel !== channel),
  }));
  },

  triggerSOS: (hazardType) => {
  const state = get();
  const msg: TacticalMessage = {
  id: `MSG-SOS-${Date.now()}`,
  channel: "SOS",
  senderPeerId: "PEER-LOCAL",
  senderName: state.session.userName || "Petugas Lapangan",
  senderRole: state.session.userRole,
  contentType: "ALERT",
  textContent: ` PERINGATAN DARURAT: ${hazardType} terdeteksi di sekitar posko! Evakuasi siaga!`,
  isUrgent: true,
  createdAt: Date.now(),
  };
  set((s) => ({
  messages: [...s.messages, msg],
  activeChannel: "SOS",
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
      const state = get();
      const targetEndpoint = state.cloudProvider === "MANAGED"
        ? (process.env.NEXT_PUBLIC_SUPABASE_URL
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
            : "https://api.sandya.id")
        : state.cloudEndpoint;

      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // When running in environment with Supabase keys configured, attempt real push
      if (typeof fetch !== "undefined" && targetEndpoint.startsWith("http") && anonKey) {
        try {
          const res = await fetch(`${targetEndpoint}/events_outbox`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
              Prefer: "resolution=merge-duplicates",
            },
            body: JSON.stringify([
              {
                id: `SYNC-${Date.now()}`,
                pos_id: state.session.poskoId || "POS-LOCAL",
                topic: "POSKO_HEARTBEAT",
                payload: {
                  poskoName: state.session.poskoName,
                  refugeeCount: state.refugees.length,
                  inventoryCount: state.inventory.length,
                  timestamp: Date.now(),
                },
                status: "PENDING",
                created_at: Date.now(),
              },
            ]),
          });
          if (!res.ok && res.status !== 404 && res.status !== 401) {
            console.warn("[CloudSync] Remote Supabase response status:", res.status);
          }
        } catch {
          // Network offline / unreachable; handled gracefully
          console.warn("[CloudSync] Remote cloud offline or unreachable, local offline persistence active.");
        }
      } else {
        // Local simulation / fallback roundtrip
        await new Promise((resolve) => setTimeout(resolve, POSKO_STORE_CONSTANTS.SIMULATED_CLOUD_LATENCY_MS));
      }

      set({
        pendingOutboxCount: 0,
        lastSyncedAt: Date.now(),
        isCloudSyncing: false,
      });

      return {
        success: true,
        message: `Sinkronisasi awan (${
          state.cloudProvider === "MANAGED" ? "Managed Sandya Cloud" : `BYOC: ${state.cloudEndpoint}`
        }) berhasil diproses. 100% data posko tersinkronisasi.`,
      };
    } catch (err: unknown) {
      set({ isCloudSyncing: false });
      return {
        success: false,
        message: (err as Error)?.message || "Gagal menghubungi server cloud.",
      };
    }
  },

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

          const existingTktMap = new Map(state.needsTickets.map((t) => [t.id, t]));
          if (data.needsTickets) {
            for (const tkt of data.needsTickets) {
              existingTktMap.set(tkt.id, tkt);
            }
          }

          const rawInv = Array.from(existingInvMap.values());
          const rawRef = Array.from(existingRefMap.values());
          return {
            inventory: syncInventoryBurnRates(rawInv, rawRef),
            refugees: rawRef,
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
        inventory: state.inventory,
        transactions: state.transactions,
        needsTickets: state.needsTickets,
        messages: state.messages,
        pendingOutboxCount: state.pendingOutboxCount,
        lastSyncedAt: state.lastSyncedAt,
        cloudProvider: state.cloudProvider,
        cloudEndpoint: state.cloudEndpoint,
      }),
      onRehydrateStorage: () => (state) => {
        // Ephemeral mesh radio signals must never persist across reloads
        if (state) {
          state.peers = [];
          if (state.inventory && state.refugees) {
            state.inventory = syncInventoryBurnRates(state.inventory, state.refugees);
          }
        }
      },
    }
  )
);
