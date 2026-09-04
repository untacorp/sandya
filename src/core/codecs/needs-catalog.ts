/**
 * Katalog Standar 256 Kebutuhan Logistik & Medis Bencana (uint8 Tokens)
 * Mengadopsi Klaster Kebencanaan BNPB, PMI, dan Standar Kemanusiaan SPHERE.
 * Setiap item direpresentasikan secara ringkas dalam 1 Byte (0x01 .. 0xFF).
 */

export interface DisasterNeedItem {
  id: number; // 1..255 (uint8)
  cluster: 'FOOD_WATER' | 'MEDICAL' | 'INFANT' | 'HYGIENE' | 'CLOTHING_BEDDING' | 'ASSISTIVE' | 'EMERGENCY_TOOLS';
  nameId: string;
  nameEn: string;
}

export const DISASTER_NEEDS_CATALOG: Record<number, DisasterNeedItem> = {
  // 0x01 - 0x20: Pangan & Air Minum (Food & Water)
  0x01: { id: 0x01, cluster: 'FOOD_WATER', nameId: 'Beras / Makanan Pokok', nameEn: 'Rice / Staple Food' },
  0x02: { id: 0x02, cluster: 'FOOD_WATER', nameId: 'Air Minum Bersih Galon', nameEn: 'Clean Bottled Water' },
  0x03: { id: 0x03, cluster: 'FOOD_WATER', nameId: 'Makanan Siap Saji (MRE)', nameEn: 'Ready-to-Eat Meals (MRE)' },
  0x04: { id: 0x04, cluster: 'FOOD_WATER', nameId: 'Biskuit / Makanan Ringan Darurat', nameEn: 'Emergency Biscuits' },
  0x05: { id: 0x05, cluster: 'FOOD_WATER', nameId: 'Makanan Pendamping ASI (MPASI)', nameEn: 'Weaning Food (MPASI)' },
  0x06: { id: 0x06, cluster: 'FOOD_WATER', nameId: 'Lauk Kaleng / Kornet / Sarden', nameEn: 'Canned Food / Sardines' },
  0x07: { id: 0x07, cluster: 'FOOD_WATER', nameId: 'Dapur Umum Kit (Bumbu & Minyak)', nameEn: 'Kitchen Supply Kit' },
  0x08: { id: 0x08, cluster: 'FOOD_WATER', nameId: 'Susu UHT Anak', nameEn: 'UHT Milk for Kids' },

  // 0x21 - 0x50: Medis & Obat-Obatan Rutin (Medical & Chronic Care)
  0x21: { id: 0x21, cluster: 'MEDICAL', nameId: 'Insulin & Jarum Suntik', nameEn: 'Insulin & Needles' },
  0x22: { id: 0x22, cluster: 'MEDICAL', nameId: 'Obat Hipertensi (Amlodipine/Captopril)', nameEn: 'Hypertension Medicine' },
  0x23: { id: 0x23, cluster: 'MEDICAL', nameId: 'Inhaler / Obat Asma', nameEn: 'Asthma Inhaler' },
  0x24: { id: 0x24, cluster: 'MEDICAL', nameId: 'Perban & Kasa Steril', nameEn: 'Sterile Bandages & Gauze' },
  0x25: { id: 0x25, cluster: 'MEDICAL', nameId: 'Antiseptik / Povidone Iodine', nameEn: 'Antiseptic Solution' },
  0x26: { id: 0x26, cluster: 'MEDICAL', nameId: 'Oralit & Obat Diare', nameEn: 'Oral Rehydration Salts (ORS)' },
  0x27: { id: 0x27, cluster: 'MEDICAL', nameId: 'Paracetamol & Penurun Panas', nameEn: 'Paracetamol / Antipyretic' },
  0x28: { id: 0x28, cluster: 'MEDICAL', nameId: 'Antibiotik Salep Luka', nameEn: 'Antibiotic Ointment' },
  0x29: { id: 0x29, cluster: 'MEDICAL', nameId: 'Tabung Oksigen Portabel', nameEn: 'Portable Oxygen Canister' },
  0x2a: { id: 0x2a, cluster: 'MEDICAL', nameId: 'Vitamin & Suplemen Imunitas', nameEn: 'Vitamins & Supplements' },

  // 0x51 - 0x70: Perlengkapan Bayi & Balita (Infant & Toddler)
  0x51: { id: 0x51, cluster: 'INFANT', nameId: 'Susu Formula Bayi (0-6 Bulan)', nameEn: 'Infant Formula (0-6m)' },
  0x52: { id: 0x52, cluster: 'INFANT', nameId: 'Susu Formula Lanjutan (6-12 Bulan)', nameEn: 'Follow-on Formula (6-12m)' },
  0x53: { id: 0x53, cluster: 'INFANT', nameId: 'Popok Bayi Size S/M', nameEn: 'Baby Diapers Size S/M' },
  0x54: { id: 0x54, cluster: 'INFANT', nameId: 'Popok Bayi Size L/XL', nameEn: 'Baby Diapers Size L/XL' },
  0x55: { id: 0x55, cluster: 'INFANT', nameId: 'Minyak Telon & Kayu Putih', nameEn: 'Baby Warmth Oil (Telon)' },
  0x56: { id: 0x56, cluster: 'INFANT', nameId: 'Botol Susu & Sikat Sterilisasi', nameEn: 'Baby Feeding Bottles' },
  0x57: { id: 0x57, cluster: 'INFANT', nameId: 'Pakaian & Selimut Bayi', nameEn: 'Baby Clothes & Blanket' },

  // 0x71 - 0x90: Kebersihan Diri & Sanitasi (Hygiene & Sanitation)
  0x71: { id: 0x71, cluster: 'HYGIENE', nameId: 'Pembalut Wanita (Sanitary Pads)', nameEn: 'Sanitary Napkins' },
  0x72: { id: 0x72, cluster: 'HYGIENE', nameId: 'Sabun Mandi & Sampo', nameEn: 'Body Soap & Shampoo' },
  0x73: { id: 0x73, cluster: 'HYGIENE', nameId: 'Sikat Gigi & Pasta Gigi', nameEn: 'Toothbrush & Toothpaste' },
  0x74: { id: 0x74, cluster: 'HYGIENE', nameId: 'Popok Dewasa (Adult Diapers)', nameEn: 'Adult Diapers' },
  0x75: { id: 0x75, cluster: 'HYGIENE', nameId: 'Handuk Mandi Bersih', nameEn: 'Bath Towel' },
  0x76: { id: 0x76, cluster: 'HYGIENE', nameId: 'Tisu Basah & Kering', nameEn: 'Wet & Dry Wipes' },

  // 0x91 - 0xB0: Sandang & Alas Tidur (Clothing & Bedding)
  0x91: { id: 0x91, cluster: 'CLOTHING_BEDDING', nameId: 'Selimut Tebal / Hangat', nameEn: 'Thermal Blanket' },
  0x92: { id: 0x92, cluster: 'CLOTHING_BEDDING', nameId: 'Matras / Kasur Lipat / Tikar', nameEn: 'Sleeping Mat / Foldable Mattress' },
  0x93: { id: 0x93, cluster: 'CLOTHING_BEDDING', nameId: 'Pakaian Dalam Pria', nameEn: 'Men Underwear' },
  0x94: { id: 0x94, cluster: 'CLOTHING_BEDDING', nameId: 'Pakaian Dalam Wanita', nameEn: 'Women Underwear' },
  0x95: { id: 0x95, cluster: 'CLOTHING_BEDDING', nameId: 'Baju Hangat / Jaket Anak', nameEn: 'Kids Jacket / Warm Clothes' },
  0x96: { id: 0x96, cluster: 'CLOTHING_BEDDING', nameId: 'Baju Hangat / Jaket Dewasa', nameEn: 'Adult Jacket / Warm Clothes' },
  0x97: { id: 0x97, cluster: 'CLOTHING_BEDDING', nameId: 'Sarung / Mukena / Ibadah Kit', nameEn: 'Prayer Clothes & Mat' },
  0x98: { id: 0x98, cluster: 'CLOTHING_BEDDING', nameId: 'Terpal Plastik Alas Tenda', nameEn: 'Plastic Tarpaulin Sheet' },

  // 0xB1 - 0xD0: Alat Bantu & Kebutuhan Khusus (Special Assistive)
  0xb1: { id: 0xb1, cluster: 'ASSISTIVE', nameId: 'Kursi Roda Lipat', nameEn: 'Foldable Wheelchair' },
  0xb2: { id: 0xb2, cluster: 'ASSISTIVE', nameId: 'Tongkat Ketiak / Walker Lansia', nameEn: 'Crutches / Walking Frame' },
  0xb3: { id: 0xb3, cluster: 'ASSISTIVE', nameId: 'Kacamata Baca Lansia', nameEn: 'Reading Glasses' },
  0xb4: { id: 0xb4, cluster: 'ASSISTIVE', nameId: 'Alat Bantu Dengar', nameEn: 'Hearing Aid' },

  // 0xD1 - 0xFF: Peralatan Darurat & Perlindungan (Emergency Gear)
  0xd1: { id: 0xd1, cluster: 'EMERGENCY_TOOLS', nameId: 'Senter Kepala / Senter LED', nameEn: 'LED Flashlight / Headlamp' },
  0xd2: { id: 0xd2, cluster: 'EMERGENCY_TOOLS', nameId: 'Powerbank / Pengisi Daya Darurat', nameEn: 'Emergency Powerbank' },
  0xd3: { id: 0xd3, cluster: 'EMERGENCY_TOOLS', nameId: 'Lilin & Korek Api Gas', nameEn: 'Candles & Matches' },
  0xd4: { id: 0xd4, cluster: 'EMERGENCY_TOOLS', nameId: 'Peluit Darurat (Rescue Whistle)', nameEn: 'Emergency Rescue Whistle' },
  0xd5: { id: 0xd5, cluster: 'EMERGENCY_TOOLS', nameId: 'Kelambu Anti Nyamuk', nameEn: 'Mosquito Net' },
  0xd6: { id: 0xd6, cluster: 'EMERGENCY_TOOLS', nameId: 'Jas Hujan / Ponco Plastik', nameEn: 'Raincoat / Poncho' },
};

export const ALL_NEED_IDS = Object.keys(DISASTER_NEEDS_CATALOG).map(Number);
