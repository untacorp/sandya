"use client";

import { create } from "zustand";
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

  // Level 1: Organizations & Missions
  organizations: Organization[];
  missions: DisasterMission[];
  addMission: (mission: Omit<DisasterMission, "id" | "createdAt">) => DisasterMission;
  closeMission: (missionId: string) => void;

  // Level 2: Posko Directory & Central Logistics
  poskos: Posko[];
  addPosko: (posko: Omit<Posko, "id" | "createdAt" | "currentRefugees">) => Posko;
  updatePoskoStatus: (poskoId: string, status: PostStatus) => void;
  centralInventory: InventoryItem[];
  missionWaybills: MacroWaybill[];
  issueMissionWaybill: (waybill: Omit<MacroWaybill, "id" | "dispatchedAt">) => void;

  // Level 3: Refugees & Intake
  refugees: DisasterPerson[];
  addRefugee: (refugee: Omit<DisasterPerson, "id" | "createdAt">) => void;
  updateRefugeeTriage: (refugeeId: string, triage: TriageCategory) => void;

  // Level 3: Inventory & Single-Writer Ledger
  inventory: InventoryItem[];
  transactions: InventoryTransaction[];
  addRestock: (itemName: string, category: InventoryItem["category"], qty: number, unit: string) => void;
  allocateStock: (ticketId: string, itemId: string, qty: number) => boolean;

  // Level 3: Needs Requests & Distribution
  needsTickets: NeedsTicket[];
  createNeedsTicket: (ticket: Omit<NeedsTicket, "id" | "createdAt" | "status">) => void;
  completeDelivery: (ticketId: string) => void;

  // Level 3: Tactical Chat & PTT Radio
  activeChannel: TacticalChannel;
  setActiveChannel: (channel: TacticalChannel) => void;
  messages: TacticalMessage[];
  sendTextMessage: (channel: TacticalChannel, text: string, isUrgent?: boolean) => void;
  sendVoiceMessage: (channel: TacticalChannel, durationMs: number) => void;
  triggerSOS: (hazardType: string) => void;

  // Mesh & Sync
  peers: MeshPeer[];
  pendingOutboxCount: number;
  lastSyncedAt: number;
  simulateSync: () => void;
}

