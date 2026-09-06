use client;

import * as React from react;
import Link from next/link;
import { usePathname, useParams } from next/navigation;
import { cn } from @/shared/lib/utils;
import { Icon, type SolarIconName } from @/shared/ui/icon;
import { usePoskoStore } from @/features/posko/store/use-posko-store;
import { UnifiedAppSidebar } from @/features/navigation;

interface NavItem {
  label: string;
  href: string;
  icon: SolarIconName;
  exact?: boolean;
}

export function PoskoBottomNav() {
  const pathname = usePathname() || ";
 const params = useParams();
 const { session } = usePoskoStore();
 const routePoskoId =
 (params?.poskoId as string) ||
 (pathname.startsWith(/posko/) ? pathname.split(/)[2] : null);
 const poskoId =
 routePoskoId && routePoskoId !== POS-LOCAL
 ? routePoskoId
 : session.poskoId && session.poskoId !== POS-LOCAL
 ? session.poskoId
 : routePoskoId || POS-01;

 const navItems: NavItem[] = [
 {
 label: Ringkasan,
 href: /posko/,
 icon: home,
 exact: true,
 },
 {
 label: Warga,
 href: /posko//refugees,
 icon: users,
 },
 {
 label: Logistik,
 href: /posko//logistics,
 icon: box,
 },
 {
 label: Obrolan,
 href: /posko//tactical,
 icon: chat,
 },
 {
 label: Kirim Data,
 href: /posko//sync,
 icon: sync,
 },
 ];

 return (
 <nav className=fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border md:hidden shadow-sm safe-area-bottom pb-[env(safe-area-inset-bottom,0px)] print:hidden>
 <div className=flex items-center justify-around h-14 max-w-lg mx-auto px-2>
 {navItems.map((item) => {
 const isActive = item.exact
 ? pathname === item.href
 : pathname.startsWith(item.href);

 return (
 <Link
 key={item.href}
 href={item.href}
 aria-label={item.label}
 title={item.label}
 className={cn(
 flex items-center justify-center flex-1 h-full min-h-[44px] transition-colors select-none,
 isActive
 ? text-primary
 : text-text-muted hover:text-text-main
 )}
 >
 <div
 className={cn(
 w-11 h-11 rounded-xl flex items-center justify-center transition-all,
 isActive
 ? bg-primary/10 text-primary
 : hover:bg-surface-muted
 )}
 >
 <Icon
 name={item.icon}
 variant={isActive ? bold : linear}
 size={22}
 />
 </div>
 </Link>
 );
 })}
 </div>
 </nav>
 );
}

export function PoskoDesktopSidebar() {
 return <UnifiedAppSidebar levelOverride=POSKO />;
}
