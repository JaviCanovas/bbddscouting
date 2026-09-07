"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

interface VolumenJugador {
  id: string;
  nombre: string;
  equipo: string;
  created_at: string;
}

interface JugadorBD {
  id: string;
  nombre: string;
  equipo: string;
  tecnica: number;
  tactica: number;
  fisico: number;
  imagen_url: string | null;
  created_at: string;
}

function calcularMedia(t: number, ta: number, f: number) {
  return ((t + ta + f) / 3);
}

function getMediaColor(media: number) {
  if (media >= 4) return "text-emerald-400";
  if (media >= 3) return "text-amber-400";
  return "text-red-400";
}

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  
  // Stats
  const [totalVolumen, setTotalVolumen] = useState(0);
  const [totalBD, setTotalBD] = useState(0);
  const [mediaGeneral, setMediaGeneral] = useState(0);

  // Latest
  const [ultimosVolumen, setUltimosVolumen] = useState<VolumenJugador[]>([]);
  const [ultimosBD, setUltimosBD] = useState<JugadorBD[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // 1. Fetch total count and last 5 from volumen_jugadores
        const { data: vData, count: vCount } = await supabase
          .from("volumen_jugadores")
          .select("*", { count: "exact" })
          .or("promovido.eq.false,promovido.is.null")
          .order("created_at", { ascending: false })
          .limit(5);

        // 2. Fetch total count and last 5 from jugadores
        const { data: bData, count: bCount } = await supabase
          .from("jugadores")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(5);

        // 3. Fetch all jugadores to calculate overall average
        const { data: allJugadores } = await supabase
          .from("jugadores")
          .select("tecnica, tactica, fisico");

        if (vCount !== null) setTotalVolumen(vCount);
        if (bCount !== null) setTotalBD(bCount);

        if (vData) setUltimosVolumen(vData);
        if (bData) setUltimosBD(bData);

        if (allJugadores && allJugadores.length > 0) {
          const sumMedias = allJugadores.reduce((acc, j) => acc + calcularMedia(j.tecnica, j.tactica, j.fisico), 0);
          setMediaGeneral(sumMedias / allJugadores.length);
        }

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-10">
        <div className="flex flex-col items-center gap-4 text-neutral-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#22c55e]" />
          <span>Cargando dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Dashboard General</h1>
          <p className="text-neutral-400 mt-2 text-sm">Resumen de la base de datos de scouting deportivo.</p>
        </div>
        <Link
          href="/volumen"
          className="bg-[#22c55e] hover:bg-[#16a34a] active:bg-[#15803d] text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-[#22c55e]/20 transition-all flex items-center gap-2 group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir jugador rápido
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {/* Stat 1 */}
        <div className="bg-[#1a1d2e]/50 border border-neutral-800/80 rounded-2xl p-6 transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Volumen</p>
              <h3 className="text-3xl font-black text-white font-mono">{totalVolumen}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <span className="text-xl">📋</span>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-4">Jugadores en fase de captación inicial.</p>
        </div>

        {/* Stat 2 */}
        <div className="bg-[#1a1d2e]/50 border border-neutral-800/80 rounded-2xl p-6 transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">BD Scouting</p>
              <h3 className="text-3xl font-black text-white font-mono">{totalBD}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/20">
              <span className="text-xl">⭐</span>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-4">Fichas completas de seguimiento.</p>
        </div>

        {/* Stat 3 */}
        <div className="bg-[#1a1d2e]/50 border border-neutral-800/80 rounded-2xl p-6 transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Media General</p>
              <h3 className={`text-3xl font-black font-mono ${totalBD > 0 ? getMediaColor(mediaGeneral) : 'text-neutral-600'}`}>
                {totalBD > 0 ? mediaGeneral.toFixed(1) : '-.-'}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <span className="text-xl">📈</span>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-4">Media técnica/táctica/física del plantel.</p>
        </div>
      </div>

      {/* Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ultimos en Volumen */}
        <div className="bg-[#1a1d2e]/30 border border-neutral-800/60 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-neutral-800/60 flex items-center justify-between bg-[#1a1d2e]/50">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📋</span> Últimos añadidos a Volumen
            </h2>
            <Link href="/volumen" className="text-xs font-semibold text-[#22c55e] hover:underline">Ver todos →</Link>
          </div>
          <div className="flex-1 p-5">
            {ultimosVolumen.length === 0 ? (
              <p className="text-sm text-neutral-500 italic text-center py-8">No hay registros recientes.</p>
            ) : (
              <div className="space-y-4">
                {ultimosVolumen.map((j) => (
                  <div key={j.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors">
                    <div>
                      <p className="text-sm font-bold text-white">{j.nombre}</p>
                      <p className="text-xs text-neutral-400">{j.equipo}</p>
                    </div>
                    <span className="text-[10px] text-neutral-600 uppercase font-semibold">
                      {new Date(j.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ultimos en BD */}
        <div className="bg-[#1a1d2e]/30 border border-neutral-800/60 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-neutral-800/60 flex items-center justify-between bg-[#1a1d2e]/50">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>⭐</span> Últimas fichas en BD Scouting
            </h2>
            <Link href="/jugadores" className="text-xs font-semibold text-[#22c55e] hover:underline">Ver todas →</Link>
          </div>
          <div className="flex-1 p-5">
            {ultimosBD.length === 0 ? (
              <p className="text-sm text-neutral-500 italic text-center py-8">No hay fichas recientes.</p>
            ) : (
              <div className="space-y-4">
                {ultimosBD.map((j) => {
                  const media = calcularMedia(j.tecnica, j.tactica, j.fisico);
                  return (
                    <Link key={j.id} href={`/jugadores/${j.id}`} className="flex items-center gap-4 p-3 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-colors group">
                      <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0">
                        {j.imagen_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={j.imagen_url} alt={j.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-neutral-500">
                            {j.nombre.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate group-hover:text-[#22c55e] transition-colors">{j.nombre}</p>
                        <p className="text-xs text-neutral-400 truncate">{j.equipo}</p>
                      </div>
                      <div className={`text-sm font-black font-mono ${getMediaColor(media)}`}>
                        {media.toFixed(1)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
