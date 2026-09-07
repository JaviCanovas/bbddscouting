"use client";

import { useEffect, useState } from "react";
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
  equipo_formacion: string | null;
  lateralidad: string;
  contacto_telefono: string | null;
  contacto_amigo_de: string | null;
  representante: string | null;
  tecnica: number;
  tactica: number;
  fisico: number;
  descripcion_general: string | null;
  sueldo: string | null;
  lugar_residencia: string | null;
  lugar_origen: string | null;
  notas_residencia_origen: string | null;
  coche: boolean;
  estudios: string | null;
  video_url: string | null;
  volumen_id: string | null;
  created_at: string;
  volumen_jugadores?: {
    posicion: string | null;
  } | null;
}

// ── Helpers ──────────────────────────────────────────────

function calcularEdad(anio: number) {
  return new Date().getFullYear() - anio;
}

function calcularMedia(t: number, ta: number, f: number) {
  return ((t + ta + f) / 3).toFixed(1);
}

function getMediaColor(media: number) {
  if (media >= 4) return "text-emerald-400";
  if (media >= 3) return "text-amber-400";
  return "text-red-400";
}

function getMediaGlow(media: number) {
  if (media >= 4) return "shadow-emerald-500/20";
  if (media >= 3) return "shadow-amber-500/20";
  return "shadow-red-500/20";
}

function getStatBarColor(val: number) {
  if (val >= 4) return "from-emerald-700 to-emerald-400";
  if (val >= 3) return "from-amber-700 to-amber-400";
  return "from-red-700 to-red-400";
}

function getInitials(nombre: string) {
  return nombre.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ── Sub-components ───────────────────────────────────────

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  if (!value && value !== false && value !== 0) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-neutral-800/60 last:border-0">
      {icon && <span className="text-neutral-500 mt-0.5 flex-shrink-0">{icon}</span>}
      <div className="flex-1 min-w-0">
        <dt className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{label}</dt>
        <dd className="text-sm text-neutral-200 mt-0.5 break-words">{value}</dd>
      </div>
    </div>
  );
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-neutral-400 w-16 flex-shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition ${
              i <= value
                ? "bg-emerald-600/20 border border-emerald-600/60 text-emerald-400"
                : "bg-neutral-800/60 border border-neutral-700/40 text-neutral-600"
            }`}
          >
            {i}
          </div>
        ))}
      </div>
      <div className="flex-grow h-2 bg-neutral-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r rounded-full transition-all ${getStatBarColor(value)}`}
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────

interface PageProps {
  params: { id: string };
}

