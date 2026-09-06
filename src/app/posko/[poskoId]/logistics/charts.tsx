"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Icon } from "@/shared/ui/icon";

// Category colors for the pie chart
const CATEGORY_COLORS: Record<string, string> = {
  FOOD: "#3b82f6", // blue-500
  FOOD_WATER: "#3b82f6",
  MEDICAL: "#10b981", // emerald-500
  BABY_SUPPLIES: "#f43f5e", // rose-500
  INFANT: "#f43f5e",
  SHELTER: "#eab308", // yellow-500
  CLOTHING: "#8b5cf6", // violet-500
  CLOTHING_BEDDING: "#8b5cf6",
  HYGIENE: "#06b6d4", // cyan-500
  ASSISTIVE: "#ec4899", // pink-500
  EMERGENCY_TOOLS: "#f97316", // orange-500
  DEFAULT: "#94a3b8", // slate-400
};

const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case "FOOD":
    case "FOOD_WATER":
      return "Pangan & Air";
    case "MEDICAL":
      return "Medis";
    case "BABY_SUPPLIES":
    case "INFANT":
      return "Bayi & Balita";
    case "SHELTER":
      return "Tenda/Hunian";
    case "CLOTHING":
    case "CLOTHING_BEDDING":
      return "Pakaian";
    case "HYGIENE":
      return "Kebersihan";
    case "ASSISTIVE":
      return "Disabilitas";
    case "EMERGENCY_TOOLS":
      return "Alat Darurat";
    default:
      return "Lainnya";
  }
};

interface LogisticsChartsProps {
  inventory: Array<{
    id: string;
    itemName: string;
    category: string;
    currentQuantity: number;
    burnRateDays: number;
  }>;
}

export function LogisticsCharts({ inventory }: LogisticsChartsProps) {
  // Process data for Category Pie Chart
  const categoryDataMap: Record<string, number> = {};
  inventory.forEach((item) => {
    const label = getCategoryLabel(item.category);
    categoryDataMap[label] = (categoryDataMap[label] || 0) + item.currentQuantity;
  });

  const pieData = Object.entries(categoryDataMap)
    .map(([name, value]) => {
      // Find the first category that matches this label to get its color
      const originalCat = inventory.find((i) => getCategoryLabel(i.category) === name)?.category || "DEFAULT";
      return {
        name,
        value,
        color: CATEGORY_COLORS[originalCat] || CATEGORY_COLORS.DEFAULT,
      };
    })
    .filter((d) => d.value > 0);

  // Process data for Critical Items Bar Chart (Low Stock)
  const criticalItems = inventory
    .filter((item) => item.burnRateDays <= 3 || item.currentQuantity <= 20)
    .sort((a, b) => a.burnRateDays - b.burnRateDays)
    .slice(0, 5) // top 5 most critical
    .map((item) => ({
      name: item.itemName,
      qty: item.currentQuantity,
      burnRate: item.burnRateDays,
    }));

  if (inventory.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Stock Composition */}
      <Card className="shadow-2xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Icon name="box" size={14} className="text-primary" />
            Komposisi Stok
          </CardTitle>
        </CardHeader>
        <CardContent className="h-60 pt-0">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown) => [
                    `${Number(value || 0).toLocaleString()} items`,
                    "Total",
                  ]}
                  contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-text-muted">
              Tidak ada data stok
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Critical Items Warning */}
      <Card className="shadow-2xs border-status-danger-border/30 bg-status-danger-bg/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5 text-status-danger">
            <Icon name="alert" size={14} />
            Peringatan Stok Kritis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-60 pt-0">
          {criticalItems.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={criticalItems}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#475569" }}
                  width={90}
                />
                <Tooltip
                  formatter={(value: unknown, _name: unknown, item) => [
                    `${Number(value || 0).toLocaleString()} (Tahan ${(item as { payload?: { burnRate?: number } })?.payload?.burnRate ?? 0} hari)`,
                    "Kuantitas",
                  ]}
                  contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                />
                <Bar dataKey="qty" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16}>
                  {criticalItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.burnRate <= 1 ? "#dc2626" : "#f97316"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-text-muted">
              Semua stok dalam kondisi aman.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
