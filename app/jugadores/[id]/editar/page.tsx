"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase";
import JugadorForm from "@/app/components/JugadorForm";
import type { JugadorFormInitialData } from "@/app/components/JugadorForm";

interface EditarPageProps {
  params: { id: string };
}

export default function EditarPage({ params }: EditarPageProps) {
  const [initialData, setInitialData] = useState<JugadorFormInitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJugador = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from("jugadores")
          .select("*")
          .eq("id", params.id)
          .single();

        if (fetchError) throw fetchError;
        if (!data) throw new Error("Jugador no encontrado");

        setInitialData({
          id: data.id,
          imagen_url: data.imagen_url,
          nombre: data.nombre,
          anio_nacimiento: data.anio_nacimiento,
          equipo: data.equipo,
          equipo_formacion: data.equipo_formacion,
          lateralidad: data.lateralidad,
          contacto_telefono: data.contacto_telefono,
          contacto_amigo_de: data.contacto_amigo_de,
          representante: data.representante,
          tecnica: data.tecnica,
          tactica: data.tactica,
          fisico: data.fisico,
          descripcion_general: data.descripcion_general,
          sueldo: data.sueldo,
          lugar_residencia: data.lugar_residencia,
          lugar_origen: data.lugar_origen,
          notas_residencia_origen: data.notas_residencia_origen,
          coche: data.coche,
          estudios: data.estudios,
          video_url: data.video_url,
          volumen_id: data.volumen_id,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("Error al cargar jugador:", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchJugador();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-neutral-400">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          <span>Cargando ficha del jugador...</span>
        </div>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="bg-neutral-900 border border-red-800/60 rounded-2xl p-8 max-w-md text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-white mb-2">Error al cargar</h2>
          <p className="text-neutral-400 text-sm">{error || "No se encontró el jugador."}</p>
        </div>
      </div>
    );
  }

  return <JugadorForm mode="edit" initialData={initialData} />;
}
