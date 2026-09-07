"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import JugadorForm from "@/app/components/JugadorForm";
import type { JugadorFormInitialData } from "@/app/components/JugadorForm";

function NuevoContent() {
  const searchParams = useSearchParams();

  // Pre-fill from volumen if coming from promotion flow
  const initialData: JugadorFormInitialData = {
    volumen_id: searchParams.get("volumen_id") || undefined,
    nombre: searchParams.get("nombre") || "",
    equipo: searchParams.get("equipo") || "",
    representante: searchParams.get("representante") || "",
  };

  return <JugadorForm mode="create" initialData={initialData} />;
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-neutral-400">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
        <span>Cargando formulario...</span>
      </div>
    </div>
  );
}

export default function NuevoPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NuevoContent />
    </Suspense>
  );
}
