import { StaffRole, UserRole } from "@/core/shared/roles";

/**
 * Returns canonical, human-friendly Indonesian label for each user and staff role.
 */
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case "PETUGAS_MEDIS":
      return "Petugas Medis (Kesehatan & Triase)";
    case "PETUGAS_LOGISTIK":
      return "Petugas Logistik (Gudang & Single-Writer)";
    case "RELAWAN_LAPANGAN":
      return "Relawan Lapangan (Pendataan & Bantuan)";
    case "KOORDINATOR_POSKO":
      return "Koordinator Posko (Otoritas Tenda)";
    case "KOMANDAN_MISI":
      return "Komandan Misi (Operasi Wilayah)";
    case "PEMIMPIN_ORGANISASI":
      return "Pimpinan Lembaga Induk";
    case "WARGA_TAMU":
      return "Warga / Tamu";
    default:
      return "Petugas Lapangan";
  }
}

export interface RoleRoutingContext {
  orgId?: string;
  missionId?: string;
  poskoId?: string;
}

/**
 * Computes destination URL depending on 3-tier hierarchy:
 * - PEMIMPIN_ORGANISASI -> /org
 * - KOMANDAN_MISI -> /missions/[missionId]
 * - Tactical Posko roles -> /posko/[poskoId]
 */
export function getRoleDefaultPath(
  role: string,
  context?: RoleRoutingContext
): string {
  if (role === "PEMIMPIN_ORGANISASI") {
    return "/org";
  }
  if (role === "KOMANDAN_MISI") {
    return `/missions/${context?.missionId || "MSN-LOCAL"}`;
  }
  return `/posko/${context?.poskoId || "POS-01"}`;
}
