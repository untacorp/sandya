"use client";

import * as React from "react";
import { PoskoHeader } from "@/features/posko/components/posko-header";
import {
  PoskoBottomNav,
  PoskoDesktopSidebar,
} from "@/features/posko/components/posko-navigation";
import { FastIntakeFAB } from "@/features/refugees/components/fast-intake-modal";
import { PoskoSwitcherModal } from "@/features/posko/components/posko-switcher";

import { useParams, usePathname } from "next/navigation";
import { usePoskoStore } from "@/features/posko/store/use-posko-store";
import { ServiceContainer } from "@/infrastructure/services/service-container";
import { asPoskoId, asItemId, asRefugeeId } from "@/core/shared/branded-types";
import { InventoryAggregate, type InventoryCategory } from "@/core/domain/logistics/inventory.aggregate";
import { RefugeeAggregate } from "@/core/domain/refugees/refugee.aggregate";
import { type ItemCategory } from "@/shared/types";
import { useMeshSync } from "@/features/posko/hooks/use-mesh-sync";

const toInventoryCategory = (cat: string): InventoryCategory => {
  if (cat === "BABY_SUPPLIES") return "INFANT";
  if (["FOOD", "CLOTHING", "MEDICAL", "HYGIENE", "SHELTER", "INFANT", "ASSISTIVE", "EMERGENCY_TOOLS"].includes(cat)) {
    return cat as InventoryCategory;
  }
  return "OTHER";
};

