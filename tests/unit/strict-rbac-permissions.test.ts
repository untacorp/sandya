import assert from 'node:assert';
import {
  canMutateStock,
  canApproveDistribution,
  canDeliverAid,
  canConductTriage,
  canDeclareDeceased,
  canIntakeRefugees,
  canManageRefugeeProfile,
  canRecordMedicalEvent,
  canSubmitNeedsRequest,
  canManageWaybills,
  canManageMissionWaybills,
  canCreatePosko,
  canManageMissionSettings,
  canManagePoskoSettings,
  canAccessOrgConsole,
  canSendTacticalMessage,
  canCancelSOS,
} from '@/core/permissions/posko-permissions';

type Role =
  | 'PEMIMPIN_ORGANISASI'
  | 'KOMANDAN_MISI'
  | 'KOORDINATOR_POSKO'
  | 'PETUGAS_MEDIS'
  | 'PETUGAS_LOGISTIK'
  | 'RELAWAN_LAPANGAN'
  | 'WARGA_TAMU';

const ALL_ROLES: Role[] = [
  'PEMIMPIN_ORGANISASI',
  'KOMANDAN_MISI',
  'KOORDINATOR_POSKO',
  'PETUGAS_MEDIS',
  'PETUGAS_LOGISTIK',
  'RELAWAN_LAPANGAN',
  'WARGA_TAMU',
];

interface CapabilitySpec {
  name: string;
  check: (role: string) => boolean;
  expected: Record<Role, boolean>;
}

const CAPABILITIES: CapabilitySpec[] = [
  {
    name: '1. Mutasi Stok Fisik Gudang Posko (Single-Writer)',
    check: canMutateStock,
    expected: {
      PEMIMPIN_ORGANISASI: false,
      KOMANDAN_MISI: false,
      KOORDINATOR_POSKO: false,
      PETUGAS_MEDIS: false,
      PETUGAS_LOGISTIK: true,
      RELAWAN_LAPANGAN: false,
      WARGA_TAMU: false,
    },
  },
  {
    name: '2. Persetujuan & Potong Stok Tiket Bantuan',
    check: canApproveDistribution,
    expected: {
      PEMIMPIN_ORGANISASI: false,
      KOMANDAN_MISI: false,
      KOORDINATOR_POSKO: false,
      PETUGAS_MEDIS: false,
      PETUGAS_LOGISTIK: true,
      RELAWAN_LAPANGAN: false,
      WARGA_TAMU: false,
    },
  },
  {
    name: '3. Penyerahan Fisik Bantuan ke Tenda',
    check: canDeliverAid,
    expected: {
      PEMIMPIN_ORGANISASI: false,
      KOMANDAN_MISI: false,
      KOORDINATOR_POSKO: true,
      PETUGAS_MEDIS: false,
      PETUGAS_LOGISTIK: true,
      RELAWAN_LAPANGAN: true,
      WARGA_TAMU: false,
    },
  },
  {
    name: '4. Pemeriksaan Klinis & Triase START (4-Warna)',
    check: canConductTriage,
    expected: {
      PEMIMPIN_ORGANISASI: false,
      KOMANDAN_MISI: false,
      KOORDINATOR_POSKO: false,
      PETUGAS_MEDIS: true,
      PETUGAS_LOGISTIK: false,
      RELAWAN_LAPANGAN: false,
      WARGA_TAMU: false,
    },
  },
  {
    name: '5. Vonis Triase Hitam (Wafat) & Resolusi Jenazah',
    check: canDeclareDeceased,
    expected: {
      PEMIMPIN_ORGANISASI: false,
      KOMANDAN_MISI: false,
      KOORDINATOR_POSKO: false,
      PETUGAS_MEDIS: true,
      PETUGAS_LOGISTIK: false,
      RELAWAN_LAPANGAN: false,
      WARGA_TAMU: false,
    },
  },
  {
    name: '6. Pendaftaran Warga (Fast Intake 30s & Bulk AI OCR)',
    check: canIntakeRefugees,
    expected: {
      PEMIMPIN_ORGANISASI: false,
      KOMANDAN_MISI: false,
      KOORDINATOR_POSKO: true,
      PETUGAS_MEDIS: true,
      PETUGAS_LOGISTIK: true,
      RELAWAN_LAPANGAN: true,
      WARGA_TAMU: false,
    },
  },
  {
    name: '7. Edit Data Pokok & Checkout Warga',
    check: canManageRefugeeProfile,
    expected: {
      PEMIMPIN_ORGANISASI: false,
      KOMANDAN_MISI: false,
      KOORDINATOR_POSKO: true,
      PETUGAS_MEDIS: true,
      PETUGAS_LOGISTIK: true,
      RELAWAN_LAPANGAN: true,
      WARGA_TAMU: false,
    },
  },
  {
    name: '8. Rekam Peristiwa Medis (HEALTH_CHECK, TRIAGE_UPDATE)',
    check: canRecordMedicalEvent,
    expected: {
      PEMIMPIN_ORGANISASI: false,
      KOMANDAN_MISI: false,
      KOORDINATOR_POSKO: false,
      PETUGAS_MEDIS: true,
      PETUGAS_LOGISTIK: false,
      RELAWAN_LAPANGAN: false,
      WARGA_TAMU: false,
    },
  },
  {
    name: '9. Pengajuan Tiket Kebutuhan Warga (PENDING)',
    check: canSubmitNeedsRequest,
    expected: {
      PEMIMPIN_ORGANISASI: false,
      KOMANDAN_MISI: false,
      KOORDINATOR_POSKO: true,
      PETUGAS_MEDIS: true,
      PETUGAS_LOGISTIK: true,
      RELAWAN_LAPANGAN: true,
      WARGA_TAMU: false,
    },
  },
  {
    name: '10. Surat Jalan Logistik Posko (Minta Suplai / Terima Truk)',
    check: canManageWaybills,
    expected: {
      PEMIMPIN_ORGANISASI: false,
      KOMANDAN_MISI: false,
      KOORDINATOR_POSKO: false,
      PETUGAS_MEDIS: false,
      PETUGAS_LOGISTIK: true,
      RELAWAN_LAPANGAN: false,
      WARGA_TAMU: false,
    },
  },
  {
    name: '11. Surat Jalan Truk Gudang Sentral Misi',
    check: canManageMissionWaybills,
    expected: {
      PEMIMPIN_ORGANISASI: true,
      KOMANDAN_MISI: true,
      KOORDINATOR_POSKO: false,
      PETUGAS_MEDIS: false,
      PETUGAS_LOGISTIK: true,
      RELAWAN_LAPANGAN: false,
      WARGA_TAMU: false,
    },
  },
  {
    name: '12. Buka Posko Lapangan Baru',
    check: canCreatePosko,
    expected: {
      PEMIMPIN_ORGANISASI: true,
      KOMANDAN_MISI: true,
      KOORDINATOR_POSKO: false,
      PETUGAS_MEDIS: false,
      PETUGAS_LOGISTIK: false,
      RELAWAN_LAPANGAN: false,
      WARGA_TAMU: false,
    },
  },
  {
    name: '13. Pengaturan Misi Bencana',
    check: canManageMissionSettings,
    expected: {
      PEMIMPIN_ORGANISASI: true,
      KOMANDAN_MISI: true,
      KOORDINATOR_POSKO: false,
      PETUGAS_MEDIS: false,
      PETUGAS_LOGISTIK: false,
      RELAWAN_LAPANGAN: false,
      WARGA_TAMU: false,
    },
  },
  {
    name: '14. Pengaturan Posko & Delegasi Kartu Staf',
    check: canManagePoskoSettings,
    expected: {
      PEMIMPIN_ORGANISASI: true,
      KOMANDAN_MISI: true,
      KOORDINATOR_POSKO: true,
      PETUGAS_MEDIS: false,
      PETUGAS_LOGISTIK: false,
      RELAWAN_LAPANGAN: false,
      WARGA_TAMU: false,
    },
  },
  {
    name: '15. Konsol Lembaga & Master Key Ed25519',
    check: canAccessOrgConsole,
    expected: {
      PEMIMPIN_ORGANISASI: true,
      KOMANDAN_MISI: false,
      KOORDINATOR_POSKO: false,
      PETUGAS_MEDIS: false,
      PETUGAS_LOGISTIK: false,
      RELAWAN_LAPANGAN: false,
      WARGA_TAMU: false,
    },
  },
  {
    name: '16. Intercom Taktis & Transmisi PTT (Non-Tamu)',
    check: canSendTacticalMessage,
    expected: {
      PEMIMPIN_ORGANISASI: true,
      KOMANDAN_MISI: true,
      KOORDINATOR_POSKO: true,
      PETUGAS_MEDIS: true,
      PETUGAS_LOGISTIK: true,
      RELAWAN_LAPANGAN: true,
      WARGA_TAMU: false,
    },
  },
];

