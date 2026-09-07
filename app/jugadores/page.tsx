"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

// ── Types ────────────────────────────────────────────────

interface Jugador {
  id: string;
  imagen_url: string | null;
  nombre: string;
  anio_nacimiento: number;
  equipo: string;
  tecnica: number;
  tactica: number;
  fisico: number;
  lateralidad: string;
  descripcion_general: string | null;
  coche: boolean;
  lugar_residencia: string | null;
  sueldo: string | null;
  video_url: string | null;
  volumen_id: string | null;
  created_at: string;
  volumen_jugadores?: {
    posicion: string | null;
  } | null;
}

// ── Helpers ──────────────────────────────────────────────

function calcularEdad(anio: number): number {
  return new Date().getFullYear() - anio;
}

function calcularMedia(t: number, ta: number, f: number): number {
  return Math.round(((t + ta + f) / 3) * 10) / 10;
}

function getMediaColor(media: number): string {
  if (media >= 4) return "text-emerald-400";
  if (media >= 3) return "text-amber-400";
  return "text-red-400";
}

function getMediaBg(media: number): string {
  if (media >= 4) return "bg-emerald-500/10 border-emerald-500/30";
  if (media >= 3) return "bg-amber-500/10 border-amber-500/30";
  return "bg-red-500/10 border-red-500/30";
}

function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getLateralidadBadge(lat: string) {
  const map: Record<string, { label: string; cls: string }> = {
    Diestro: { label: "D", cls: "bg-blue-900/50 text-blue-300 border-blue-800/60" },
    Zurdo: { label: "Z", cls: "bg-purple-900/50 text-purple-300 border-purple-800/60" },
    Ambidiestro: { label: "A", cls: "bg-teal-900/50 text-teal-300 border-teal-800/60" },
  };
  return map[lat] || { label: lat[0], cls: "bg-neutral-800 text-neutral-400 border-neutral-700" };
}

// ── PlayerCard ───────────────────────────────────────────

