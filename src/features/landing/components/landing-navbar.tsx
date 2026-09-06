"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { SandyaLogo } from "@/shared/ui/sandya-logo";

interface LandingNavbarProps {
  onOpenDemoModal: () => void;
}

export function LandingNavbar({ onOpenDemoModal }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Tutup menu mobile saat resize ke layar desktop/tablet lebar
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Kunci scroll saat drawer mobile terbuka
  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "#posko-terminal", label: "Simulasi Posko" },
    { href: "#lapangan", label: "Realitas Lapangan" },
    { href: "#tanpa-sinyal", label: "Pindah Data" },
    { href: "#unduh", label: "Pusat Unduhan" },
  ];

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-md transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Logo & Brand Brand Identity */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 select-none group">
          <SandyaLogo size={32} />
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-text-main leading-none group-hover:text-primary transition-colors">
              Sandya
            </span>
            <span className="text-xs text-text-muted font-medium mt-0.5 hidden sm:inline leading-none">
              Sistem Operasi Bencana Mandiri
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links (Hanya di layar lebar >= 1024px agar tidak menabrak di tablet 768px) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-text-muted">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-text-main transition-colors py-1.5"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop & Tablet Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9 font-semibold px-3.5 cursor-pointer hover:bg-surface-subtle"
            icon="play"
            iconVariant="bold"
            onClick={onOpenDemoModal}
          >
            Coba Demo Web
          </Button>
          <a href="#unduh">
            <Button
              variant="primary"
              size="sm"
              className="text-xs h-9 font-bold px-4 shadow-xs cursor-pointer"
              icon="download"
              iconVariant="bold"
            >
              Unduh Aplikasi
            </Button>
          </a>
        </div>

        {/* Tablet Actions (768px - 1023px) */}
        <div className="hidden sm:flex lg:hidden items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9 font-semibold px-3 cursor-pointer"
            icon="play"
            iconVariant="bold"
            onClick={onOpenDemoModal}
          >
            Coba Demo Web
          </Button>
          <a href="#unduh">
            <Button
              variant="primary"
              size="sm"
              className="text-xs h-9 font-bold px-3 shadow-xs cursor-pointer"
              icon="download"
              iconVariant="bold"
            >
              Unduh
            </Button>
          </a>
          <button
            type="button"
            aria-label={mobileMenuOpen ? "Tutup Navigasi" : "Buka Navigasi"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-lg border border-border bg-surface flex items-center justify-center text-text-main hover:bg-surface-subtle active:scale-95 transition-all ml-1 cursor-pointer"
          >
            <Icon name={mobileMenuOpen ? "close" : "menu"} variant="linear" size={20} />
          </button>
        </div>

        {/* Mobile Header Actions (< 640px) */}
        <div className="flex sm:hidden items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-9 px-2.5 font-semibold cursor-pointer"
            icon="play"
            iconVariant="bold"
            onClick={onOpenDemoModal}
          >
            Demo
          </Button>

          <button
            type="button"
            aria-label={mobileMenuOpen ? "Tutup Navigasi" : "Buka Navigasi"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-9 h-9 rounded-lg border border-border bg-surface flex items-center justify-center text-text-main hover:bg-surface-subtle active:scale-95 transition-all cursor-pointer"
          >
            <Icon name={mobileMenuOpen ? "close" : "menu"} variant="linear" size={20} />
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Sheet (Full-fidelity Drawer) */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-16 bottom-0 bg-surface/98 backdrop-blur-lg z-50 flex flex-col justify-between p-5 border-t border-border overflow-y-auto animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted px-2">
              Navigasi Halaman
            </div>
            <div className="space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-text-main hover:bg-surface-muted transition-colors border border-transparent hover:border-border"
                >
                  <span>{link.label}</span>
                  <Icon name="arrow-right" variant="linear" size={16} className="text-text-muted" />
                </a>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-border space-y-3">
            <div className="space-y-2">
              <Button
                variant="outline"
                size="lg"
                className="w-full justify-center text-sm font-semibold h-12 cursor-pointer"
                icon="play"
                iconVariant="bold"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDemoModal();
                }}
              >
                Coba Demo Langsung di Web
              </Button>
              <a href="#unduh" onClick={handleLinkClick} className="block">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full justify-center text-sm font-bold h-12 shadow-xs cursor-pointer"
                  icon="download"
                  iconVariant="bold"
                >
                  Unduh Aplikasi
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-center gap-2 py-2 text-xs text-text-muted font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-status-safe" />
              <span>100% Offline-First • MIT License (Unta Corp.)</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
