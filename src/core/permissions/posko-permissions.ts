/**
 * Posko Role Permissions & Capability Matrix
 * Centralized Single Source of Truth for RBAC authority across Sandya operations.
 * Enforces strict separation of duties:
 * - Single-Writer Ledger for Posko Warehouse (PETUGAS_LOGISTIK only)
 * - Clinical Medical Authority for Triage & Prescriptions (PETUGAS_MEDIS only)
 * - Frontline Registration & Delivery (Field Staff)
 * - Macro Organization Governance (PEMIMPIN_ORGANISASI with Master Key)
 * - Macro Incident Command (KOMANDAN_MISI)
 * - Public Non-Staff Mode (WARGA_TAMU)
 */

import { ALL_USER_ROLES, STAFF_ROLES, type UserRole, type StaffRole } from '@/core/shared/roles';

// 1. Single-Writer Warehouse Mutation Authority (Posko Level)
export const LOGISTICS_MUTATION_ROLES = [
  'PETUGAS_LOGISTIK',
  'LOGISTIK',
] as const;

// 2. Logistics Distribution Approval & Stock Allocation Authority
export const LOGISTICS_APPROVE_ROLES = [
  'PETUGAS_LOGISTIK',
  'LOGISTIK',
] as const;

// 3. Physical Aid Delivery to Refugee Tents (Field Runners)
export const AID_DELIVERY_ROLES = [
  'RELAWAN_LAPANGAN',
  'RELAWAN',
  'PETUGAS_LOGISTIK',
  'LOGISTIK',
  'KOORDINATOR_POSKO',
  'KOORDINATOR',
] as const;

// 4. Clinical Medical & Triage START Examination Authority
export const CLINICAL_TRIAGE_ROLES = [
  'PETUGAS_MEDIS',
  'MEDIS',
  'DOKTER',
] as const;

// 5. Refugee Registration & Field Intake Authority
export const REFUGEE_INTAKE_ROLES = [
  'RELAWAN_LAPANGAN',
  'RELAWAN',
  'KOORDINATOR_POSKO',
  'KOORDINATOR',
  'PETUGAS_MEDIS',
  'MEDIS',
  'PETUGAS_LOGISTIK',
  'LOGISTIK',
] as const;

// 6. Refugee Profile Management (Edit Data & Checkout)
export const REFUGEE_MANAGEMENT_ROLES = [
  'RELAWAN_LAPANGAN',
  'RELAWAN',
  'KOORDINATOR_POSKO',
  'KOORDINATOR',
  'PETUGAS_LOGISTIK',
  'LOGISTIK',
  'PETUGAS_MEDIS',
  'MEDIS',
] as const;

// 7. Posko Administration & Team Pass Delegation Authority
export const POSKO_ADMIN_ROLES = [
  'KOORDINATOR_POSKO',
  'KOORDINATOR',
  'KOMANDAN_MISI',
  'KOMANDAN',
  'PEMIMPIN_ORGANISASI',
  'PEMIMPIN',
] as const;

// 8. Disaster Mission Command Authority (Macro Level)
export const MISSION_COMMAND_ROLES = [
  'KOMANDAN_MISI',
  'KOMANDAN',
  'PEMIMPIN_ORGANISASI',
  'PEMIMPIN',
] as const;

// 9. Central Hub Logistics Waybills (Mission Level)
export const MISSION_LOGISTICS_ROLES = [
  'KOMANDAN_MISI',
  'KOMANDAN',
  'PETUGAS_LOGISTIK',
  'LOGISTIK',
  'PEMIMPIN_ORGANISASI',
  'PEMIMPIN',
] as const;

// 10. Organization Leader Authority (Master Key Ed25519)
export const ORG_LEADER_ROLES = [
  'PEMIMPIN_ORGANISASI',
  'PEMIMPIN',
] as const;

/* =========================================================================
 * Granular Capability Helper Functions
 * ========================================================================= */

/**
 * 1. Checks whether the active role has authority to mutate physical warehouse stock
 * (Single-Writer Ledger invariant: PETUGAS_LOGISTIK only).
 */
