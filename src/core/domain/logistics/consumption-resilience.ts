/**
 * Domain Service: Disaster Logistics Consumption Resilience Engine
 * Mengadopsi Standar Kemanusiaan Internasional SPHERE Project & BNPB/PMI
 * Menghitung ketahanan konsumsi logistik berdasarkan populasi dan demografi warga terdaftar.
 */

export interface DemographicBreakdown {
  totalRefugees: number;
  infantsCount: number;
  reproductiveWomenCount: number;
  elderlyCount: number;
  injuredOrChronicCount: number;
}

export type TargetDemographicGroup = 'ALL' | 'INFANTS' | 'REPRODUCTIVE_WOMEN' | 'ELDERLY' | 'SPECIAL_CARE';

export interface ConsumptionNorm {
  cluster: 'FOOD' | 'WATER' | 'INFANT' | 'HYGIENE' | 'MEDICAL' | 'GENERAL';
  targetGroup: TargetDemographicGroup;
  dailyRationPerCapita: number; // Kebutuhan per jiwa per hari dalam unit komoditas
  standardUnit: string;
  notes: string;
}

export interface ResilienceCalculation {
  dailyDemand: number;
  targetPopulation: number;
  targetGroupName: string;
  daysRemaining: number;
  status: 'CRITICAL' | 'WARNING' | 'HEALTHY' | 'STANDBY';
  statusLabel: string;
  standbyDaysFor100Pax: number;
  normUsed: ConsumptionNorm;
}

export const SPHERE_CONSUMPTION_STANDARDS = {
  // Pangan Pokok: 400g (0.4 kg) per jiwa per hari (~2.100 kkal SPHERE standard)
  RICE_KG_PER_CAPITA_DAILY: 0.4,
  RICE_KARUNG_5KG_PER_CAPITA_DAILY: 0.08, // 1 karung 5kg untuk 12.5 person-days

  // Air Minum: 3 Liter per jiwa per hari (SPHERE drinking water standard)
  WATER_LITER_PER_CAPITA_DAILY: 3.0,
  WATER_GALON_19L_PER_CAPITA_DAILY: 3.0 / 19.0, // ~0.158 galon per orang per hari

  // MRE / Makanan Siap Saji: 2 paket / kaleng per orang per hari
  MRE_PACKET_PER_CAPITA_DAILY: 2.0,

  // Balita: Popok bayi 3 pcs per balita per hari
  INFANT_DIAPER_PCS_DAILY: 3.0,
  INFANT_DIAPER_PACKET_DAILY: 0.1, // 1 paket isi 30

  // Balita: Susu formula 0.15 kg (150g) per balita per hari
  INFANT_MILK_KG_DAILY: 0.15,
  INFANT_MILK_BOX_DAILY: 0.35, // 1 box 400g per ~2.8 hari

  // Wanita Usia Subur (12-50 tahun): Pembalut 2 pcs per hari selama masa darurat
  FEMALE_HYGIENE_PADS_DAILY: 2.0,
  FEMALE_HYGIENE_PACKET_DAILY: 0.2, // 1 pack isi 10 per 5 hari

  // Medis / P3K Dasar: 0.1 kit per orang per hari
  MEDICAL_BASIC_KIT_DAILY: 0.1,

  // Ambang Batas Peringatan Hari Ketahanan
  CRITICAL_DAYS_THRESHOLD: 1.0, // <= 24 Jam
  WARNING_DAYS_THRESHOLD: 3.0,  // <= 72 Jam

  // Standby Base Population
  STANDBY_POPULATION_BASE: 100,
} as const;

/**
 * Ekstraksi segmentasi demografi dari daftar pengungsi posko
 */
