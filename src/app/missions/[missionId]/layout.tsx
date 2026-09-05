import * as React from "react";
import { MissionShell } from "@/features/mission/components/mission-shell";

export async function generateStaticParams() {
  return [
  { missionId: "MSN-2026-01" },
  { missionId: "MSN-2026-02" },
  { missionId: "MSN-01" },
  { missionId: "default" },
  ];
}

export default async function MissionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;

  return (
  <MissionShell missionId={missionId}>
  {children}
  </MissionShell>
  );
}
