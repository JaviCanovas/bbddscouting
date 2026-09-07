"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { JugadorVolumen } from "@/types";

export default function VolumenPage() {
  const router = useRouter();

  // Estados principales
  const [players, setPlayers] = useState<JugadorVolumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<JugadorVolumen | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Estados de UI
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    equipo: "",
    posicion: "",
    dorsal: "",
    descripcion_corta: "",
  });
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Obtener los jugadores al montar
  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);

      // Comprobar y restaurar jugadores de volumen marcados como promovidos si no se llegó a crear su ficha en 'jugadores'
      const { data: checkPromovidos } = await supabase
        .from("volumen_jugadores")
        .select("id, jugadores(id)")
        .eq("promovido", true);

      if (checkPromovidos && checkPromovidos.length > 0) {
        type CheckPromovidoItem = { id: string; jugadores?: { id: string }[] | { id: string } | null };
        const orphanedIds = (checkPromovidos as unknown as CheckPromovidoItem[])
          .filter((v) => !v.jugadores || (Array.isArray(v.jugadores) && v.jugadores.length === 0))
          .map((v) => v.id);

        if (orphanedIds.length > 0) {
          await supabase
            .from("volumen_jugadores")
            .update({ promovido: false })
            .in("id", orphanedIds);
        }
      }

      const { data, error } = await supabase
        .from("volumen_jugadores")
        .select("*")
        .or("promovido.eq.false,promovido.is.null")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error al obtener los jugadores:", message);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal para añadir
  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setFormData({
      nombre: "",
      equipo: "",
      posicion: "",
      dorsal: "",
      descripcion_corta: "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (player: JugadorVolumen) => {
    setEditingPlayer(player);
    setFormData({
      nombre: player.nombre,
      equipo: player.equipo,
      posicion: player.posicion || "",
      dorsal: player.dorsal !== null ? String(player.dorsal) : "",
      descripcion_corta: player.descripcion_corta || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  // Guardar formulario (Añadir o Editar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.equipo.trim()) {
      setFormError("El nombre y el equipo son campos obligatorios.");
      return;
    }

    try {
      setFormError("");
      setIsSaving(true);

      const parsedDorsal = formData.dorsal ? parseInt(formData.dorsal, 10) : null;
      if (formData.dorsal && isNaN(parsedDorsal as number)) {
        setFormError("El dorsal debe ser un número válido.");
        setIsSaving(false);
        return;
      }

      const payload = {
        nombre: formData.nombre.trim(),
        equipo: formData.equipo.trim(),
        posicion: formData.posicion.trim() || null,
        dorsal: parsedDorsal,
        descripcion_corta: formData.descripcion_corta.trim(),
      };

      if (editingPlayer) {
        // Actualizar
        const { error } = await supabase
          .from("volumen_jugadores")
          .update(payload)
          .eq("id", editingPlayer.id);

        if (error) throw error;
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from("volumen_jugadores")
          .insert([payload]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchPlayers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'object' && err !== null && 'message' in err ? String((err as { message: unknown }).message) : String(err));
      console.error("Error al guardar jugador:", err);
      setFormError(`Ocurrió un error al guardar: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Confirmar eliminación
  const handleDelete = async (id: string) => {
    try {
      // 1. Eliminar ficha vinculada en jugadores si existe
      const { error: delJugadorErr } = await supabase
        .from("jugadores")
        .delete()
        .eq("volumen_id", id)
        .select();
      if (delJugadorErr) console.error("Error al eliminar jugador vinculado:", delJugadorErr);

      // 2. Eliminar registro en volumen_jugadores
      const { data, error } = await supabase
        .from("volumen_jugadores")
        .delete()
        .eq("id", id)
        .select();

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error(
          "Supabase no confirmó la eliminación. Comprueba que las políticas de RLS (DELETE) estén activadas en Supabase."
        );
      }

      setConfirmDeleteId(null);
      fetchPlayers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error al eliminar jugador:", message);
      alert(`No se pudo eliminar al jugador: ${message}`);
    }
  };

  // Promover jugador a base de datos específica (Iniciar transición a ficha)
  const handlePromote = (player: JugadorVolumen) => {
    // Navegar a /jugadores/nuevo con los datos básicos.
    // NOTA: No marcamos 'promovido = true' aquí para evitar que el jugador desaparezca
    // si el usuario cancela o no llega a guardar el informe. Se marcará únicamente al guardar.
    const queryParams = new URLSearchParams({
      volumen_id: player.id,
      nombre: player.nombre,
      equipo: player.equipo,
    });
    if (player.dorsal !== null) {
      queryParams.append("dorsal", String(player.dorsal));
    }

    router.push(`/jugadores/nuevo?${queryParams.toString()}`);
  };

  // Toggle descripción expandida en móvil
  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Filtrar jugadores en tiempo real
  const filteredPlayers = players.filter((player) => {
    const term = searchQuery.toLowerCase();
    return (
      player.nombre.toLowerCase().includes(term) ||
      player.equipo.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100 font-sans p-4 sm:p-6 md:p-10">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-6 md:mb-10 border-b border-emerald-950/50 pb-6 md:pb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span className="w-2.5 sm:w-3.5 h-6 sm:h-7 bg-emerald-500 rounded-sm inline-block"></span>
            VOLUMEN DE JUGADORES
          </h1>
          <p className="text-neutral-400 mt-2 text-xs sm:text-sm md:text-base">
            Apartado General (Volumen de Jugadores detectados en Scouting)
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold px-4 py-3 md:px-5 md:py-3 min-h-[44px] rounded-xl md:rounded-lg shadow-lg hover:shadow-emerald-500/10 transition duration-150 ease-in-out flex items-center justify-center gap-2 w-full md:w-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Añadir Jugador
        </button>
      </div>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto">
        {/* Search Bar (Sticky on Mobile) */}
        <div className="sticky top-14 md:static z-30 bg-neutral-950/95 md:bg-transparent backdrop-blur-md pt-2 pb-4 md:pt-0 md:pb-6 md:mb-0">
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Buscar por nombre o equipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/80 md:bg-neutral-950 border border-neutral-800 focus:border-emerald-500/80 text-base md:text-sm text-white placeholder-neutral-500 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-1 focus:ring-emerald-500/30 transition duration-150 min-h-[44px]"
            />
          </div>
        </div>

        {/* Loading and Empty States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
            <span>Cargando lista de jugadores...</span>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-neutral-800 rounded-xl mt-4">
            <svg className="w-12 h-12 text-neutral-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-neutral-400 font-medium">No se encontraron jugadores</p>
            <p className="text-neutral-600 text-sm mt-1">Intenta con otra búsqueda o añade un nuevo jugador.</p>
          </div>
        ) : (
          <>
            {/* Mobile Cards (≤768px) */}
            <div className="md:hidden space-y-4 mt-2">
              {filteredPlayers.map((player) => {
                const isExpanded = expandedDescriptions.has(player.id);
                const hasDesc = !!player.descripcion_corta;
                return (
                  <div key={player.id} className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 flex flex-col relative overflow-hidden">
                    {/* Badge */}
                    {player.promovido && (
                      <div className="absolute top-0 right-0 bg-emerald-900/80 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-bl-xl border-b border-l border-emerald-800/50">
                        ✓ En BD
                      </div>
                    )}

                    {/* Header */}
                    <div className="mb-2 pr-16">
                      <h3 className="text-lg font-bold text-white tracking-tight leading-tight">{player.nombre}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        <span className="text-neutral-300 font-medium flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          {player.equipo}
                        </span>
                        {player.dorsal !== null && (
                          <>
                            <span className="text-neutral-600">&bull;</span>
                            <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs text-neutral-400 font-mono">Dorsal {player.dorsal}</span>
                          </>
                        )}
                        {player.posicion && (
                          <>
                            <span className="text-neutral-600">&bull;</span>
                            <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-xs text-neutral-400 font-mono">{player.posicion}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {hasDesc && (
                      <div className="mt-2 text-sm text-neutral-400 bg-neutral-950/50 rounded-lg p-3">
                        <p className={`${isExpanded ? '' : 'line-clamp-2'}`}>
                          {player.descripcion_corta}
                        </p>
                        <button
                          onClick={() => toggleDescription(player.id)}
                          className="text-emerald-500 text-xs font-semibold mt-1 hover:underline min-h-[32px] inline-flex items-center"
                        >
                          {isExpanded ? "Ver menos" : "Ver más"}
                        </button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-800">
                      {!player.promovido ? (
                        <button
                          onClick={() => handlePromote(player)}
                          className="flex-1 bg-emerald-600/10 text-emerald-400 border border-emerald-800/60 rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1 min-h-[44px]"
                        >
                          → Promover a BD
                        </button>
                      ) : (
                        <div className="flex-1 text-center py-2 text-xs font-medium text-neutral-600 bg-neutral-900/50 rounded-xl min-h-[44px] flex items-center justify-center">
                          Promovido
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleOpenEdit(player)}
                        className="w-11 h-11 bg-neutral-800 text-neutral-300 rounded-xl flex items-center justify-center border border-neutral-700/50 hover:bg-neutral-700 transition flex-shrink-0"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      
                      <button
                        onClick={() => setConfirmDeleteId(player.id)}
                        className="w-11 h-11 bg-red-950/30 text-red-400 rounded-xl flex items-center justify-center border border-red-900/30 hover:bg-red-900/50 transition flex-shrink-0"
                        title="Eliminar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>768px) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm mt-6">
              <table className="min-w-full divide-y divide-neutral-800">
                <thead className="bg-neutral-900/60">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Equipo
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider w-24">
                      Posición
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider w-20">
                      Dorsal
                    </th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Descripción Corta
                    </th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-transparent divide-y divide-neutral-800/65">
                  {filteredPlayers.map((player) => (
                    <tr key={player.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="px-6 py-4.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-white tracking-wide">{player.nombre}</span>
                          {player.promovido && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              ✓ En BD
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-sm text-neutral-300">
                        {player.equipo}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-sm text-neutral-400">
                        {player.posicion || "-"}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-sm text-neutral-400 font-mono">
                        {player.dorsal !== null ? player.dorsal : "-"}
                      </td>
                      <td className="px-6 py-4.5 text-sm text-neutral-400 max-w-xs truncate" title={player.descripcion_corta}>
                        {player.descripcion_corta || <span className="text-neutral-600 font-light italic">Sin descripción</span>}
                      </td>
                      <td className="px-6 py-4.5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3.5">
                          {/* Promocionar */}
                          {!player.promovido ? (
                            <button
                              onClick={() => handlePromote(player)}
                              className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/40 px-2.5 py-1.5 rounded transition duration-150 text-xs font-bold border border-emerald-950/80 hover:border-emerald-800/80 flex items-center gap-1 min-h-[44px]"
                              title="Promover a base de datos específica"
                            >
                              → Pasar a BD Scouting
                            </button>
                          ) : (
                            <span className="text-neutral-600 text-xs font-medium px-2.5 py-1.5 cursor-not-allowed select-none min-h-[44px] flex items-center">
                              Promovido
                            </span>
                          )}

                          {/* Editar */}
                          <button
                            onClick={() => handleOpenEdit(player)}
                            className="text-neutral-400 hover:text-white hover:bg-neutral-800 w-11 h-11 flex items-center justify-center rounded-lg transition duration-150"
                            title="Editar"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => setConfirmDeleteId(player.id)}
                            className="text-red-500 hover:text-red-400 hover:bg-red-950/20 w-11 h-11 flex items-center justify-center rounded-lg transition duration-150"
                            title="Eliminar"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal / Bottom Sheet AÑADIR / EDITAR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-lg bg-neutral-900 border-t md:border border-neutral-800 rounded-t-3xl md:rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
            {/* Grabber indicator for mobile */}
            <div className="w-12 h-1.5 bg-neutral-800 rounded-full mx-auto mb-4 md:hidden" />
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800/50 md:bg-transparent"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-2 pr-10">
              <span className="w-2 h-5 bg-emerald-500 rounded-sm inline-block shrink-0"></span>
              <span className="truncate">{editingPlayer ? "Editar Jugador" : "Nuevo Jugador"}</span>
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-3.5 bg-red-950/40 border border-red-800/80 rounded-lg text-red-300 text-sm">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Nombre <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={formData.nombre}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-lg px-4 py-3 outline-none transition min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Equipo <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. UCAM CF"
                    value={formData.equipo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, equipo: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-lg px-4 py-3 outline-none transition min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Posición
                  </label>
                  <select
                    value={formData.posicion}
                    onChange={(e) => setFormData((prev) => ({ ...prev, posicion: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-lg pl-4 pr-10 py-3 outline-none transition cursor-pointer min-h-[44px] truncate"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="POR">POR</option>
                    <option value="LD">LD</option>
                    <option value="DFC">DFC</option>
                    <option value="LI">LI</option>
                    <option value="MCD">MCD</option>
                    <option value="MC">MC</option>
                    <option value="MCO">MCO</option>
                    <option value="EI">EI</option>
                    <option value="DC">DC</option>
                    <option value="ED">ED</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                    Dorsal
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="99"
                    placeholder="Ej. 10"
                    value={formData.dorsal}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dorsal: e.target.value }))}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-lg px-4 py-3 outline-none transition min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Descripción Corta
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre posición, características principales..."
                  value={formData.descripcion_corta}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descripcion_corta: e.target.value }))}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-lg px-4 py-3 outline-none transition resize-none min-h-[44px]"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 pb-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-5 py-3 rounded-xl sm:rounded-lg transition min-h-[44px] font-semibold order-2 sm:order-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-xl sm:rounded-lg transition flex items-center justify-center gap-2 min-h-[44px] order-1 sm:order-2 shadow-lg shadow-emerald-600/20"
                >
                  {isSaving && (
                    <div className="animate-spin rounded-full h-4.5 w-4.5 border-b-2 border-white"></div>
                  )}
                  {editingPlayer ? "Guardar Cambios" : "Añadir Jugador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal / Bottom Sheet CONFIRMACIÓN DE ELIMINACIÓN */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md bg-neutral-900 border-t md:border border-neutral-800 rounded-t-3xl md:rounded-2xl shadow-2xl p-6 relative animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
             <div className="w-12 h-1.5 bg-neutral-800 rounded-full mx-auto mb-4 md:hidden" />
            
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-10 h-10 rounded-full bg-red-950/50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </span>
              ¿Eliminar jugador?
            </h3>
            <p className="text-neutral-400 text-sm md:text-base mb-8 ml-12">
              Esta acción no se puede deshacer. Se eliminará al jugador de forma permanente del registro general.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-5 py-3 rounded-xl sm:rounded-lg transition font-semibold min-h-[44px] order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl sm:rounded-lg transition font-bold min-h-[44px] order-1 sm:order-2 shadow-lg shadow-red-600/20"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
