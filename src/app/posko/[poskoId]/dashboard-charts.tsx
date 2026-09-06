"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";
import { Icon } from "@/shared/ui/icon";
import Link from "next/link";

interface DashboardChartsProps {
  effectivePoskoId: string;
  totalRefugees: number;
  capacity: number;
  occupancyPercent: number;
  redTriage: number;
  yellowTriage: number;
  greenTriage: number;
  blackTriage: number;
  balitaCount: number;
  bumilCount: number;
  lansiaCount: number;
  disabilitasCount: number;
}

export function DashboardCharts({
  effectivePoskoId,
  totalRefugees,
  capacity,
  occupancyPercent,
  redTriage,
  yellowTriage,
  greenTriage,
  blackTriage,
  balitaCount,
  bumilCount,
  lansiaCount,
  disabilitasCount,
}: DashboardChartsProps) {
  // 1. Data Gauge Kapasitas (Semi-circle donut 180deg to 0deg)
  const remainingCapacity = Math.max(0, capacity - totalRefugees);
  const capacityData = [
    { name: "Terisi", value: totalRefugees },
    { name: "Sisa", value: remainingCapacity },
  ];
  const isOverCapacity = occupancyPercent >= 90;
  const capacityColor = isOverCapacity ? "#ef4444" : "#2563eb";

  // 2. Data Donut Triase Medis
  const totalTriageUrgent = redTriage + yellowTriage;
  const triageData = [
    { name: "Merah (Gawat)", value: redTriage, color: "#ef4444" },
    { name: "Kuning (Darurat)", value: yellowTriage, color: "#f59e0b" },
    { name: "Hijau (Ringan)", value: greenTriage, color: "#22c55e" },
    { name: "Hitam (Meninggal)", value: blackTriage, color: "#1f2937" },
  ].filter((d) => d.value > 0);

  // 3. Data Kerentanan
  const vulnerabilityData = [
    { name: "Balita", count: balitaCount, color: "#f97316" },
    { name: "Bumil", count: bumilCount, color: "#ec4899" },
    { name: "Lansia", count: lansiaCount, color: "#8b5cf6" },
    { name: "Disabilitas", count: disabilitasCount, color: "#06b6d4" },
  ];
  const totalVulnerable = balitaCount + bumilCount + lansiaCount + disabilitasCount;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* 1. KARTU KAPASITAS & OKUPANSI (Gauge Speedometer) */}
      <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-muted">
          <span className="text-xs font-semibold">Okupansi & Kapasitas</span>
          <Icon name="users" variant="linear" size={18} />
        </div>

        <div className="relative h-32 w-full flex items-center justify-center my-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={capacityData}
                cx="50%"
                cy="85%"
                startAngle={180}
                endAngle={0}
                innerRadius={55}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={capacityColor} />
                <Cell fill="#f1f5f9" />
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0];
                    return (
                      <div className="bg-surface p-2 rounded-lg border border-border shadow-md text-xs">
                        <span className="font-bold text-text-main">{d.name}:</span>{" "}
                        <span className="text-primary font-bold">{d.value} Jiwa</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Angka di tengah poros speedometer */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <span
              className={`text-xl font-black tracking-tight ${
                isOverCapacity ? "text-status-danger" : "text-text-main"
              }`}
            >
              {occupancyPercent}%
            </span>
            <span className="text-[10px] text-text-muted block -mt-0.5">Terisi</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-muted border-t border-border/60 pt-2 mt-1">
          <span>
            Total: <strong className="text-text-main">{totalRefugees}</strong> jiwa
          </span>
          <span>
            Batas: <strong className="text-text-main">{capacity}</strong> jiwa
          </span>
        </div>
      </div>

      {/* 2. KARTU PEMERIKSAAN MEDIS (Donut Triase) */}
      <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-muted">
          <span className="text-xs font-semibold">Pemeriksaan Medis (Triase)</span>
          <Icon name="health" variant="linear" size={18} className="text-status-danger" />
        </div>

        <div className="relative h-32 w-full flex items-center justify-center my-1">
          {triageData.length === 0 ? (
            <div className="text-center py-6 text-xs text-text-muted">
              Belum ada data triase medis
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={triageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {triageData.map((entry, idx) => (
                      <Cell key={`triage-cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0];
                        return (
                          <div className="bg-surface p-2 rounded-lg border border-border shadow-md text-xs">
                            <span className="font-bold text-text-main">{d.name}:</span>{" "}
                            <span className="font-bold" style={{ color: d.payload.color }}>
                              {d.value} Orang
                            </span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Teks di tengah Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black text-status-danger leading-none">
                  {totalTriageUrgent}
                </span>
                <span className="text-[9px] text-text-muted font-bold uppercase mt-0.5">
                  Mendesak
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-muted border-t border-border/60 pt-2 mt-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-danger" />
              {redTriage} Merah
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-warning" />
              {yellowTriage} Kuning
            </span>
          </div>
          <Link
            href={`/posko/${effectivePoskoId}/refugees/triage`}
            className="text-primary font-bold hover:underline"
          >
            Buka Medis &rarr;
          </Link>
        </div>
      </div>

      {/* 3. KARTU KELOMPOK RENTAN (Bar Chart Proporsi) */}
      <div className="p-4 rounded-xl bg-surface border border-border shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-text-muted">
          <span className="text-xs font-semibold">Kelompok Rentan Prioritas</span>
          <Icon name="health" variant="linear" size={18} className="text-status-warning" />
        </div>

        <div className="h-32 w-full flex items-center justify-center my-1">
          {totalVulnerable === 0 ? (
            <div className="text-center py-6 text-xs text-text-muted">
              Tidak ada kelompok rentan tercatat
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vulnerabilityData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0];
                      return (
                        <div className="bg-surface p-2 rounded-lg border border-border shadow-md text-xs">
                          <span className="font-bold text-text-main">{d.payload.name}:</span>{" "}
                          <span className="font-bold text-primary">{d.value} Jiwa</span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {vulnerabilityData.map((entry, index) => (
                    <Cell key={`vuln-cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-text-muted border-t border-border/60 pt-2 mt-1">
          <span>
            Total Prioritas: <strong className="text-text-main">{totalVulnerable}</strong> jiwa
          </span>
          <span className="text-[10px] text-text-muted">
            {balitaCount} Bayi • {bumilCount} Bumil
          </span>
        </div>
      </div>
    </div>
  );
}