export function canMutateStock(role: string): boolean {
  return (LOGISTICS_MUTATION_ROLES as readonly string[]).includes(role);
}

/**
 * 2. Checks whether the active role can approve and deduct stock for refugee needs requests.
 */
export function canApproveDistribution(role: string): boolean {
  return (LOGISTICS_APPROVE_ROLES as readonly string[]).includes(role);
}

/**
 * 3. Checks whether the active role can deliver physical aid to refugees in tents and mark completed.
 */
export function canDeliverAid(role: string): boolean {
  return (AID_DELIVERY_ROLES as readonly string[]).includes(role);
}

/**
 * 4. Checks whether the active role can conduct triage exams and issue medical prescriptions.
 */
export function canConductTriage(role: string): boolean {
  return (CLINICAL_TRIAGE_ROLES as readonly string[]).includes(role);
}

/**
 * 5. Checks whether the active role can issue official death declaration (Black Triage).
 */
export function canDeclareDeceased(role: string): boolean {
  return (CLINICAL_TRIAGE_ROLES as readonly string[]).includes(role);
}

/**
 * 6. Checks whether the active role can intake new refugees (Fast 30s & Bulk AI OCR).
 */
export function canIntakeRefugees(role: string): boolean {
  return (REFUGEE_INTAKE_ROLES as readonly string[]).includes(role);
}

/**
 * 7. Checks whether the active role can edit refugee identity or checkout refugees.
 */
export function canManageRefugeeProfile(role: string): boolean {
  return (REFUGEE_MANAGEMENT_ROLES as readonly string[]).includes(role);
}

/**
 * 8. Checks whether the active role can record clinical health check events.
 */
export function canRecordMedicalEvent(role: string): boolean {
  return (CLINICAL_TRIAGE_ROLES as readonly string[]).includes(role);
}

/**
 * 9. Checks whether the active role can submit urgent needs requests (PENDING).
 */
export function canSubmitNeedsRequest(role: string): boolean {
  return (REFUGEE_INTAKE_ROLES as readonly string[]).includes(role);
}

/**
 * 10. Checks whether the active role can manage posko-level waybills (request supplies / confirm truck arrival).
 */
export function canManageWaybills(role: string): boolean {
  return (LOGISTICS_MUTATION_ROLES as readonly string[]).includes(role);
}

/**
 * 11. Checks whether the active role can issue central truck dispatch waybills at mission level.
 */
export function canManageMissionWaybills(role: string): boolean {
  return (MISSION_LOGISTICS_ROLES as readonly string[]).includes(role);
}

/**
 * 12. Checks whether the active role can establish a new physical posko under a mission.
 */
export function canCreatePosko(role: string): boolean {
  return (MISSION_COMMAND_ROLES as readonly string[]).includes(role);
}

/**
 * 13. Checks whether the active role can edit mission parameters or archive a disaster mission.
 */
export function canManageMissionSettings(role: string): boolean {
  return (MISSION_COMMAND_ROLES as readonly string[]).includes(role);
}

/**
 * 14. Checks whether the active role can edit posko parameters and delegate staff role passes.
 */
export function canManagePoskoSettings(role: string): boolean {
  return (POSKO_ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Legacy alias for posko team management.
 */
export function canManagePoskoTeam(role: string): boolean {
  return (POSKO_ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * 15. Checks whether the active role can access the organization console & master cryptographic keyring.
 */
export function canAccessOrgConsole(role: string): boolean {
  return (ORG_LEADER_ROLES as readonly string[]).includes(role);
}

/**
 * 16. Checks whether the active role can broadcast tactical chat messages & transmit PTT voice notes.
 */
export function canSendTacticalMessage(role: string): boolean {
  return role !== 'WARGA_TAMU' && role !== 'GUEST' && role !== 'TAMU';
}

/**
 * Checks whether the active role can cancel an active emergency SOS siren alarm.
 */
export function canCancelSOS(role: string): boolean {
  return (POSKO_ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Checks whether the active role can search for separated family members (Family Reunion).
 */
export function canSearchReunion(role: string): boolean {
  return true; // Universal access (staff and public refugees)
}