export function PoskoShell({ children }: { children: React.ReactNode }) {
  // Global BLE mesh synchronization hook active across all posko screens
  useMeshSync();

  const [switcherOpen, setSwitcherOpen] = React.useState(false);
  const params = useParams();
  const pathname = usePathname();
  const { session, poskos, inventory, refugees, hydrateStore, setSessionPosko } = usePoskoStore();

  const routePoskoId = (params?.poskoId as string) || (pathname?.startsWith("/posko/") ? pathname.split("/")[2] : "");
  const activePoskoId = (routePoskoId && routePoskoId !== "POS-LOCAL") ? routePoskoId : (session.poskoId && session.poskoId !== "POS-LOCAL" ? session.poskoId : (routePoskoId || "POS-01"));

  const matchedPosko = poskos.find((p) => p.id === routePoskoId);
  // Prefer store name → existing session name → ID fallback (never clobber a real name)
  const targetPoskoName = matchedPosko?.name || session.poskoName || `Posko ${routePoskoId}`;

  const [hasHydrated, setHasHydrated] = React.useState(false);

  React.useEffect(() => {
    setHasHydrated(usePoskoStore.persist.hasHydrated());
    const unsub = usePoskoStore.persist.onFinishHydration(() => setHasHydrated(true));
    return () => {
      if (unsub) unsub();
    };
  }, []);

  React.useEffect(() => {
    if (!hasHydrated) return;
    if (routePoskoId && routePoskoId !== "POS-LOCAL" && session.poskoId !== routePoskoId) {
      // Only sync poskoId; preserve existing poskoName if we don't have a store entry yet
      setSessionPosko(routePoskoId, matchedPosko?.name || session.poskoName || `Posko ${routePoskoId}`);
    }
  }, [hasHydrated, routePoskoId, session.poskoId, matchedPosko, session.poskoName, setSessionPosko]);

  React.useEffect(() => {
  let isCancelled = false;

  const syncWithBackend = async () => {
  try {
  const container = ServiceContainer.getInstance();
  const poskoId = asPoskoId(activePoskoId);

  // 1. Pastikan data dari state tersimpan ke backend SQLite jika belum terdaftar
  for (const item of inventory) {
    if (item.postId && item.postId !== activePoskoId) continue;
    const check = await container.inventoryRepo.findById(asItemId(item.id));
    if (!check.ok || !check.value) {
      const agg = InventoryAggregate.reconstitute({
        id: asItemId(item.id),
        poskoId: asPoskoId(item.postId || activePoskoId),
        itemName: item.itemName,
        category: toInventoryCategory(item.category),
        currentQuantity: item.currentQuantity,
        unit: item.unit,
        lastUpdatedAt: item.lastUpdatedAt,
        version: 1,
      });
      await container.inventoryRepo.save(agg);
    } else {
      const existingSnap = check.value.toSnapshot();
      if (existingSnap.lastUpdatedAt < item.lastUpdatedAt || existingSnap.currentQuantity !== item.currentQuantity) {
        const agg = InventoryAggregate.reconstitute({
          ...existingSnap,
          currentQuantity: item.currentQuantity,
          lastUpdatedAt: Math.max(existingSnap.lastUpdatedAt, item.lastUpdatedAt),
        });
        await container.inventoryRepo.save(agg);
      }
    }
  }

  for (const person of refugees) {
    if (person.postId && person.postId !== activePoskoId) continue;
    const check = await container.refugeeRepo.findById(asRefugeeId(person.id));
    if (!check.ok || !check.value) {
      const agg = RefugeeAggregate.reconstitute({
        id: asRefugeeId(person.id),
        poskoId: asPoskoId(person.postId || activePoskoId),
        fullName: person.fullName,
        nationalId: person.nik || null,
        gender: person.gender,
        age: person.age,
        domicileOrigin: person.domicileOrigin || null,
        shelterLocation: person.shelterLocation || null,
        missingKinName: person.missingKinName || null,
        currentTriage: person.triageStatus || "GREEN",
        registeredByUserId: person.registeredByUserId,
        createdAt: person.createdAt,
        version: 1,
      });
      await container.refugeeRepo.save(agg);
    } else {
      // Perbarui record SQLite yang sudah ada agar data dari QR (Zustand) tidak ditimpa state lama
      const existingSnap = check.value.toSnapshot();
      const agg = RefugeeAggregate.reconstitute({
        ...existingSnap,
        currentTriage: person.triageStatus || existingSnap.currentTriage,
      });
      await container.refugeeRepo.save(agg);
    }
  }

  // 2. Tarik data dari backend SQLite ke Zustand jika ada data dari backend
  const [invRes, refRes] = await Promise.all([
  container.inventoryRepo.findByPoskoId(poskoId),
  container.refugeeRepo.findByPoskoId(poskoId),
  ]);

  if (isCancelled) return;

  const toItemCategory = (cat: string): ItemCategory => {
  if (cat === "INFANT") return "BABY_SUPPLIES";
  if (["FOOD", "CLOTHING", "MEDICAL", "HYGIENE", "SHELTER", "BABY_SUPPLIES"].includes(cat)) {
  return cat as ItemCategory;
  }
  return "FOOD";
  };

  const backendInventory = invRes.ok
  ? invRes.value.map((agg) => {
  const snap = agg.toSnapshot();
  return {
  id: snap.id,
  postId: snap.poskoId,
  itemName: snap.itemName,
  category: toItemCategory(snap.category),
  currentQuantity: snap.currentQuantity,
  unit: snap.unit,
  burnRateDays: 5,
  lastUpdatedAt: snap.lastUpdatedAt,
  };
  })
  : [];

  const backendRefugees = refRes.ok
  ? refRes.value.map((agg) => {
  const snap = agg.toSnapshot();
  return {
  id: snap.id,
  postId: snap.poskoId,
  fullName: snap.fullName,
  nik: snap.nationalId,
  gender: snap.gender,
  age: snap.age,
  domicileOrigin: snap.domicileOrigin || "",
  shelterLocation: snap.shelterLocation || "",
  missingKinName: snap.missingKinName || undefined,
  vulnerabilities: [],
  urgentNeeds: [],
  registeredByUserId: snap.registeredByUserId,
  registeredByUserName: "Petugas",
  triageStatus: snap.currentTriage,
  createdAt: snap.createdAt,
  };
  })
  : [];

  if (backendInventory.length > 0 || backendRefugees.length > 0) {
  hydrateStore({
  inventory: backendInventory.length > 0 ? backendInventory : undefined,
  refugees: backendRefugees.length > 0 ? backendRefugees : undefined,
  });
  }
  } catch (err) {
  console.error("Hydration sync error:", err);
  }
  };

  syncWithBackend();

  return () => {
  isCancelled = true;
  };
  }, [activePoskoId]);

  return (
    <div className="min-h-[100dvh] flex bg-canvas text-text-main">
      {/* Desktop Sidebar */}
      <PoskoDesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-8">
  {/* Sticky Header */}
  <PoskoHeader />

  {/* Page Content */}
  <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 md:p-8">
  {children}
  </main>

  {/* Floating Action Button (Fast Intake 30s) */}
  <FastIntakeFAB />

  {/* Mobile Bottom Navigation Bar */}
  <PoskoBottomNav />

  {/* Posko & Role Switcher Modal */}
  <PoskoSwitcherModal
  open={switcherOpen}
  onOpenChange={setSwitcherOpen}
  />
  </div>
  </div>
  );
}
