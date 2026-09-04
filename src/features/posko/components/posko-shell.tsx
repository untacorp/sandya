"use client";

import * as React from "react";
import { PoskoHeader } from "@/features/posko/components/posko-header";
import {
  PoskoBottomNav,
  PoskoDesktopSidebar,
} from "@/features/posko/components/posko-navigation";
import { FastIntakeFAB } from "@/features/refugees/components/fast-intake-modal";
import { PoskoSwitcherModal } from "@/features/posko/components/posko-switcher";

export function PoskoShell({ children }: { children: React.ReactNode }) {
  const [switcherOpen, setSwitcherOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex bg-canvas text-text-main">
      {/* Desktop Sidebar */}
      <PoskoDesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
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