export function extractDemographicBreakdown(
  refugees: Array<{
    age: number;
    gender: 'M' | 'F' | string;
    vulnerabilities?: string[];
  }>
): DemographicBreakdown {
  let infantsCount = 0;
  let reproductiveWomenCount = 0;
  let elderlyCount = 0;
  let injuredOrChronicCount = 0;

  for (const r of refugees) {
    const vulns = r.vulnerabilities || [];
    const isInfant = r.age <= 5 || vulns.includes('BALITA');
    const isElderly = r.age >= 60 || vulns.includes('LANSIA');
    const isReproductiveWoman = r.gender === 'F' && r.age >= 12 && r.age <= 50;
    const isSpecialCare =
      vulns.includes('DISABILITAS') ||
      vulns.includes('LUKA_BERAT') ||
      vulns.includes('PENYAKIT_KRONIS') ||
      vulns.includes('IBU_HAMIL');

    if (isInfant) infantsCount++;
    if (isElderly) elderlyCount++;
    if (isReproductiveWoman) reproductiveWomenCount++;
    if (isSpecialCare) injuredOrChronicCount++;
  }

  return {
    totalRefugees: refugees.length,
    infantsCount,
    reproductiveWomenCount,
    elderlyCount,
    injuredOrChronicCount,
  };
}

/**
 * Pencocokan cerdas komoditas logistik dengan norma konsumsi SPHERE / BNPB
 */