export const usePoskoStore = create<PoskoState>((set, get) => ({
  // Default Session (starts as Koordinator at Posko 01, but can switch anywhere)
  session: {
    userId: "USR-001",
    userName: "Budi Santoso",
    userRole: "KOORDINATOR_POSKO",
    orgId: "ORG-01",
    orgName: "PMI Kabupaten Cianjur",
    missionId: "MSN-2026-01",
    missionName: "Tanggap Darurat Gempa Cugenang 2026",
    poskoId: "POS-01",
    poskoName: "Posko Lapangan RW 03 Kp. Cijedil",
  },
  setSessionRole: (role) =>
    set((state) => ({ session: { ...state.session, userRole: role } })),
  setSessionPosko: (poskoId, poskoName) =>
    set((state) => ({ session: { ...state.session, poskoId, poskoName } })),
  setSessionMission: (missionId, missionName) =>
    set((state) => ({ session: { ...state.session, missionId, missionName } })),
  setSessionOrg: (orgId, orgName) =>
    set((state) => ({ session: { ...state.session, orgId, orgName } })),

  // Level 1: Organizations
  organizations: [
    {
      id: "ORG-01",
      name: "PMI Kabupaten Cianjur",
      category: "PMI_LEMBAGA",
      masterPubkey: "did:sanidya:org_ed25519_7a9f81bc92e34",
      contactNumber: "0263-261234",
      createdAt: Date.now() - 86400000 * 30,
    },
    {
      id: "ORG-02",
      name: "BPBD Provinsi Jawa Barat",
      category: "BPBD_PEMERINTAH",
      masterPubkey: "did:sanidya:org_ed25519_5f3c12aa89bb0",
      contactNumber: "022-7312345",
      createdAt: Date.now() - 86400000 * 60,
    },
  ],

  // Level 1: Disaster Missions
  missions: [
    {
      id: "MSN-2026-01",
      orgId: "ORG-01",
      name: "Tanggap Darurat Gempa Cugenang 2026",
      disasterType: "GEMPA_BUMI",
      status: "ACTIVE_EMERGENCY",
      targetDays: 14,
      location: "Kecamatan Cugenang & Pacet, Kab. Cianjur",
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: "MSN-2026-02",
      orgId: "ORG-01",
      name: "Operasi Banjir Bandang Sukabumi",
      disasterType: "BANJIR_BANDANG",
      status: "TRANSITION_RECOVERY",
      targetDays: 21,
      location: "Kecamatan Pelabuhan Ratu, Kab. Sukabumi",
      createdAt: Date.now() - 86400000 * 18,
    },
  ],

  addMission: (missionData) => {
    const newMission: DisasterMission = {
      ...missionData,
      id: `MSN-2026-0${get().missions.length + 1}`,
      createdAt: Date.now(),
    };
    set((state) => ({
      missions: [newMission, ...state.missions],
    }));
    return newMission;
  },

  closeMission: (missionId) => {
    set((state) => ({
      missions: state.missions.map((m) =>
        m.id === missionId ? { ...m, status: "CLOSED_ARCHIVED" as const } : m
      ),
    }));
  },

  // Level 2: Posko Directory (4 Poskos in Cianjur)
  poskos: [
    {
      id: "POS-01",
      orgId: "ORG-01",
      missionId: "MSN-2026-01",
      name: "Posko Lapangan RW 03 Kp. Cijedil",
      postType: "FIELD_SHELTER",
      status: "OPERATIONAL_NORMAL",
      capacity: 550,
      currentRefugees: 513,
      locationLat: -6.8123,
      locationLng: 107.1234,
      locationName: "Lapangan Kp. Cijedil RT 03/RW 03",
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: "POS-02",
      orgId: "ORG-01",
      missionId: "MSN-2026-01",
      name: "Posko Lapangan RW 02 Kp. Gasol",
      postType: "FIELD_SHELTER",
      status: "OPERATIONAL_NORMAL",
      capacity: 400,
      currentRefugees: 320,
      locationLat: -6.8201,
      locationLng: 107.1352,
      locationName: "Halaman SDN 1 Gasol",
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: "POS-03",
      orgId: "ORG-01",
      missionId: "MSN-2026-01",
      name: "Gudang Sentral Misi & Hub GOR Pacet",
      postType: "MAIN_WAREHOUSE",
      status: "OPERATIONAL_NORMAL",
      capacity: 1200,
      currentRefugees: 850,
      locationLat: -6.7954,
      locationLng: 107.1129,
      locationName: "Kompleks GOR Pacet",
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: "POS-04",
      orgId: "ORG-01",
      missionId: "MSN-2026-01",
      name: "Pos Medis & Tenda RW 01 Sarampad",
      postType: "MEDICAL_POST",
      status: "HAZARD_EVACUATION",
      capacity: 350,
      currentRefugees: 180,
      locationLat: -6.8341,
      locationLng: 107.1088,
      locationName: "Puskesmas Pembantu Sarampad",
      createdAt: Date.now() - 86400000 * 2,
    },
  ],

  addPosko: (poskoData) => {
    const newPosko: Posko = {
      ...poskoData,
      id: `POS-0${get().poskos.length + 1}`,
      currentRefugees: 0,
      createdAt: Date.now(),
    };
    set((state) => ({
      poskos: [...state.poskos, newPosko],
    }));
    return newPosko;
  },

  updatePoskoStatus: (poskoId, status) => {
    set((state) => ({
      poskos: state.poskos.map((p) =>
        p.id === poskoId ? { ...p, status } : p
      ),
    }));
  },

  // Level 2: Central Warehouse Inventory
  centralInventory: [
    {
      id: "CINV-01",
      postId: "POS-03",
      itemName: "Beras Premium 50kg",
      category: "FOOD",
      currentQuantity: 120, // 6.000 kg
      unit: "SAK",
      burnRateDays: 14,
      lastUpdatedAt: Date.now() - 3600000 * 4,
    },
    {
      id: "CINV-02",
      postId: "POS-03",
      itemName: "Susu Formula Balita 400g",
      category: "BABY_SUPPLIES",
      currentQuantity: 350,
      unit: "KOTAK",
      burnRateDays: 8,
      lastUpdatedAt: Date.now() - 3600000 * 2,
    },
    {
      id: "CINV-03",
      postId: "POS-03",
      itemName: "Selimut Wool Tebal",
      category: "CLOTHING",
      currentQuantity: 800,
      unit: "PCS",
      burnRateDays: 12,
      lastUpdatedAt: Date.now() - 3600000 * 6,
    },
    {
      id: "CINV-04",
      postId: "POS-03",
      itemName: "Tenda Peleton Darurat (Kapasitas 40)",
      category: "SHELTER",
      currentQuantity: 15,
      unit: "UNIT",
      burnRateDays: 20,
      lastUpdatedAt: Date.now() - 3600000 * 12,
    },
  ],

  // Level 2: Macro Waybills
  missionWaybills: [
    {
      id: "MWB-01",
      missionId: "MSN-2026-01",
      sourceHub: "Gudang Sentral GOR Pacet",
      targetPoskoId: "POS-01",
      targetPoskoName: "Posko Lapangan RW 03 Cijedil",
      itemName: "Beras Premium 5kg",
      quantity: 100,
      unit: "SAK",
      status: "IN_TRANSIT",
      driverName: "Sopian (Truk Logistik #02)",
      dispatchedAt: Date.now() - 3600000 * 2,
    },
    {
      id: "MWB-02",
      missionId: "MSN-2026-01",
      sourceHub: "Gudang Sentral GOR Pacet",
      targetPoskoId: "POS-02",
      targetPoskoName: "Posko Lapangan RW 02 Gasol",
      itemName: "Selimut Wool Tebal",
      quantity: 80,
      unit: "PCS",
      status: "ARRIVED",
      driverName: "Hendra (Pikap Relawan)",
      dispatchedAt: Date.now() - 3600000 * 8,
    },
  ],

  issueMissionWaybill: (waybillData) => {
    const newWaybill: MacroWaybill = {
      ...waybillData,
      id: `MWB-0${get().missionWaybills.length + 1}`,
      dispatchedAt: Date.now(),
    };
    set((state) => ({
      missionWaybills: [newWaybill, ...state.missionWaybills],
    }));
  },

  // Level 3: Refugees Initial Dataset
  refugees: [
    {
      id: "REF-001",
      postId: "POS-01",
      fullName: "Muhammad Budi Santoso",
      nik: "3201011508920003",
      gender: "M",
      age: 34,
      domicileOrigin: "Dusun Cijedil (RW 03)",
      shelterLocation: "Tenda Darurat 02",
      vulnerabilities: [],
      urgentNeeds: ["Beras 5kg", "Selimut"],
      registeredByUserId: "USR-001",
      registeredByUserName: "Budi Santoso",
      triageStatus: "GREEN",
      createdAt: Date.now() - 3600000 * 6,
    },
    {
      id: "REF-002",
      postId: "POS-01",
      fullName: "Siti Rahmawati",
      nik: "3201015204940001",
      gender: "F",
      age: 32,
      domicileOrigin: "Dusun Cijedil (RW 03)",
      shelterLocation: "Ruang Kelas 2B SDN 1",
      missingKinName: "Agus Wijaya",
      vulnerabilities: ["IBU_HAMIL"],
      urgentNeeds: ["Susu Formula", "Vitamin Prenatal", "Matras"],
      registeredByUserId: "USR-002",
      registeredByUserName: "dr. Siti (Medis)",
      triageStatus: "YELLOW",
      createdAt: Date.now() - 3600000 * 5,
    },
    {
      id: "REF-003",
      postId: "POS-01",
      fullName: "Agus Wijaya",
      nik: null,
      gender: "M",
      age: 4,
      domicileOrigin: "Dusun Cijedil",
      shelterLocation: "Tenda Darurat 01",
      missingKinName: "Siti Rahmawati",
      vulnerabilities: ["BALITA"],
      urgentNeeds: ["Susu Bayi", "Bubur Bayi", "Pakaian Balita"],
      registeredByUserId: "USR-003",
      registeredByUserName: "Rizky (Relawan)",
      triageStatus: "RED",
      createdAt: Date.now() - 3600000 * 4,
    },
    {
      id: "REF-004",
      postId: "POS-01",
      fullName: "Nurul Hidayah",
      nik: "3201014102620002",
      gender: "F",
      age: 64,
      domicileOrigin: "Dusun Gasol",
      shelterLocation: "Tenda Darurat 04",
      vulnerabilities: ["LANSIA", "PENYAKIT_KRONIS"],
      urgentNeeds: ["Obat Hipertensi", "Selimut Hangat"],
      registeredByUserId: "USR-001",
      registeredByUserName: "Budi Santoso",
      triageStatus: "YELLOW",
      createdAt: Date.now() - 3600000 * 3,
    },
    {
      id: "REF-005",
      postId: "POS-01",
      fullName: "Dedi Kurniawan",
      nik: "3201011905850004",
      gender: "M",
      age: 41,
      domicileOrigin: "Dusun Cijedil",
      shelterLocation: "Tenda Darurat 01",
      vulnerabilities: ["DISABILITAS"],
      urgentNeeds: ["Kursi Roda / Kruk", "Air Bersih"],
      registeredByUserId: "USR-003",
      registeredByUserName: "Rizky (Relawan)",
      triageStatus: "GREEN",
      createdAt: Date.now() - 3600000 * 2,
    },
  ],

  addRefugee: (refugee) => {
    const newPerson: DisasterPerson = {
      ...refugee,
      id: `REF-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: Date.now(),
    };
    set((state) => ({
      refugees: [newPerson, ...state.refugees],
      pendingOutboxCount: state.pendingOutboxCount + 1,
    }));
  },

  updateRefugeeTriage: (refugeeId, triage) => {
    set((state) => ({
      refugees: state.refugees.map((r) =>
        r.id === refugeeId ? { ...r, triageStatus: triage } : r
      ),
      pendingOutboxCount: state.pendingOutboxCount + 1,
    }));
  },

  // Level 3: Inventory
  inventory: [
    {
      id: "INV-01",
      postId: "POS-01",
      itemName: "Beras Premium 5kg",
      category: "FOOD",
      currentQuantity: 450,
      unit: "KG",
      burnRateDays: 4,
      lastUpdatedAt: Date.now() - 3600000 * 2,
    },
    {
      id: "INV-02",
      postId: "POS-01",
      itemName: "Susu Formula Balita 400g",
      category: "BABY_SUPPLIES",
      currentQuantity: 8,
      unit: "KOTAK",
      burnRateDays: 0.5,
      lastUpdatedAt: Date.now() - 3600000 * 1,
    },
    {
      id: "INV-03",
      postId: "POS-01",
      itemName: "Selimut Tebal Wool",
      category: "CLOTHING",
      currentQuantity: 85,
      unit: "PCS",
      burnRateDays: 6,
      lastUpdatedAt: Date.now() - 3600000 * 3,
    },
    {
      id: "INV-04",
      postId: "POS-01",
      itemName: "Paracetamol 500mg",
      category: "MEDICAL",
      currentQuantity: 120,
      unit: "STRIP",
      burnRateDays: 5,
      lastUpdatedAt: Date.now() - 3600000 * 4,
    },
    {
      id: "INV-05",
      postId: "POS-01",
      itemName: "Air Mineral Galon 19L",
      category: "FOOD",
      currentQuantity: 32,
      unit: "GALON",
      burnRateDays: 2,
      lastUpdatedAt: Date.now() - 3600000 * 1,
    },
  ],

  transactions: [
    {
      id: "TX-001",
      itemId: "INV-01",
      postId: "POS-01",
      officerId: "USR-004",
      officerName: "Hendra (Logistik)",
      txType: "RESTOCK",
      quantityChange: 500,
      note: "Drop bantuan truk PMI Induk",
      deviceTimestamp: Date.now() - 3600000 * 8,
    },
    {
      id: "TX-002",
      itemId: "INV-01",
      postId: "POS-01",
      officerId: "USR-004",
      officerName: "Hendra (Logistik)",
      txType: "DISTRIBUTION",
      quantityChange: -50,
      note: "Dapur umum Tenda 01-04",
      deviceTimestamp: Date.now() - 3600000 * 4,
    },
  ],

  addRestock: (itemName, category, qty, unit) => {
    const state = get();
    const existingIndex = state.inventory.findIndex((i) => i.itemName === itemName);
    let updatedInventory = [...state.inventory];
    let itemId = `INV-${Math.floor(100 + Math.random() * 900)}`;

    if (existingIndex >= 0) {
      itemId = updatedInventory[existingIndex].id;
      updatedInventory[existingIndex] = {
        ...updatedInventory[existingIndex],
        currentQuantity: updatedInventory[existingIndex].currentQuantity + qty,
        lastUpdatedAt: Date.now(),
      };
    } else {
      updatedInventory.push({
        id: itemId,
        postId: state.session.poskoId,
        itemName,
        category,
        currentQuantity: qty,
        unit,
        burnRateDays: 5,
        lastUpdatedAt: Date.now(),
      });
    }

    const tx: InventoryTransaction = {
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      itemId,
      postId: state.session.poskoId,
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
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
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

  // Needs Tickets
  needsTickets: [
    {
      id: "TKT-101",
      refugeeId: "REF-003",
      refugeeName: "Agus Wijaya (Balita)",
      shelterLocation: "Tenda Darurat 01",
      postId: "POS-01",
      itemName: "Susu Formula Balita 400g",
      quantity: 2,
      unit: "KOTAK",
      status: "PENDING",
      urgency: "HIGH",
      createdByUserId: "USR-003",
      createdByUserName: "Rizky (Relawan)",
      createdAt: Date.now() - 3600000 * 2,
    },
    {
      id: "TKT-102",
      refugeeId: "REF-002",
      refugeeName: "Siti Rahmawati (Bumil)",
      shelterLocation: "Ruang Kelas 2B",
      postId: "POS-01",
      itemName: "Selimut Tebal Wool",
      quantity: 2,
      unit: "PCS",
      status: "ALLOCATED",
      urgency: "MEDIUM",
      createdByUserId: "USR-002",
      createdByUserName: "dr. Siti (Medis)",
      allocatedByUserId: "USR-004",
      createdAt: Date.now() - 3600000 * 3,
    },
  ],

  createNeedsTicket: (ticket) => {
    const newTicket: NeedsTicket = {
      ...ticket,
      id: `TKT-${Math.floor(100 + Math.random() * 900)}`,
      status: "PENDING",
      createdAt: Date.now(),
    };
    set((state) => ({
      needsTickets: [newTicket, ...state.needsTickets],
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

  // Tactical Chat & PTT
  activeChannel: "POSKO_ALL",
  setActiveChannel: (channel) => set({ activeChannel: channel }),

  messages: [
    {
      id: "MSG-01",
      channel: "POSKO_ALL",
      senderPeerId: "PEER-A1",
      senderName: "Budi Santoso",
      senderRole: "KOORDINATOR_POSKO",
      contentType: "TEXT",
      textContent: "Shift relawan sore siap bertukar jam 16:00. Dapur umum mohon siapkan konsumsi 500 porsi.",
      createdAt: Date.now() - 3600000 * 2,
    },
    {
      id: "MSG-02",
      channel: "MEDIS",
      senderPeerId: "PEER-B2",
      senderName: "dr. Siti",
      senderRole: "PETUGAS_MEDIS",
      contentType: "VOICE_NOTE",
      audioDurationMs: 4200,
      audioWaveform: [30, 45, 80, 95, 60, 40, 75, 90, 35, 20],
      createdAt: Date.now() - 3600000 * 1,
    },
    {
      id: "MSG-03",
      channel: "LOGISTIK",
      senderPeerId: "PEER-C3",
      senderName: "Hendra",
      senderRole: "PETUGAS_LOGISTIK",
      contentType: "TEXT",
      textContent: "Truk bantuan beras 500kg dari Posko Induk sudah tiba di gerbang barat.",
      createdAt: Date.now() - 1800000,
    },
  ],

  sendTextMessage: (channel, text, isUrgent = false) => {
    const state = get();
    const msg: TacticalMessage = {
      id: `MSG-${Date.now()}`,
      channel,
      senderPeerId: "PEER-LOCAL",
      senderName: state.session.userName,
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
      senderName: state.session.userName,
      senderRole: state.session.userRole,
      contentType: "VOICE_NOTE",
      audioDurationMs: durationMs,
      audioWaveform: [25, 40, 65, 85, 90, 75, 60, 45, 30, 15],
      createdAt: Date.now(),
    };
    set((s) => ({ messages: [...s.messages, msg] }));
  },

  triggerSOS: (hazardType) => {
    const state = get();
    const msg: TacticalMessage = {
      id: `MSG-SOS-${Date.now()}`,
      channel: "SOS",
      senderPeerId: "PEER-LOCAL",
      senderName: state.session.userName,
      senderRole: state.session.userRole,
      contentType: "ALERT",
      textContent: `🚨 PERINGATAN DARURAT: ${hazardType} terdeteksi di sekitar posko! Evakuasi siaga!`,
      isUrgent: true,
      createdAt: Date.now(),
    };
    set((s) => ({
      messages: [...s.messages, msg],
      activeChannel: "SOS",
    }));
  },

  // Mesh Peers & Sync
  peers: [
    {
      peerId: "PEER-A1",
      noisePubkey: "curve25519_a1b2...",
      signingPubkey: "ed25519_a1b2...",
      aliasName: "Budi Santoso",
      role: "KOORDINATOR_POSKO",
      currentPosId: "POS-01",
      rssi: -42,
      hops: 1,
      lastSeen: Date.now() - 5000,
    },
    {
      peerId: "PEER-B2",
      noisePubkey: "curve25519_c3d4...",
      signingPubkey: "ed25519_c3d4...",
      aliasName: "dr. Siti (Medis)",
      role: "PETUGAS_MEDIS",
      currentPosId: "POS-01",
      rssi: -58,
      hops: 1,
      lastSeen: Date.now() - 12000,
    },
    {
      peerId: "PEER-C3",
      noisePubkey: "curve25519_e5f6...",
      signingPubkey: "ed25519_e5f6...",
      aliasName: "Hendra (Gudang)",
      role: "PETUGAS_LOGISTIK",
      currentPosId: "POS-01",
      rssi: -65,
      hops: 2,
      lastSeen: Date.now() - 25000,
    },
    {
      peerId: "PEER-D4",
      noisePubkey: "curve25519_g7h8...",
      signingPubkey: "ed25519_g7h8...",
      aliasName: "Rizky (Relawan Tenda)",
      role: "RELAWAN_LAPANGAN",
      currentPosId: "POS-01",
      rssi: -72,
      hops: 3,
      lastSeen: Date.now() - 40000,
    },
  ],

  pendingOutboxCount: 3,
  lastSyncedAt: Date.now() - 120000,

  simulateSync: () => {
    set({
      pendingOutboxCount: 0,
      lastSyncedAt: Date.now(),
    });
  },
}));
