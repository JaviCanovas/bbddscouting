"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

const navLinks = [
  {
    href: "/",
    label: "Dashboard",
    shortLabel: "Inicio",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/volumen",
    label: "Volumen de Jugadores",
    shortLabel: "Volumen",
    countKey: "volumen",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    href: "/jugadores",
    label: "BD Scouting",
    shortLabel: "Scouting",
    countKey: "jugadores",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [volumenCount, setVolumenCount] = useState<number | null>(null);
  const [jugadoresCount, setJugadoresCount] = useState<number | null>(null);
  const [systemStatus, setSystemStatus] = useState<'online' | 'error' | 'loading'>('loading');

  useEffect(() => {
    async function fetchCounts() {
      try {
        const { count: vCount, error: vError } = await supabase
          .from("volumen_jugadores")
          .select("*", { count: "exact", head: true })
          .or("promovido.eq.false,promovido.is.null");
        const { count: jCount, error: jError } = await supabase
          .from("jugadores")
          .select("*", { count: "exact", head: true });
          
        if (vError || jError) {
          console.error("Supabase Error:", vError || jError);
          setSystemStatus('error');
          return;
        }

        if (vCount !== null) setVolumenCount(vCount);
        if (jCount !== null) setJugadoresCount(jCount);
        setSystemStatus('online');
      } catch (err) {
        console.error("Error fetching counts:", err);
        setSystemStatus('error');
      }
    }
    fetchCounts();

    const channel = supabase
      .channel("counts_channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "volumen_jugadores" }, fetchCounts)
      .on("postgres_changes", { event: "*", schema: "public", table: "jugadores" }, fetchCounts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const counts: Record<string, number | null> = {
    volumen: volumenCount,
    jugadores: jugadoresCount,
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="w-64 bg-[#1a1d2e] border-r border-neutral-800/50 hidden md:flex flex-col h-screen sticky top-0 flex-shrink-0 shadow-2xl z-50">
        <div className="p-6 mb-2">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl drop-shadow-lg">⚽</span>
            <h1 className="text-lg font-black text-white leading-tight tracking-tight">
              BASE DE DATOS<br />
              <span className="text-[#22c55e]">SCOUTING</span>
            </h1>
          </Link>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            const count = link.countKey ? counts[link.countKey] : undefined;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? "bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
                    : "text-neutral-400 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <span className={`flex items-center gap-3 font-semibold text-sm transition-transform duration-200 ${active ? "translate-x-1" : "group-hover:translate-x-1"}`}>
                  {link.icon}
                  {link.label}
                </span>
                {count !== undefined && count !== null && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md transition-colors ${
                    active ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-black/30 text-neutral-500 group-hover:text-neutral-300"
                  }`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-6 mt-auto">
          <div className="bg-black/20 rounded-xl p-4 text-center border border-white/5">
            <span className="block text-xs font-semibold text-neutral-500 uppercase tracking-widest mb-1">Status</span>
            <div className="flex items-center justify-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-pulse ${
                systemStatus === 'online' ? 'bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 
                systemStatus === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 
                'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]'
              }`} />
              <span className="text-xs text-neutral-300 font-medium">
                {systemStatus === 'online' ? 'Sistema Online' : systemStatus === 'error' ? 'Desconectado' : 'Conectando...'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MOBILE TOP HEADER ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1a1d2e]/95 backdrop-blur-md border-b border-neutral-800/60 h-14 flex items-center px-4 gap-3">
        <span className="text-xl">⚽</span>
        <span className="text-sm font-black text-white tracking-tight">
          BD <span className="text-[#22c55e]">SCOUTING</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${
            systemStatus === 'online' ? 'bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 
            systemStatus === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 
            'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]'
          }`} />
        </div>
      </header>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1a1d2e]/95 backdrop-blur-md border-t border-neutral-800/60 h-16 flex items-center safe-area-bottom">
        {navLinks.map((link) => {
          const active = isActive(link.href);
          const count = link.countKey ? counts[link.countKey] : undefined;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] relative transition-all duration-200 ${
                active ? "text-[#22c55e]" : "text-neutral-500"
              }`}
            >
              {/* Active indicator */}
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#22c55e] rounded-full" />
              )}
              <span className="relative">
                {link.icon}
                {count !== undefined && count !== null && count > 0 && (
                  <span className="absolute -top-1.5 -right-2 text-[9px] font-black bg-[#22c55e] text-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-semibold">{link.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