export default function JugadorDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data, error: fetchErr } = await supabase
          .from("jugadores")
          .select("*, volumen_jugadores(posicion)")
          .eq("id", params.id)
          .single();
        if (fetchErr) throw fetchErr;
        if (!data) throw new Error("Jugador no encontrado");
        setJugador(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [params.id]);

  const handleDelete = async () => {
    if (!jugador) return;
    try {
      setIsDeleting(true);

      // 1. Delete from jugadores
      const { data: delData, error: delErr } = await supabase
        .from("jugadores")
        .delete()
        .eq("id", jugador.id)
        .select();
      if (delErr) throw delErr;

      // 2. If linked to volumen, delete from volumen_jugadores as well
      if (jugador.volumen_id) {
        const { error: volErr } = await supabase
          .from("volumen_jugadores")
          .delete()
          .eq("id", jugador.volumen_id)
          .select();
        if (volErr) console.error("Error al eliminar de volumen_jugadores:", volErr);
      }

      if (!delData || delData.length === 0) {
        throw new Error(
          "Supabase no confirmó la eliminación. Comprueba que las políticas de RLS (DELETE) estén activadas en Supabase."
        );
      }

      router.push("/jugadores");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Error al eliminar:", msg);
      alert(`Error al eliminar: ${msg}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  // ── Loading state ─────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-neutral-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          <span>Cargando ficha...</span>
        </div>
      </div>
    );
  }

  if (error || !jugador) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="bg-neutral-900 border border-red-800/60 rounded-2xl p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-white mb-2">No encontrado</h2>
          <p className="text-neutral-400 text-sm mb-6">{error}</p>
          <Link href="/jugadores" className="text-emerald-400 hover:underline text-sm">
            ← Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  const edad = calcularEdad(jugador.anio_nacimiento);
  const media = parseFloat(calcularMedia(jugador.tecnica, jugador.tactica, jugador.fisico));
  const youtubeId = jugador.video_url ? extractYouTubeId(jugador.video_url) : null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      {/* ── Sticky nav bar ── */}
      <div className="sticky top-0 z-20 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/jugadores"
            className="flex items-center gap-2 text-neutral-400 hover:text-white text-sm transition font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <div className="hidden md:flex gap-2">
            <Link
              href={`/jugadores/${jugador.id}/editar`}
              className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-800/60 text-emerald-400 text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2 min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-950/30 hover:bg-red-950/60 border border-red-900/50 text-red-400 text-sm font-semibold px-4 py-2 rounded-lg transition flex items-center gap-2 min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto md:px-6 py-0 md:py-8 space-y-2 md:space-y-6 pb-24 md:pb-8">
        {/* ── Hero card ── */}
        <div className="bg-neutral-900/50 md:border border-neutral-800 md:rounded-2xl overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-0">
            {/* Photo panel */}
            <div className="relative w-full h-80 sm:w-56 sm:h-auto bg-neutral-800 flex-shrink-0">
              {jugador.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={jugador.imagen_url}
                  alt={jugador.nombre}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                  <span className="text-6xl font-black text-neutral-600 select-none">
                    {getInitials(jugador.nombre)}
                  </span>
                </div>
              )}
            </div>

            {/* Info panel */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                    {jugador.nombre}
                  </h1>
                  {/* Lateralidad badge */}
                  <span className="flex-shrink-0 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-full text-sm font-bold text-neutral-300">
                    {jugador.lateralidad}
                  </span>
                </div>

                <p className="text-neutral-400 text-lg font-medium mb-1">{jugador.equipo}</p>
                <p className="text-neutral-500 font-medium mb-2">{jugador.volumen_jugadores?.posicion || "Sin posición"}</p>
                {jugador.equipo_formacion && (
                  <p className="text-neutral-600 text-sm">Formación: {jugador.equipo_formacion}</p>
                )}
              </div>

              {/* Key stats */}
              <div className="flex flex-wrap items-center gap-4 mt-6">
                {/* Media prominente */}
                <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-neutral-950 border shadow-xl ${getMediaGlow(media)} border-neutral-800`}>
                  <span className={`text-3xl font-black font-mono leading-none ${getMediaColor(media)}`}>
                    {media.toFixed(1)}
                  </span>
                  <span className="text-xs text-neutral-500 mt-1">media</span>
                </div>

                {/* Edad */}
                <div className="flex flex-col">
                  <span className="text-4xl font-black text-white leading-none">{edad}</span>
                  <span className="text-xs text-neutral-500 mt-1">años ({jugador.anio_nacimiento})</span>
                </div>

                {/* Info chips */}
                <div className="flex flex-wrap gap-2 ml-auto">
                  {jugador.lugar_residencia && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-full text-xs text-neutral-300 font-medium">
                      <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {jugador.lugar_residencia}
                    </span>
                  )}
                  {jugador.coche && (
                    <span className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-full text-xs text-neutral-300 font-medium">
                      🚗 Con coche
                    </span>
                  )}
                  {jugador.sueldo && (
                    <span className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-800/50 rounded-full text-xs text-emerald-300 font-medium">
                      💰 {jugador.sueldo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-0 space-y-6">
        {/* ── Valoraciones ── */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 md:p-6">
          <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-5">
            Valoración técnica
          </h2>
          <div className="space-y-4">
            <StatBar label="Técnica" value={jugador.tecnica} />
            <StatBar label="Táctica" value={jugador.tactica} />
            <StatBar label="Físico" value={jugador.fisico} />
          </div>
          {/* Media bar */}
          <div className="mt-5 pt-5 border-t border-neutral-800 flex items-center gap-4">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Media</span>
            <div className="flex-grow h-3 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r rounded-full transition-all ${
                  media >= 4 ? "from-emerald-600 to-emerald-400" : media >= 3 ? "from-amber-600 to-amber-400" : "from-red-600 to-red-400"
                }`}
                style={{ width: `${(media / 5) * 100}%` }}
              />
            </div>
            <span className={`text-2xl font-black font-mono ${getMediaColor(media)}`}>
              {media.toFixed(1)}
            </span>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Descripción */}
          {jugador.descripcion_general && (
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">
                Informe del ojeador
              </h2>
              <p className="text-neutral-300 text-sm leading-relaxed whitespace-pre-wrap">
                {jugador.descripcion_general}
              </p>
            </div>
          )}

          {/* Contacto + Info personal */}
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-2">
              Contacto &amp; Información personal
            </h2>
            <dl>
              <InfoRow
                label="Teléfono"
                value={
                  jugador.contacto_telefono ? (
                    <a href={`tel:${jugador.contacto_telefono}`} className="text-emerald-400 hover:underline">
                      {jugador.contacto_telefono}
                    </a>
                  ) : null
                }
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                }
              />
              <InfoRow label="Amigo de" value={jugador.contacto_amigo_de} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
              <InfoRow label="Representante" value={jugador.representante} icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} />
              <InfoRow label="Estudios" value={jugador.estudios} />
              <InfoRow label="Sueldo" value={jugador.sueldo} />
              <InfoRow label="Residencia" value={jugador.lugar_residencia} />
              <InfoRow label="Origen" value={jugador.lugar_origen} />
              <InfoRow
                label="Vehículo propio"
                value={jugador.coche ? "Sí, tiene coche" : "No"}
              />
              {jugador.notas_residencia_origen && (
                <InfoRow
                  label="Notas residencia/origen"
                  value={
                    <span className="italic text-amber-300/80">{jugador.notas_residencia_origen}</span>
                  }
                />
              )}
            </dl>
          </div>
        </div>

        {/* ── Video embed ── */}
        {youtubeId && (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">
              Vídeo de seguimiento
            </h2>
            <div className="aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${youtubeId}`}
                title={`Vídeo de ${jugador.nombre}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
        </div>
      </div>

      {/* ── Mobile action bar ── */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-800/80 p-3 flex gap-3 safe-area-bottom">
        <Link
          href={`/jugadores/${jugador.id}/editar`}
          className="flex-1 bg-emerald-600/10 border border-emerald-800/60 text-emerald-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Editar
        </Link>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex-1 bg-red-950/30 border border-red-900/50 text-red-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eliminar
        </button>
      </div>

      {/* ── Delete modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md bg-neutral-900 border-t md:border border-neutral-800 rounded-t-3xl md:rounded-2xl shadow-2xl p-6 relative animate-in slide-in-from-bottom-10 md:slide-in-from-bottom-0 md:zoom-in-95 duration-200">
            <div className="w-12 h-1.5 bg-neutral-800 rounded-full mx-auto mb-4 md:hidden" />
            
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">¿Eliminar esta ficha?</h3>
                <p className="text-neutral-400 text-sm">
                  Se eliminará la ficha completa de{" "}
                  <span className="text-white font-semibold">{jugador.nombre}</span>.
                </p>
                {jugador.volumen_id && (
                  <p className="text-amber-400/80 text-xs mt-2">
                    Su registro en Volumen se conservará y podrá volver a promoverse.
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-5 py-3 rounded-xl sm:rounded-lg text-sm font-bold transition min-h-[44px] order-2 sm:order-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-3 rounded-xl sm:rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 min-h-[44px] shadow-lg shadow-red-600/20 order-1 sm:order-2"
              >
                {isDeleting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
