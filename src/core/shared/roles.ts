/**
 * Canonical User Roles & Staff Pass Roles
 * Single Source of Truth untuk hierarki otorisasi dan kartu penugasan lapangan (Role Pass).
 */

export const ALL_USER_ROLES = [
  'PEMIMPIN_ORGANISASI',
  'KOMANDAN_MISI',
  'KOORDINATOR_POSKO',
  'PETUGAS_MEDIS',
  'PETUGAS_LOGISTIK',
  'RELAWAN_LAPANGAN',
  'WARGA_TAMU',
] as const;

export type UserRole = (typeof ALL_USER_ROLES)[number];

export const STAFF_ROLES = [
  'PEMIMPIN_ORGANISASI',
  'KOMANDAN_MISI',
  'KOORDINATOR_POSKO',
  'PETUGAS_MEDIS',
  'PETUGAS_LOGISTIK',
  'RELAWAN_LAPANGAN',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
