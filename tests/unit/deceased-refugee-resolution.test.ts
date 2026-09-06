import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { type DisasterPerson, type NeedsTicket, type InventoryItem } from "@/shared/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runDeceasedResolutionTests() {
  console.log("\n==================================================================");
  console.log("RUNNING DECEASED REFUGEE RESOLUTION (TRIASE HITAM) TEST SUITE...");
  console.log("==================================================================\n");

  // Setup initial test data
  const testRefugee: DisasterPerson = {
    id: "REF-TEST-001",
    postId: "POS-01",
    fullName: "Alm. Bapak Ahmad",
    nik: "3201011205800001",
    gender: "M",
    age: 45,
    domicileOrigin: "Dusun Cijedil",
    shelterLocation: "Tenda 03",
    missingKinName: "Siti Rahma (Istri)",
    vulnerabilities: ["LUKA_BERAT"],
    urgentNeeds: ["Beras 5kg", "Obat Paracetamol"],
    registeredByUserId: "USR-001",
    registeredByUserName: "Petugas Lapangan",
    triageStatus: "RED",
    createdAt: Date.now(),
  };

  const testInventory: InventoryItem[] = [
    {
      id: "INV-BERAS",
      postId: "POS-01",
      itemName: "Beras 5kg",
      category: "FOOD",
      currentQuantity: 50,
      unit: "karung",
      burnRateDays: 7,
      lastUpdatedAt: Date.now(),
    },
    {
      id: "INV-PARA",
      postId: "POS-01",
      itemName: "Obat Paracetamol",
      category: "MEDICAL",
      currentQuantity: 100,
      unit: "strip",
      burnRateDays: 14,
      lastUpdatedAt: Date.now(),
    },
  ];

  const testTickets: NeedsTicket[] = [
    {
      id: "TKT-MED-01",
      refugeeId: "REF-TEST-001",
      refugeeName: "Alm. Bapak Ahmad",
      shelterLocation: "Tenda 03",
      postId: "POS-01",
      itemName: "Obat Paracetamol",
      quantity: 2,
      unit: "strip",
      status: "ALLOCATED", // Sudah dipotong 2 strip di apotek
      urgency: "HIGH",
      createdByUserId: "USR-001",
      createdByUserName: "Petugas Medis",
      createdAt: Date.now(),
    },
    {
      id: "TKT-FOOD-01",
      refugeeId: "REF-TEST-001",
      refugeeName: "Alm. Bapak Ahmad",
      shelterLocation: "Tenda 03",
      postId: "POS-01",
      itemName: "Beras 5kg",
      quantity: 1,
      unit: "karung",
      status: "ALLOCATED", // Sudah dipotong 1 karung di gudang
      urgency: "HIGH",
      createdByUserId: "USR-001",
      createdByUserName: "Petugas Logistik",
      createdAt: Date.now(),
    },
  ];

  // Hydrate store
  usePoskoStore.setState({
    refugees: [testRefugee],
    inventory: testInventory,
    needsTickets: testTickets,
    transactions: [],
  });

  // TEST 1: Cancel All & Inventory Rollback
  console.log("Test 1: Skenario CANCEL_ALL — Rollback Stok Obat & Sembako + Terbitkan Tiket Jenazah");
  usePoskoStore.getState().handleRefugeeDeceasedResolution({
    refugeeId: "REF-TEST-001",
    cancelMedicalTickets: true,
    generalLogisticsAction: "CANCEL_ALL",
    issueMortuaryKit: true,
  });

  const state1 = usePoskoStore.getState();
  const refugee1 = state1.refugees.find((r) => r.id === "REF-TEST-001");
  assert(refugee1?.triageStatus === "BLACK", "Status triase warga harus menjadi BLACK");

  const medTicket1 = state1.needsTickets.find((t) => t.id === "TKT-MED-01");
  assert(medTicket1?.status === "CANCELLED", "Tiket medis harus berstatus CANCELLED");
  assert(medTicket1?.cancellationReason?.includes("wafat") === true, "Alasan pembatalan medis harus dicatat");

  const foodTicket1 = state1.needsTickets.find((t) => t.id === "TKT-FOOD-01");
  assert(foodTicket1?.status === "CANCELLED", "Tiket logistik sembako harus berstatus CANCELLED");

  // Periksa Rollback Saldo Inventaris
  const paraInv1 = state1.inventory.find((i) => i.id === "INV-PARA");
  assert(paraInv1?.currentQuantity === 102, `Stok paracetamol harus kembali dari 100 menjadi 102 (aktual: ${paraInv1?.currentQuantity})`);

  const berasInv1 = state1.inventory.find((i) => i.id === "INV-BERAS");
  assert(berasInv1?.currentQuantity === 51, `Stok beras harus kembali dari 50 menjadi 51 (aktual: ${berasInv1?.currentQuantity})`);

  // Periksa Riwayat Transaksi Rollback
  const txList1 = state1.transactions.filter((tx) => tx.txType === "RESTOCK");
  assert(txList1.length === 2, `Harus ada 2 transaksi RESTOCK rollback (aktual: ${txList1.length})`);

  // Periksa Tiket Jenazah
  const mortuaryTicket1 = state1.needsTickets.find((t) => t.itemName.includes("Jenazah") || t.itemName.includes("Kafan"));
  assert(Boolean(mortuaryTicket1), "Tiket pemulasaran jenazah harus terbit di antrean logistik");
  assert(mortuaryTicket1?.status === "PENDING", "Status tiket jenazah harus PENDING");
  assert(mortuaryTicket1?.urgency === "HIGH", "Urgensi tiket jenazah harus HIGH");
  console.log("  [PASS] Skenario CANCEL_ALL & Rollback Stok Sukses 100%!");

  // TEST 2: Transfer Non-Medical to Surviving Kin
  console.log("\nTest 2: Skenario TRANSFER_TO_KIN — Medis Batal & Rollback, Sembako Dialihkan ke Istri");
  // Reset store for Test 2
  usePoskoStore.setState({
    refugees: [{ ...testRefugee, triageStatus: "YELLOW" }],
    inventory: [
      { ...testInventory[0], currentQuantity: 50 },
      { ...testInventory[1], currentQuantity: 100 },
    ],
    needsTickets: [
      { ...testTickets[0], status: "ALLOCATED" },
      { ...testTickets[1], status: "ALLOCATED" },
    ],
    transactions: [],
  });

  usePoskoStore.getState().handleRefugeeDeceasedResolution({
    refugeeId: "REF-TEST-001",
    cancelMedicalTickets: true,
    generalLogisticsAction: "TRANSFER_TO_KIN",
    targetKinName: "Siti Rahma (Istri / Ahli Waris)",
    targetKinRefugeeId: "REF-KIN-002",
    issueMortuaryKit: true,
  });

  const state2 = usePoskoStore.getState();
  const medTicket2 = state2.needsTickets.find((t) => t.id === "TKT-MED-01");
  assert(medTicket2?.status === "CANCELLED", "Tiket medis tetap wajib CANCELLED");

  const paraInv2 = state2.inventory.find((i) => i.id === "INV-PARA");
  assert(paraInv2?.currentQuantity === 102, "Stok obat harus tetap di-rollback");

  const foodTicket2 = state2.needsTickets.find((t) => t.id === "TKT-FOOD-01");
  assert(foodTicket2?.status === "ALLOCATED", "Tiket sembako harus tetap ALLOCATED untuk keluarga");
  assert(foodTicket2?.refugeeName.includes("Siti Rahma") === true, `Nama penerima sembako harus dialihkan ke Siti Rahma (aktual: ${foodTicket2?.refugeeName})`);
  assert(foodTicket2?.transferredToRefugeeName === "Siti Rahma (Istri / Ahli Waris)", "Field transferredToRefugeeName harus terisi");

  const berasInv2 = state2.inventory.find((i) => i.id === "INV-BERAS");
  assert(berasInv2?.currentQuantity === 50, "Stok beras tidak di-rollback karena tetap disalurkan ke keluarga");
  console.log("  [PASS] Skenario TRANSFER_TO_KIN Sukses 100%!");

  console.log("\n[SUCCESS] ALL DECEASED REFUGEE RESOLUTION TESTS PASSED!");
}

runDeceasedResolutionTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