export function matchItemToConsumptionNorm(
  itemName: string,
  category: string,
  unit: string
): ConsumptionNorm {
  const name = itemName.toLowerCase();
  const u = unit.toUpperCase();
  const cat = category.toUpperCase();

  // 1. Pangan Pokok / Beras
  if (name.includes('beras') || name.includes('rice')) {
    if (u.includes('KARUNG') || u.includes('SAK')) {
      const isLargeSack = name.includes('25kg') || name.includes('25 kg');
      const karungPerCapita = isLargeSack ? 0.4 / 25.0 : SPHERE_CONSUMPTION_STANDARDS.RICE_KARUNG_5KG_PER_CAPITA_DAILY;
      return {
        cluster: 'FOOD',
        targetGroup: 'ALL',
        dailyRationPerCapita: karungPerCapita,
        standardUnit: unit,
        notes: isLargeSack ? 'Beras karung 25kg (Standar SPHERE 400g/jiwa/hari)' : 'Beras karung 5kg (Standar SPHERE 400g/jiwa/hari)',
      };
    }
    return {
      cluster: 'FOOD',
      targetGroup: 'ALL',
      dailyRationPerCapita: SPHERE_CONSUMPTION_STANDARDS.RICE_KG_PER_CAPITA_DAILY,
      standardUnit: 'KG',
      notes: 'Beras kemasan kg (Standar SPHERE 400g/jiwa/hari)',
    };
  }

  // 2. Air Minum / Galon / Botol
  if (name.includes('air') || name.includes('water') || name.includes('galon')) {
    if (u.includes('GALON') || name.includes('galon')) {
      return {
        cluster: 'WATER',
        targetGroup: 'ALL',
        dailyRationPerCapita: SPHERE_CONSUMPTION_STANDARDS.WATER_GALON_19L_PER_CAPITA_DAILY,
        standardUnit: 'GALON',
        notes: 'Air galon 19L (Standar SPHERE 3L/jiwa/hari)',
      };
    }
    if (u.includes('DUS') || u.includes('KARTON')) {
      return {
        cluster: 'WATER',
        targetGroup: 'ALL',
        dailyRationPerCapita: 3.0 / 14.4, // ~0.208 dus per jiwa per hari
        standardUnit: 'DUS',
        notes: 'Air mineral kemasan dus (Standar SPHERE 3L/jiwa/hari)',
      };
    }
    return {
      cluster: 'WATER',
      targetGroup: 'ALL',
      dailyRationPerCapita: SPHERE_CONSUMPTION_STANDARDS.WATER_LITER_PER_CAPITA_DAILY,
      standardUnit: 'LITER',
      notes: 'Air minum liter (Standar SPHERE 3L/jiwa/hari)',
    };
  }

  // 3. Susu Formula Balita & Makanan Bayi
  if (name.includes('susu') || name.includes('formula') || name.includes('mpasi')) {
    const isKg = u === 'KG';
    return {
      cluster: 'INFANT',
      targetGroup: 'INFANTS',
      dailyRationPerCapita: isKg
        ? SPHERE_CONSUMPTION_STANDARDS.INFANT_MILK_KG_DAILY
        : SPHERE_CONSUMPTION_STANDARDS.INFANT_MILK_BOX_DAILY,
      standardUnit: unit,
      notes: 'Nutrisi balita (Diterapkan khusus untuk anak usia <= 5 tahun)',
    };
  }

  // 4. Popok Bayi / Diapers
  if (name.includes('popok') || name.includes('diaper') || name.includes('pampers')) {
    const isPcs = u === 'PCS' || u === 'LEMBAR' || u === 'BIJI';
    return {
      cluster: 'INFANT',
      targetGroup: 'INFANTS',
      dailyRationPerCapita: isPcs
        ? SPHERE_CONSUMPTION_STANDARDS.INFANT_DIAPER_PCS_DAILY
        : SPHERE_CONSUMPTION_STANDARDS.INFANT_DIAPER_PACKET_DAILY,
      standardUnit: unit,
      notes: 'Sanitasi balita (Diterapkan khusus untuk anak usia <= 5 tahun)',
    };
  }

  // 5. Pembalut Wanita / Sanitasi Khusus
  if (name.includes('pembalut') || name.includes('sanitary') || name.includes('softex')) {
    const isPcs = u === 'PCS' || u === 'LEMBAR';
    return {
      cluster: 'HYGIENE',
      targetGroup: 'REPRODUCTIVE_WOMEN',
      dailyRationPerCapita: isPcs
        ? SPHERE_CONSUMPTION_STANDARDS.FEMALE_HYGIENE_PADS_DAILY
        : SPHERE_CONSUMPTION_STANDARDS.FEMALE_HYGIENE_PACKET_DAILY,
      standardUnit: unit,
      notes: 'Sanitasi wanita (Diterapkan khusus perempuan usia 12-50 tahun)',
    };
  }

  // 6. Makanan Siap Saji / Ransum Darurat / Lauk Kaleng / MRE
  if (
    name.includes('mre') ||
    name.includes('siap saji') ||
    name.includes('ransum') ||
    name.includes('sarden') ||
    name.includes('kornet') ||
    cat === 'FOOD'
  ) {
    return {
      cluster: 'FOOD',
      targetGroup: 'ALL',
      dailyRationPerCapita: SPHERE_CONSUMPTION_STANDARDS.MRE_PACKET_PER_CAPITA_DAILY,
      standardUnit: unit,
      notes: 'Makanan darurat siap saji (2 porsi/jiwa/hari)',
    };
  }

  // 7. Medis & Obat-obatan
  if (cat === 'MEDICAL' || name.includes('obat') || name.includes('p3k') || name.includes('perban')) {
    return {
      cluster: 'MEDICAL',
      targetGroup: 'ALL',
      dailyRationPerCapita: SPHERE_CONSUMPTION_STANDARDS.MEDICAL_BASIC_KIT_DAILY,
      standardUnit: unit,
      notes: 'Perbekalan kesehatan posko',
    };
  }

  // 8. Perlengkapan Bayi Umum
  if (cat === 'INFANT' || cat === 'BABY_SUPPLIES') {
    return {
      cluster: 'INFANT',
      targetGroup: 'INFANTS',
      dailyRationPerCapita: 1.0,
      standardUnit: unit,
      notes: 'Perlengkapan balita darurat',
    };
  }

  // 9. Sanitasi & Kebersihan Umum (Sabun, Sampo, Sikat Gigi)
  if (cat === 'HYGIENE' || name.includes('sabun') || name.includes('sampo') || name.includes('pasta gigi')) {
    return {
      cluster: 'HYGIENE',
      targetGroup: 'ALL',
      dailyRationPerCapita: 0.2, // 1 unit per 5 jiwa/hari
      standardUnit: unit,
      notes: 'Paket sanitasi dan kebersihan diri posko',
    };
  }

  // 10. Default Standar Umum
  return {
    cluster: 'GENERAL',
    targetGroup: 'ALL',
    dailyRationPerCapita: 0.25, // 1 unit untuk 4 jiwa (1 keluarga) per hari
    standardUnit: unit,
    notes: 'Kebutuhan logistik umum posko per keluarga',
  };
}

