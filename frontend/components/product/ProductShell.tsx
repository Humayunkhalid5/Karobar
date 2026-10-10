"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BookOpenCheck, CircleHelp, LayoutDashboard, LogOut, Menu, MessageCircleMore, Mic2, Search, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { NavigationProgress } from "./NavigationProgress";
import { useAuth } from "@/components/SupabaseProvider";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/record", label: "Record Transaction", icon: Mic2 },
  { href: "/ledger", label: "Ledger & Udhaar", icon: BookOpenCheck },
  { href: "/ask", label: "Ask Karobaar", icon: MessageCircleMore },
  { href: "/evidence", label: "Evidence & Readiness", icon: ShieldCheck },
];

function NavLinks({ onSelect }: { onSelect?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {navigation.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} onClick={onSelect} className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-[14px] font-semibold transition-colors ${active ? "bg-[#073c31] text-white shadow-[inset_3px_0_0_#67ddb9]" : "text-[#536761] hover:bg-[#e9f4ef] hover:text-[#073c31]"}`}>
            <Icon size={19} strokeWidth={1.8} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function ProductShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, authEnabled } = useAuth();
  const current = navigation.find((item) => item.href === pathname)?.label ?? "Karobaar AI";

  // Derive display info from auth state or fall back to defaults
  const userEmail = user?.email ?? "";
  const userMeta = user?.user_metadata ?? {};
  const storeName = userMeta.business_name || "Al-Hassan General Store";
  const initials = (userMeta.full_name || storeName || "AH")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSignOut() {
    await signOut();
    router.push("/signin");
  }

  return (
    <div className="product-shell relative min-h-screen bg-[#f5f8f6] text-[#092c25]">
      <NavigationProgress />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-[#dce6e1] bg-white lg:flex lg:flex-col">
        <Link href="/" className="flex h-[82px] items-center border-b border-[#e5ece8] px-6" aria-label="Karobaar AI home"><BrandLogo /></Link>
        <div className="border-b border-[#e5ece8] px-5 py-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#dff3eb] text-sm font-extrabold text-[#075844]">{initials}</span>
            <div className="min-w-0"><p className="truncate text-sm font-bold">{storeName}</p><p className="mt-1 truncate text-xs text-[#758781]">{userEmail || "Karachi, Pakistan"}</p></div>
          </div>
        </div>
        <div className="flex-1 px-4 py-5"><NavLinks /></div>
        <div className="border-t border-[#e5ece8] p-4">
          <Link href="/" className="flex min-h-11 items-center gap-3 px-3 text-sm font-semibold text-[#60716b] hover:text-[#073c31]"><CircleHelp size={18} /> Help & support</Link>
          <button onClick={handleSignOut} className="flex min-h-11 w-full items-center gap-3 px-3 text-sm font-semibold text-[#60716b] hover:text-[#073c31]"><LogOut size={18} /> Sign out</button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[72px] items-center border-b border-[#dce6e1] bg-white/95 px-4 backdrop-blur md:px-7">
          <button className="mr-3 grid h-10 w-10 place-items-center lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={23} /></button>
          <p className="text-lg font-extrabold lg:hidden">{current}</p>
          <div className="hidden max-w-lg flex-1 items-center gap-3 rounded-md border border-[#d8e3de] bg-[#f8faf9] px-3 text-[#7c8c86] md:flex">
            <Search size={18} /><input className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[#153c33] outline-none" placeholder="Search transactions or customers" aria-label="Search" />
          </div>
          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <span className="hidden text-xs font-semibold text-[#6c7d77] sm:block">September 2026</span>
            <button className="relative grid h-10 w-10 place-items-center rounded-md border border-[#dce6e1]" aria-label="Notifications"><Bell size={18} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ef6c5b]" /></button>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#073c31] text-xs font-extrabold text-white">{initials}</span>
          </div>
        </header>
        <main key={pathname} className="route-page-enter mx-auto w-full max-w-[1480px] px-4 pb-24 pt-6 md:px-7 md:pt-8 lg:pb-10">{children}</main>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-[#031d18]/45" onClick={() => setMenuOpen(false)} aria-label="Close navigation backdrop" />
          <aside className="absolute inset-y-0 left-0 w-[300px] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between"><BrandLogo /><button className="grid h-10 w-10 place-items-center" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={23} /></button></div>
            <div className="mt-8"><NavLinks onSelect={() => setMenuOpen(false)} /></div>
          </aside>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#dce6e1] bg-white px-1 pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Mobile navigation">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return <Link key={href} href={href} className={`flex min-h-[64px] flex-col items-center justify-center gap-1 text-[10px] font-bold ${active ? "text-[#08775b]" : "text-[#70817b]"}`}><Icon size={20} strokeWidth={active ? 2.2 : 1.7} /><span className="max-w-[68px] truncate">{label.replace(" Transaction", "").replace(" & Readiness", "")}</span></Link>;
        })}
      </nav>
    </div>
  );
}
