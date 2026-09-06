import { LandingGatewayPage } from "@/features/auth/components/landing-gateway-page";

export const metadata = {
  title: "Portal Akses Operasional Posko — Sandya",
  description: "Pintu masuk pindaian kartu tugas, pencarian warga, dan aktivasi sesi posko bencana.",
};

export default function GatewayRoute() {
  return <LandingGatewayPage />;
}
