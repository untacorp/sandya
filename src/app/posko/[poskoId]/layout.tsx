import * as React from "react";
import { PoskoShell } from "@/features/posko/components/posko-shell";

export function generateStaticParams() {
  return [
  { poskoId: "POS-01" },
  { poskoId: "POS-02" },
  { poskoId: "POS-03" },
  { poskoId: "POS-04" },
  { poskoId: "default" },
  ];
}

export default function PoskoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PoskoShell>{children}</PoskoShell>;
}