async function runStrictRbacTests() {
  console.log('\n==================================================================');
  console.log('RUNNING STRICT RBAC PERMISSIONS MATRIX TEST SUITE (112 SCENARIOS)');
  console.log('==================================================================\n');

  let passedScenarios = 0;

  for (const cap of CAPABILITIES) {
    for (const role of ALL_ROLES) {
      const expected = cap.expected[role];
      const actual = cap.check(role);

      assert.strictEqual(
        actual,
        expected,
        `[RBAC FAILURE] ${cap.name} for role ${role} expected ${expected} but received ${actual}`
      );
      passedScenarios++;
    }
    console.log(`  [PASS] ${cap.name} verified across all 7 roles`);
  }

  // Verification for SOS Cancel capability
  console.log('\nTesting Additional Guard: canCancelSOS');
  assert.strictEqual(canCancelSOS('PEMIMPIN_ORGANISASI'), true);
  assert.strictEqual(canCancelSOS('KOMANDAN_MISI'), true);
  assert.strictEqual(canCancelSOS('KOORDINATOR_POSKO'), true);
  assert.strictEqual(canCancelSOS('PETUGAS_MEDIS'), false);
  assert.strictEqual(canCancelSOS('PETUGAS_LOGISTIK'), false);
  assert.strictEqual(canCancelSOS('RELAWAN_LAPANGAN'), false);
  assert.strictEqual(canCancelSOS('WARGA_TAMU'), false);
  console.log('  [PASS] canCancelSOS verified: only Leadership/Coordinators can cancel emergency alarm');

  console.log(`\n[SUCCESS] ALL ${passedScenarios + 7} STRICT RBAC SCENARIOS PASSED (100% GREEN)!\n`);
}

runStrictRbacTests().catch((err) => {
  console.error('[FAIL] Strict RBAC test failed:', err);
  process.exit(1);
});
