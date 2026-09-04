import * as React from "react";
import { RefugeeDetailView } from "@/features/refugees/components/refugee-detail-view";

export function generateStaticParams() {
  const poskos = ["POS-01", "POS-02", "POS-03", "POS-04"];
  const refugees = ["REF-001", "REF-002", "REF-003", "REF-004", "REF-005"];

  const params: { poskoId: string; refugeeId: string }[] = [];
  for (const poskoId of poskos) {
    for (const refugeeId of refugees) {
      params.push({ poskoId, refugeeId });
    }
  }
  return params;
}

export default async function RefugeeDetailPage({
  params,
}: {
  params: Promise<{ poskoId: string; refugeeId: string }>;
}) {
  const resolvedParams = await params;
  return <RefugeeDetailView refugeeId={resolvedParams.refugeeId} />;
}