function PlayerCard({
  player,
  onDelete,
}: {
  player: Jugador;
  onDelete: (player: Jugador) => void;
}) {
  const router = useRouter();
  const edad = calcularEdad(player.anio_nacimiento);
  const media = calcularMedia(player.tecnica, player.tactica, player.fisico);
  const lat = getLateralidadBadge(player.lateralidad);
  const posicion = player.volumen_jugadores?.posicion || "Sin posición";

  return (
    <div className="group relative bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-neutral-700 hover:bg-neutral-900/80 transition-all duration-200 hover:shadow-2xl hover:shadow-black/40 flex flex-col">
      {/* Photo area */}
      <div className="relative h-48 bg-neutral-800 overflow-hidden flex-shrink-0">
        {player.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.imagen_url}
            alt={player.nombre}
            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
            <span className="text-4xl font-black text-neutral-600 tracking-tight select-none">
              {getInitials(player.nombre)}
            </span>
          </div>
        )}



        {/* Media badge — bottom left, overlapping photo */}
        <div
          className={`absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border backdrop-blur-md ${getMediaBg(media)}`}
        >
          <span className={`text-xl font-black font-mono leading-none ${getMediaColor(media)}`}>
            {media.toFixed(1)}
          </span>
          <span className="text-xs text-neutral-400 leading-none font-medium">media</span>
        </div>

        {/* Video indicator */}
        {player.video_url && (
          <span className="absolute bottom-3 right-3 bg-red-600/80 backdrop-blur-sm text-white rounded-lg px-2 py-1 text-xs font-bold flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            Video
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Name + team */}
        <div className="mb-3">
          <h3 className="text-white font-bold text-base leading-tight truncate" title={player.nombre}>
            {player.nombre}
          </h3>
          <p className="text-neutral-400 text-sm mt-0.5 truncate flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {player.equipo}
          </p>
          <p className="text-neutral-500 text-xs mt-1 truncate font-medium">
            {posicion}
          </p>
        </div>

        {/* Age + lateralidad chips */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-neutral-800 border border-neutral-700 text-neutral-300 text-xs font-semibold px-2.5 py-1 rounded-full">
            <svg className="w-3 h-3 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {edad} años
          </span>
          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${lat.cls}`}>
            {player.lateralidad}
          </span>
          {player.coche && (
            <span className="inline-flex items-center gap-1 bg-neutral-800 border border-neutral-700 text-neutral-400 text-xs px-2 py-1 rounded-full">
              🚗
            </span>
          )}
        </div>

        {/* Stats mini-bars - Solo visibles si expandido en movil, o siempre en desktop. Para simplificar UX movil que pide el user: "El resto de info en detalle". Haremos que en movil la descripcion este cortada */}
        <div className="space-y-1.5 mb-4 hidden sm:block">
          {[
            { label: "Tec", val: player.tecnica },
            { label: "Tac", val: player.tactica },
            { label: "Fis", val: player.fisico },
          ].map(({ label, val }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs text-neutral-600 w-7 flex-shrink-0">{label}</span>
              <div className="flex-grow h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-700 to-emerald-400 rounded-full"
                  style={{ width: `${(val / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs text-neutral-500 w-3 flex-shrink-0">{val}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto pt-3 border-t border-neutral-800">
          <Link
            href={`/jugadores/${player.id}`}
            className="flex-1 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-800/60 hover:border-emerald-700 text-emerald-400 text-sm md:text-xs font-bold py-2 px-3 rounded-xl min-h-[44px] flex items-center justify-center transition text-center"
          >
            Ver ficha
          </Link>
          <button
            onClick={() => router.push(`/jugadores/${player.id}/editar`)}
            className="w-11 h-11 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 flex items-center justify-center text-neutral-300 rounded-xl transition flex-shrink-0"
            title="Editar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(player)}
            className="w-11 h-11 bg-red-950/30 hover:bg-red-950/60 border border-red-900/50 hover:border-red-800 flex items-center justify-center text-red-400 rounded-xl transition flex-shrink-0"
            title="Eliminar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────

export default function JugadoresPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Jugador[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterEquipo, setFilterEquipo] = useState("");
  const [filterLateralidad, setFilterLateralidad] = useState("");
  const [filterPosicion, setFilterPosicion] = useState("");
  const [filterAnio, setFilterAnio] = useState("");
  const [filterTecnica, setFilterTecnica] = useState<number>(0);
  const [filterTactica, setFilterTactica] = useState<number>(0);
  const [filterFisico, setFilterFisico] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"media_desc" | "media_asc" | "nombre" | "edad">("media_desc");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Jugador | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("jugadores")
        .select("*, volumen_jugadores(posicion)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPlayers(data || []);
    } catch (err: unknown) {
      console.error("Error al cargar jugadores:", err instanceof Error ? err.message : err);
    } finally {
      setLoading(false);
    }
  };

  const equipos = useMemo(() => {
    const set = new Set(players.map((p) => p.equipo).filter(Boolean));
    return Array.from(set).sort();
  }, [players]);

  const posiciones = useMemo(() => {
    const set = new Set(
      players
        .map((p) => p.volumen_jugadores?.posicion)
        .filter((pos): pos is string => Boolean(pos))
    );
    return Array.from(set).sort();
  }, [players]);

  const anios = useMemo(() => {
    const set = new Set(players.map((p) => p.anio_nacimiento).filter(Boolean));
    return Array.from(set).sort((a, b) => b - a);
  }, [players]);

  // Filtered + sorted list
  const filtered = useMemo(() => {
    let list = [...players];

    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((p) => p.nombre.toLowerCase().includes(term));
    }
    if (filterEquipo) {
      list = list.filter((p) => p.equipo === filterEquipo);
    }
    if (filterLateralidad) {
      list = list.filter((p) => p.lateralidad === filterLateralidad);
    }
    if (filterPosicion) {
      list = list.filter((p) => p.volumen_jugadores?.posicion === filterPosicion);
    }
    if (filterAnio) {
      list = list.filter((p) => p.anio_nacimiento === parseInt(filterAnio, 10));
    }
    if (filterTecnica > 0) {
      list = list.filter((p) => p.tecnica >= filterTecnica);
    }
    if (filterTactica > 0) {
      list = list.filter((p) => p.tactica >= filterTactica);
    }
    if (filterFisico > 0) {
      list = list.filter((p) => p.fisico >= filterFisico);
    }

    list.sort((a, b) => {
      const ma = calcularMedia(a.tecnica, a.tactica, a.fisico);
      const mb = calcularMedia(b.tecnica, b.tactica, b.fisico);
      if (sortBy === "media_desc") return mb - ma;
      if (sortBy === "media_asc") return ma - mb;
      if (sortBy === "nombre") return a.nombre.localeCompare(b.nombre);
      if (sortBy === "edad") return a.anio_nacimiento - b.anio_nacimiento; // oldest first
      return 0;
    });

    return list;
  }, [players, search, filterEquipo, filterLateralidad, filterPosicion, filterAnio, filterTecnica, filterTactica, filterFisico, sortBy]);

  // Delete handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);

      // 1. Delete from jugadores
      const { data: delData, error: deleteError } = await supabase
        .from("jugadores")
        .delete()
        .eq("id", deleteTarget.id)
        .select();
      if (deleteError) throw deleteError;

      // 2. If linked to volumen, delete from volumen_jugadores as well so it's fully deleted from DB
      if (deleteTarget.volumen_id) {
        const { error: volErr } = await supabase
          .from("volumen_jugadores")
          .delete()
          .eq("id", deleteTarget.volumen_id)
          .select();
        if (volErr) console.error("Error al eliminar de volumen_jugadores:", volErr);
      }

      if (!delData || delData.length === 0) {
        throw new Error(
          "Supabase no confirmó la eliminación. Comprueba que las políticas de RLS (DELETE) estén activadas en Supabase."
        );
      }

      setPlayers((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error al eliminar:", msg);
      alert(`Error al eliminar el jugador: ${msg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Stats bar for header
  const stats = useMemo(() => {
    if (!players.length) return null;
    const medias = players.map((p) => calcularMedia(p.tecnica, p.tactica, p.fisico));
    const avg = (medias.reduce((a, b) => a + b, 0) / medias.length).toFixed(1);
    const top = players.filter((p) => calcularMedia(p.tecnica, p.tactica, p.fisico) >= 4).length;
    return { avg, top, total: players.length };
  }, [players]);

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100 font-sans">
      {/* ── Header ── */}
      <div className="border-b border-neutral-800/80 bg-neutral-950/95 sticky top-14 md:top-0 z-20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 md:w-3 h-6 md:h-7 bg-emerald-500 rounded-sm flex-shrink-0" />
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none">
                BD Scouting
              </h1>
              <p className="text-neutral-500 text-[10px] md:text-xs mt-1">Apartado específico de fichas completas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* ── Stats strip ── */}
        {stats && !loading && (
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            {[
              { label: "Total", value: stats.total, color: "text-white" },
              { label: "Media", value: stats.avg, color: "text-amber-400" },
              { label: "Top (≥4)", value: stats.top, color: "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-3 md:p-4 text-center">
                <div className={`text-xl md:text-2xl font-black font-mono ${color}`}>{value}</div>
                <div className="text-[10px] md:text-xs text-neutral-500 mt-1 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Mobile Filters Toggle ── */}
        <div className="md:hidden mb-4">
           <button 
             onClick={() => setShowMobileFilters(!showMobileFilters)}
             className="w-full flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 min-h-[44px] text-sm font-semibold text-white"
           >
             <span className="flex items-center gap-2">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filtrar y Ordenar
             </span>
             <svg className={`w-5 h-5 text-neutral-400 transition-transform ${showMobileFilters ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
           </button>
        </div>

        {/* ── Filters toolbar ── */}
        <div className={`${showMobileFilters ? "flex" : "hidden"} md:flex flex-col gap-3 mb-8 animate-in slide-in-from-top-2 md:animate-none`}>
          {/* Row 1: Search and basic info filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-500 pointer-events-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white placeholder-neutral-500 rounded-xl py-3 pl-10 pr-4 outline-none transition min-h-[44px]"
              />
            </div>

            <select
              value={filterEquipo}
              onChange={(e) => setFilterEquipo(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition cursor-pointer min-w-[140px] min-h-[44px]"
            >
              <option value="">Todos los equipos</option>
              {equipos.map((eq) => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>

            <select
              value={filterPosicion}
              onChange={(e) => setFilterPosicion(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition cursor-pointer min-w-[140px] min-h-[44px]"
            >
              <option value="">Todas las posiciones</option>
              {posiciones.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Secondary traits and stats filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={filterAnio}
              onChange={(e) => setFilterAnio(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition cursor-pointer min-w-[140px] min-h-[44px] flex-1"
            >
              <option value="">Todos los años (Nac.)</option>
              {anios.map((anio) => (
                <option key={anio} value={anio.toString()}>{anio}</option>
              ))}
            </select>

            <select
              value={filterLateralidad}
              onChange={(e) => setFilterLateralidad(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition cursor-pointer min-w-[140px] min-h-[44px] flex-1"
            >
              <option value="">Cualquier lateralidad</option>
              <option value="Diestro">Diestro</option>
              <option value="Zurdo">Zurdo</option>
              <option value="Ambidiestro">Ambidiestro</option>
            </select>

            <select
              value={filterTecnica}
              onChange={(e) => setFilterTecnica(Number(e.target.value))}
              className="bg-neutral-900 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition cursor-pointer min-w-[120px] min-h-[44px] flex-1"
            >
              <option value="0">Técnica: Todas</option>
              {[1, 2, 3, 4, 5].map((val) => (
                <option key={val} value={val}>≥ {val}</option>
              ))}
            </select>

            <select
              value={filterTactica}
              onChange={(e) => setFilterTactica(Number(e.target.value))}
              className="bg-neutral-900 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition cursor-pointer min-w-[120px] min-h-[44px] flex-1"
            >
              <option value="0">Táctica: Todas</option>
              {[1, 2, 3, 4, 5].map((val) => (
                <option key={val} value={val}>≥ {val}</option>
              ))}
            </select>

            <select
              value={filterFisico}
              onChange={(e) => setFilterFisico(Number(e.target.value))}
              className="bg-neutral-900 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition cursor-pointer min-w-[120px] min-h-[44px] flex-1"
            >
              <option value="0">Físico: Todos</option>
              {[1, 2, 3, 4, 5].map((val) => (
                <option key={val} value={val}>≥ {val}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="bg-neutral-900 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition cursor-pointer min-w-[160px] min-h-[44px] flex-1"
            >
              <option value="media_desc">Media: mayor primero</option>
              <option value="media_asc">Media: menor primero</option>
              <option value="nombre">Nombre A-Z</option>
              <option value="edad">Más veterano primero</option>
            </select>
          </div>
        </div>

        {/* ── Results count ── */}
        {!loading && (
          <p className="text-neutral-500 text-xs font-semibold mb-4 pl-1">
            {filtered.length === players.length
              ? `${players.length} jugadores en la base de datos`
              : `${filtered.length} de ${players.length} jugadores`}
          </p>
        )}

        {/* ── Grid / States ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-neutral-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4" />
            <span>Cargando fichas de jugadores...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-neutral-800 rounded-2xl">
            <svg className="w-14 h-14 text-neutral-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-neutral-400 font-medium text-lg">No hay jugadores</p>
            <p className="text-neutral-600 text-sm mt-1 mb-6">
              {players.length === 0
                ? "Aún no has añadido ninguna ficha específica. Promueve un jugador desde el Volumen de Jugadores."
                : "Ningún jugador coincide con los filtros aplicados."}
            </p>
            {players.length === 0 && (
              <button
                onClick={() => router.push("/volumen")}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl min-h-[44px] text-sm transition"
              >
                Ir a Volumen de Jugadores
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            {filtered.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                onDelete={(p) => setDeleteTarget(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Delete confirmation bottom sheet (mobile) / modal (desktop) ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md bg-neutral-900 border-t md:border border-neutral-800 rounded-t-3xl md:rounded-2xl shadow-2xl p-6 relative animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
             <div className="w-12 h-1.5 bg-neutral-800 rounded-full mx-auto mb-4 md:hidden" />
            
            <div className="flex items-start gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">¿Eliminar ficha?</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  Se eliminará la ficha de{" "}
                  <span className="text-white font-bold">{deleteTarget.nombre}</span> de la base de datos específica.
                </p>
                {deleteTarget.volumen_id && (
                  <div className="bg-amber-950/30 border border-amber-900/30 rounded-lg p-3 mt-4">
                    <p className="text-amber-400/90 text-xs flex items-start gap-2 leading-relaxed">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      El registro en el apartado de Volumen se conservará y podrá volver a promoverse en el futuro.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-5 py-3 rounded-xl sm:rounded-lg text-sm font-bold min-h-[44px] transition order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl sm:rounded-lg text-sm font-bold min-h-[44px] transition flex items-center justify-center gap-2 order-1 sm:order-2 shadow-lg shadow-red-600/20"
              >
                {isDeleting && <div className="animate-spin rounded-full h-4.5 w-4.5 border-b-2 border-white" />}
                {isDeleting ? "Eliminando..." : "Sí, eliminar ficha"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
