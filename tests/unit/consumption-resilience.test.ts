import assert from 'node:assert';
import {
  SPHERE_CONSUMPTION_STANDARDS,
  extractDemographicBreakdown,
  matchItemToConsumptionNorm,
  calculateItemResilience,
} from '@/core/domain/logistics/consumption-resilience';
import {
  calculatePoskoInventoryResilience,
  syncInventoryBurnRates,
} from '@/features/posko/store/use-posko-store';
import { InMemorySqliteConnection } from '@/infrastructure/db/sqlite/sqlite-connection';
import { SqliteInventoryRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-inventory.repository';
import { SqliteRefugeeRepository } from '@/infrastructure/db/sqlite/repositories/sqlite-refugee.repository';
import { DisasterAnalyticsService } from '@/infrastructure/services/disaster-analytics.service';
import { InventoryAggregate } from '@/core/domain/logistics/inventory.aggregate';
import { RefugeeAggregate } from '@/core/domain/refugees/refugee.aggregate';
import { asItemId, asPoskoId, asRefugeeId } from '@/core/shared/branded-types';
import { DisasterPerson, InventoryItem } from '@/shared/types';

async function runConsumptionResilienceTests() {
  console.log('RUNNING CONSUMPTION RESILIENCE ENGINE TEST SUITE (SPHERE & BNPB NORMS)...\n');

  // =========================================================================
  // TEST 1: Demographic Breakdown Extraction
  // =========================================================================
  console.log('Test 1: Demographic Breakdown Extraction');
  const mockRefugees: Array<{ age: number; gender: 'M' | 'F' | string; vulnerabilities?: string[] }> = [
    { age: 2, gender: 'M' }, // infant
    { age: 4, gender: 'F' }, // infant
    { age: 7, gender: 'M', vulnerabilities: ['BALITA'] }, // infant by vulnerability flag
    { age: 28, gender: 'F' }, // reproductive woman
    { age: 45, gender: 'F' }, // reproductive woman
    { age: 52, gender: 'F' }, // not reproductive woman (>50)
    { age: 65, gender: 'M' }, // elderly
    { age: 58, gender: 'F', vulnerabilities: ['LANSIA'] }, // elderly by vulnerability flag
    { age: 30, gender: 'M', vulnerabilities: ['DISABILITAS'] }, // special care
    { age: 25, gender: 'F', vulnerabilities: ['IBU_HAMIL'] }, // special care & reproductive woman
  ];

  const demo = extractDemographicBreakdown(mockRefugees);
  assert.strictEqual(demo.totalRefugees, 10, 'Total refugees must equal 10');
  assert.strictEqual(demo.infantsCount, 3, 'Infants count must equal 3 (age 2, 4, and BALITA flag)');
  assert.strictEqual(demo.reproductiveWomenCount, 3, 'Reproductive women count must equal 3 (age 28, 45, 25)');
  assert.strictEqual(demo.elderlyCount, 2, 'Elderly count must equal 2 (age 65, and LANSIA flag)');
  assert.strictEqual(demo.injuredOrChronicCount, 2, 'Special care count must equal 2 (DISABILITAS, IBU_HAMIL)');
  console.log('  [PASS] Demographic segmentation matches vulnerable demographic rules\n');

  // =========================================================================
  // TEST 2: Item Matching to SPHERE / BNPB Norms
  // =========================================================================
  console.log('Test 2: Item Matching to SPHERE / BNPB Norms');

  // 2a. Beras Karung 5kg
  const riceNorm = matchItemToConsumptionNorm('Beras Ramos Premium 5kg', 'FOOD', 'KARUNG');
  assert.strictEqual(riceNorm.cluster, 'FOOD');
  assert.strictEqual(riceNorm.targetGroup, 'ALL');
  assert.strictEqual(riceNorm.dailyRationPerCapita, SPHERE_CONSUMPTION_STANDARDS.RICE_KARUNG_5KG_PER_CAPITA_DAILY);

  // 2b. Air Minum Galon
  const waterNorm = matchItemToConsumptionNorm('Air Mineral Galon 19L', 'WATER', 'GALON');
  assert.strictEqual(waterNorm.cluster, 'WATER');
  assert.strictEqual(waterNorm.targetGroup, 'ALL');
  assert.strictEqual(waterNorm.dailyRationPerCapita, SPHERE_CONSUMPTION_STANDARDS.WATER_GALON_19L_PER_CAPITA_DAILY);

  // 2c. Popok Bayi
  const diaperNorm = matchItemToConsumptionNorm('Popok Bayi M', 'BABY_SUPPLIES', 'PCS');
  assert.strictEqual(diaperNorm.cluster, 'INFANT');
  assert.strictEqual(diaperNorm.targetGroup, 'INFANTS');
  assert.strictEqual(diaperNorm.dailyRationPerCapita, SPHERE_CONSUMPTION_STANDARDS.INFANT_DIAPER_PCS_DAILY);

  // 2d. Susu Formula Balita
  const milkNorm = matchItemToConsumptionNorm('Susu Formula 1-3 Tahun', 'INFANT', 'KOTAK');
  assert.strictEqual(milkNorm.cluster, 'INFANT');
  assert.strictEqual(milkNorm.targetGroup, 'INFANTS');

  // 2e. Pembalut Wanita
  const padNorm = matchItemToConsumptionNorm('Pembalut Bersayap Malam', 'HYGIENE', 'PCS');
  assert.strictEqual(padNorm.cluster, 'HYGIENE');
  assert.strictEqual(padNorm.targetGroup, 'REPRODUCTIVE_WOMEN');
  assert.strictEqual(padNorm.dailyRationPerCapita, SPHERE_CONSUMPTION_STANDARDS.FEMALE_HYGIENE_PADS_DAILY);

  // 2f. MRE / Makanan Siap Saji
  const mreNorm = matchItemToConsumptionNorm('Ransum MRE TNI Darurat', 'FOOD', 'PAKET');
  assert.strictEqual(mreNorm.cluster, 'FOOD');
  assert.strictEqual(mreNorm.targetGroup, 'ALL');
  assert.strictEqual(mreNorm.dailyRationPerCapita, 2.0);

  console.log('  [PASS] Commodities accurately mapped to SPHERE / BNPB humanitarian standards\n');

  // =========================================================================
  // TEST 3: Dynamic Sensitivity (Population Increase Decreases Days Remaining)
  // =========================================================================
  console.log('Test 3: Dynamic Sensitivity on Population Growth');

  // Inventory: 100 Karung Beras 5kg (Total = 500kg beras)
  const itemRice = {
    itemName: 'Beras Ramos 5kg',
    category: 'FOOD',
    currentQuantity: 100, // 100 karung
    unit: 'KARUNG',
  };

  // Scenario A: 50 refugees
  // 50 refugees * 0.08 karung/day = 4 karung/day
  // 100 karung / 4 karung/day = 25 days
  const demoSmall = {
    totalRefugees: 50,
    infantsCount: 5,
    reproductiveWomenCount: 15,
    elderlyCount: 8,
    injuredOrChronicCount: 2,
  };
  const resSmall = calculateItemResilience(itemRice, demoSmall);
  assert.strictEqual(resSmall.dailyDemand, 4);
  assert.strictEqual(resSmall.daysRemaining, 25);
  assert.strictEqual(resSmall.status, 'HEALTHY');

  // Scenario B: Surge of 250 refugees arrive
  // 250 refugees * 0.08 karung/day = 20 karung/day
  // 100 karung / 20 karung/day = 5 days
  const demoLarge = {
    totalRefugees: 250,
    infantsCount: 25,
    reproductiveWomenCount: 75,
    elderlyCount: 40,
    injuredOrChronicCount: 10,
  };
  const resLarge = calculateItemResilience(itemRice, demoLarge);
  assert.strictEqual(resLarge.dailyDemand, 20);
  assert.strictEqual(resLarge.daysRemaining, 5);
  assert.ok(resLarge.daysRemaining < resSmall.daysRemaining, 'More refugees must decrease days remaining');

  console.log(`  Scenario A (50 Pax): ~${resSmall.daysRemaining} days remaining (Demand: ${resSmall.dailyDemand} karung/day)`);
  console.log(`  Scenario B (250 Pax): ~${resLarge.daysRemaining} days remaining (Demand: ${resLarge.dailyDemand} karung/day)`);
  console.log('  [PASS] Dynamic population sensitivity verified\n');

  // =========================================================================
  // TEST 4: Three-Level Alert Thresholds (CRITICAL, WARNING, HEALTHY)
  // =========================================================================
  console.log('Test 4: Alert Thresholds (CRITICAL <= 1 Day, WARNING <= 3 Days, HEALTHY > 3 Days)');

  const demo100 = {
    totalRefugees: 100,
    infantsCount: 10,
    reproductiveWomenCount: 30,
    elderlyCount: 15,
    injuredOrChronicCount: 5,
  };
  // Daily demand for 100 refugees: 100 * 0.08 = 8 karung/day

  // 4a. Critical: 6 karung left (< 1 day = 6/8 = 0.7 days)
  const resCrit = calculateItemResilience({ ...itemRice, currentQuantity: 6 }, demo100);
  assert.strictEqual(resCrit.status, 'CRITICAL');
  assert.strictEqual(resCrit.statusLabel, 'Kritis (< 24 Jam)');

  // 4b. Warning: 16 karung left (2 days = 16/8 = 2.0 days)
  const resWarn = calculateItemResilience({ ...itemRice, currentQuantity: 16 }, demo100);
  assert.strictEqual(resWarn.status, 'WARNING');
  assert.strictEqual(resWarn.statusLabel, 'Waspada (~2 Hari)');

  // 4c. Healthy: 40 karung left (5 days = 40/8 = 5.0 days)
  const resHealth = calculateItemResilience({ ...itemRice, currentQuantity: 40 }, demo100);
  assert.strictEqual(resHealth.status, 'HEALTHY');
  assert.strictEqual(resHealth.statusLabel, 'Aman (~5 Hari)');

  // 4d. Empty stock: 0 karung
  const resZero = calculateItemResilience({ ...itemRice, currentQuantity: 0 }, demo100);
  assert.strictEqual(resZero.status, 'CRITICAL');
  assert.strictEqual(resZero.statusLabel, 'Habis (0 Hari)');

  console.log('  [PASS] Threshold evaluation matches 24h/72h humanitarian alert levels\n');

  // =========================================================================
  // TEST 5: Standby Mode (0 Refugees Registered)
  // =========================================================================
  console.log('Test 5: Standby Mode (Posko with 0 Refugees Registered)');

  const demoZeroRefugees = {
    totalRefugees: 0,
    infantsCount: 0,
    reproductiveWomenCount: 0,
    elderlyCount: 0,
    injuredOrChronicCount: 0,
  };

  // 80 karung for 0 refugees -> Standby for 100 pax:
  // 100 pax demand = 8 karung/day -> 80 / 8 = 10 days
  const resStandby = calculateItemResilience({ ...itemRice, currentQuantity: 80 }, demoZeroRefugees);
  assert.strictEqual(resStandby.status, 'STANDBY');
  assert.strictEqual(resStandby.dailyDemand, 0);
  assert.strictEqual(resStandby.targetPopulation, 0);
  assert.strictEqual(resStandby.standbyDaysFor100Pax, 10);
  assert.strictEqual(resStandby.statusLabel, 'Siaga (Cukup ~10 Hari utk 100 Jiwa)');

  console.log(`  Standby Label: ${resStandby.statusLabel}`);
  console.log('  [PASS] Standby mode calculates capacity for 100 people without error or infinity\n');

  // =========================================================================
  // TEST 6: Store Integration (syncInventoryBurnRates & calculatePoskoInventoryResilience)
  // =========================================================================
  console.log('Test 6: Store Integration (Zustand Sync Helper)');

  const mockPersons: DisasterPerson[] = [
    {
      id: 'REF-1',
      postId: 'POS-01',
      fullName: 'Budi Santoso',
      nik: '3201001',
      gender: 'M',
      age: 35,
      domicileOrigin: 'Kampung Baru',
      shelterLocation: 'Tenda A',
      vulnerabilities: [],
      urgentNeeds: [],
      registeredByUserId: 'USR-1',
      registeredByUserName: 'Petugas',
      createdAt: Date.now(),
    },
    {
      id: 'REF-2',
      postId: 'POS-01',
      fullName: 'Ayu Lestari',
      nik: '3201002',
      gender: 'F',
      age: 26,
      domicileOrigin: 'Kampung Baru',
      shelterLocation: 'Tenda A',
      vulnerabilities: [],
      urgentNeeds: [],
      registeredByUserId: 'USR-1',
      registeredByUserName: 'Petugas',
      createdAt: Date.now(),
    },
    {
      id: 'REF-3',
      postId: 'POS-01',
      fullName: 'Bayi Daffa',
      nik: null,
      gender: 'M',
      age: 2,
      domicileOrigin: 'Kampung Baru',
      shelterLocation: 'Tenda A',
      vulnerabilities: ['BALITA'],
      urgentNeeds: [],
      registeredByUserId: 'USR-1',
      registeredByUserName: 'Petugas',
      createdAt: Date.now(),
    },
  ];

  const storeItemRice: InventoryItem = {
    id: 'INV-1',
    postId: 'POS-01',
    itemName: 'Beras 5kg',
    category: 'FOOD',
    currentQuantity: 30,
    unit: 'KARUNG',
    burnRateDays: 5, // old fallback
    lastUpdatedAt: Date.now(),
  };

  const storeItemDiaper: InventoryItem = {
    id: 'INV-2',
    postId: 'POS-01',
    itemName: 'Popok Bayi M',
    category: 'INFANT',
    currentQuantity: 15,
    unit: 'PCS',
    burnRateDays: 5, // old fallback
    lastUpdatedAt: Date.now(),
  };

  const syncedInventory = syncInventoryBurnRates([storeItemRice, storeItemDiaper], mockPersons);

  // For Rice: 3 refugees * 0.08 = 0.24 karung/day -> 30 / 0.24 = 125 days
  const syncedRice = syncedInventory.find((i) => i.id === 'INV-1')!;
  assert.strictEqual(syncedRice.burnRateDays, 125);

  // For Diapers: 1 infant * 3 pcs/day = 3 pcs/day -> 15 / 3 = 5 days
  const syncedDiaper = syncedInventory.find((i) => i.id === 'INV-2')!;
  assert.strictEqual(syncedDiaper.burnRateDays, 5);

  const singleRes = calculatePoskoInventoryResilience(storeItemDiaper, mockPersons);
  assert.strictEqual(singleRes.targetPopulation, 1);
  assert.strictEqual(singleRes.targetGroupName, 'Balita (0-5 thn)');
  assert.strictEqual(singleRes.dailyDemand, 3);
  assert.strictEqual(singleRes.daysRemaining, 5);

  console.log('  [PASS] Store sync automatically synchronizes burnRateDays for all inventory items\n');

  // =========================================================================
  // TEST 7: DisasterAnalyticsService Integration with SQLite Repository
  // =========================================================================
  console.log('Test 7: DisasterAnalyticsService Integration with SQLite');

  const db = new InMemorySqliteConnection();
  const inventoryRepo = new SqliteInventoryRepository(db);
  const refugeeRepo = new SqliteRefugeeRepository(db);
  const analyticsService = new DisasterAnalyticsService(refugeeRepo, inventoryRepo);

  const poskoId = asPoskoId('POS-RESILIENCE');

  // Seed 10 refugees at POS-RESILIENCE (all adult males)
  for (let i = 1; i <= 10; i++) {
    const r = RefugeeAggregate.create({
      id: asRefugeeId(`REF-${i}`),
      poskoId,
      fullName: `Warga ${i}`,
      nationalId: `32010155059000${String(i).padStart(2, '0')}`,
      gender: 'M',
      age: 30,
      shelterLocation: 'Tenda Utama',
      registeredByUserId: 'USR-TEST',
    });
    assert.strictEqual(r.ok, true, `Refugee ${i} creation failed: ${r.ok ? '' : r.error.message}`);
    await refugeeRepo.save(r.value);
  }

  // Seed 200 Liter Air Minum (10 refugees * 3 Liter/day = 30 Liter/day -> 200 / 30 = 6.6 days)
  const itemWater = InventoryAggregate.create({
    id: asItemId('ITEM-WATER'),
    poskoId,
    itemName: 'Air Minum Bersih',
    category: 'FOOD',
    initialQuantity: 200,
    unit: 'LITER',
  });
  assert.strictEqual(itemWater.ok, true);
  await inventoryRepo.save(itemWater.value);

  // Seed 2 Karung Beras 5kg (10 refugees * 0.08 = 0.8 karung/day -> 2 / 0.8 = 2.5 days -> WARNING)
  const itemRiceLow = InventoryAggregate.create({
    id: asItemId('ITEM-RICE-LOW'),
    poskoId,
    itemName: 'Beras 5kg',
    category: 'FOOD',
    initialQuantity: 2,
    unit: 'KARUNG',
  });
  assert.strictEqual(itemRiceLow.ok, true);
  await inventoryRepo.save(itemRiceLow.value);

  const burnRates = await analyticsService.getInventoryBurnRate(poskoId);
  assert.strictEqual(burnRates.length, 2);

  // Sorted by daysRemaining ascending
  const firstItem = burnRates[0]; // Rice (2.5 days)
  const secondItem = burnRates[1]; // Water (6.6 days)

  assert.strictEqual(firstItem.itemId, 'ITEM-RICE-LOW');
  assert.strictEqual(firstItem.dailyBurnRate, 0.8);
  assert.strictEqual(firstItem.daysRemaining, 2.5);
  assert.strictEqual(firstItem.status, 'WARNING');

  assert.strictEqual(secondItem.itemId, 'ITEM-WATER');
  assert.strictEqual(secondItem.dailyBurnRate, 30);
  assert.strictEqual(secondItem.daysRemaining, 6.6);
  assert.strictEqual(secondItem.status, 'HEALTHY');

  console.log(`  Item 1 (${firstItem.itemName}): ~${firstItem.daysRemaining} days [${firstItem.status}]`);
  console.log(`  Item 2 (${secondItem.itemName}): ~${secondItem.daysRemaining} days [${secondItem.status}]`);
  console.log('  [PASS] DisasterAnalyticsService seamlessly computes demographic-based resilience\n');

  console.log('================================================================');
  console.log('ALL 7 CONSUMPTION RESILIENCE ENGINE TESTS PASSED SUCCESSFULLY! ✅');
  console.log('================================================================\n');
}

runConsumptionResilienceTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