/**
 * Menghitung ketahanan logistik per komoditas berdasarkan data demografi posko
 */
export function calculateItemResilience(
  item: {
    itemName: string;
    category: string;
    currentQuantity: number;
    unit: string;
  },
  demographics: DemographicBreakdown,
  customNormOverride?: Partial<ConsumptionNorm>
): ResilienceCalculation {
  const matchedNorm = matchItemToConsumptionNorm(item.itemName, item.category, item.unit);
  const norm: ConsumptionNorm = {
    ...matchedNorm,
    ...customNormOverride,
  };

  // Tentukan target populasi berdasarkan kelompok penerima manfaat
  let targetPopulation = 0;
  let targetGroupName = 'Seluruh Warga';

  switch (norm.targetGroup) {
    case 'INFANTS':
      targetPopulation = demographics.infantsCount;
      targetGroupName = 'Balita (0-5 thn)';
      break;
    case 'REPRODUCTIVE_WOMEN':
      targetPopulation = demographics.reproductiveWomenCount;
      targetGroupName = 'Wanita Usia Subur (12-50 thn)';
      break;
    case 'ELDERLY':
      targetPopulation = demographics.elderlyCount;
      targetGroupName = 'Lansia (>=60 thn)';
      break;
    case 'SPECIAL_CARE':
      targetPopulation = demographics.injuredOrChronicCount;
      targetGroupName = 'Warga Rentan / Sakit';
      break;
    case 'ALL':
    default:
      targetPopulation = demographics.totalRefugees;
      targetGroupName = 'Seluruh Warga';
      break;
  }

  // Hitung Kebutuhan Harian Posko (Daily Demand)
  const dailyDemand = Math.round(targetPopulation * norm.dailyRationPerCapita * 100) / 100;

  // Hitung Estimasi Kapasitas Siaga untuk 100 Jiwa (Standby Mode)
  const standbyDailyDemand = Math.round(SPHERE_CONSUMPTION_STANDARDS.STANDBY_POPULATION_BASE * norm.dailyRationPerCapita * 100) / 100;
  const standbyDaysFor100Pax =
    standbyDailyDemand > 0
      ? Math.floor(item.currentQuantity / standbyDailyDemand)
      : 999;

  // Jika belum ada pengungsi yang terdaftar di posko
  if (demographics.totalRefugees === 0 || targetPopulation === 0) {
    return {
      dailyDemand: 0,
      targetPopulation: 0,
      targetGroupName,
      daysRemaining: standbyDaysFor100Pax,
      status: 'STANDBY',
      statusLabel: `Siaga (Cukup ~${standbyDaysFor100Pax} Hari utk 100 Jiwa)`,
      standbyDaysFor100Pax,
      normUsed: norm,
    };
  }

  // Jika ada kebutuhan harian (> 0)
  const daysRemaining =
    dailyDemand > 0
      ? Math.floor((item.currentQuantity / dailyDemand) * 10) / 10
      : 999;

  let status: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
  let statusLabel = `Aman (~${Math.floor(daysRemaining)} Hari)`;

  if (daysRemaining <= SPHERE_CONSUMPTION_STANDARDS.CRITICAL_DAYS_THRESHOLD) {
    status = 'CRITICAL';
    statusLabel = daysRemaining <= 0 ? 'Habis (0 Hari)' : 'Kritis (< 24 Jam)';
  } else if (daysRemaining <= SPHERE_CONSUMPTION_STANDARDS.WARNING_DAYS_THRESHOLD) {
    status = 'WARNING';
    statusLabel = `Waspada (~${Math.floor(daysRemaining)} Hari)`;
  }

  return {
    dailyDemand,
    targetPopulation,
    targetGroupName,
    daysRemaining,
    status,
    statusLabel,
    standbyDaysFor100Pax,
    normUsed: norm,
  };
}
