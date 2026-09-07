"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import StarRating from "@/app/components/StarRating";

// ── Helpers ──────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function calcularEdad(anio: number): number {
  return new Date().getFullYear() - anio;
}

function calcularMedia(t: number, ta: number, f: number): string {
  return ((t + ta + f) / 3).toFixed(1);
}

// ── Types ────────────────────────────────────────────────

export interface JugadorFormInitialData {
  id?: string;
  imagen_url?: string | null;
  nombre?: string;
  anio_nacimiento?: number | string;
  equipo?: string;
  equipo_formacion?: string | null;
  lateralidad?: "Diestro" | "Zurdo" | "Ambidiestro";
  contacto_telefono?: string | null;
  contacto_amigo_de?: string | null;
  representante?: string | null;
  tecnica?: number;
  tactica?: number;
  fisico?: number;
  descripcion_general?: string | null;
  sueldo?: string | null;
  lugar_residencia?: string | null;
  lugar_origen?: string | null;
  notas_residencia_origen?: string | null;
  coche?: boolean;
  estudios?: string | null;
  video_url?: string | null;
  volumen_id?: string | null;
}

interface JugadorFormProps {
  mode: "create" | "edit";
  initialData?: JugadorFormInitialData;
}

// ── Component ────────────────────────────────────────────

export default function JugadorForm({ mode, initialData }: JugadorFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stepper state (mobile only)
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form state
  const [nombre, setNombre] = useState(initialData?.nombre || "");
  const [anioNacimiento, setAnioNacimiento] = useState(initialData?.anio_nacimiento ? String(initialData.anio_nacimiento) : "");
  const [equipo, setEquipo] = useState(initialData?.equipo || "");
  const [equipoFormacion, setEquipoFormacion] = useState(initialData?.equipo_formacion || "");
  const [lateralidad, setLateralidad] = useState<"Diestro" | "Zurdo" | "Ambidiestro">(initialData?.lateralidad || "Diestro");

  const [contactoTelefono, setContactoTelefono] = useState(initialData?.contacto_telefono || "");
  const [contactoAmigoDe, setContactoAmigoDe] = useState(initialData?.contacto_amigo_de || "");
  const [representante, setRepresentante] = useState(initialData?.representante || "");

  const [tecnica, setTecnica] = useState<1 | 2 | 3 | 4 | 5>((initialData?.tecnica as 1 | 2 | 3 | 4 | 5) || 3);
  const [tactica, setTactica] = useState<1 | 2 | 3 | 4 | 5>((initialData?.tactica as 1 | 2 | 3 | 4 | 5) || 3);
  const [fisico, setFisico] = useState<1 | 2 | 3 | 4 | 5>((initialData?.fisico as 1 | 2 | 3 | 4 | 5) || 3);

  const [descripcionGeneral, setDescripcionGeneral] = useState(initialData?.descripcion_general || "");

  const [sueldo, setSueldo] = useState(initialData?.sueldo || "");
  const [lugarResidencia, setLugarResidencia] = useState(initialData?.lugar_residencia || "");
  const [lugarOrigen, setLugarOrigen] = useState(initialData?.lugar_origen || "");
  const [notasResidenciaOrigen, setNotasResidenciaOrigen] = useState(initialData?.notas_residencia_origen || "");
  const [coche, setCoche] = useState(initialData?.coche || false);
  const [estudios, setEstudios] = useState(initialData?.estudios || "");

  const [videoUrl, setVideoUrl] = useState(initialData?.video_url || "");

  // Image state
  const [imagenUrl, setImagenUrl] = useState(initialData?.imagen_url || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imagen_url || null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setNombre(initialData.nombre || "");
      setAnioNacimiento(initialData.anio_nacimiento ? String(initialData.anio_nacimiento) : "");
      setEquipo(initialData.equipo || "");
      setEquipoFormacion(initialData.equipo_formacion || "");
      setLateralidad(initialData.lateralidad || "Diestro");
      setContactoTelefono(initialData.contacto_telefono || "");
      setContactoAmigoDe(initialData.contacto_amigo_de || "");
      setRepresentante(initialData.representante || "");
      setTecnica((initialData.tecnica as 1 | 2 | 3 | 4 | 5) || 3);
      setTactica((initialData.tactica as 1 | 2 | 3 | 4 | 5) || 3);
      setFisico((initialData.fisico as 1 | 2 | 3 | 4 | 5) || 3);
      setDescripcionGeneral(initialData.descripcion_general || "");
      setSueldo(initialData.sueldo || "");
      setLugarResidencia(initialData.lugar_residencia || "");
      setLugarOrigen(initialData.lugar_origen || "");
      setNotasResidenciaOrigen(initialData.notas_residencia_origen || "");
      setCoche(initialData.coche || false);
      setEstudios(initialData.estudios || "");
      setVideoUrl(initialData.video_url || "");
      setImagenUrl(initialData.imagen_url || "");
      setImagePreview(initialData.imagen_url || null);
    }
  }, [initialData]);

  // Computed values
  const edad = anioNacimiento ? calcularEdad(parseInt(anioNacimiento, 10)) : null;
  const media = calcularMedia(tecnica, tactica, fisico);
  const youtubeId = extractYouTubeId(videoUrl);

  // ── Image handling ──────────────────────────────────────

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Por favor selecciona un archivo de imagen válido.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("La imagen no debe superar 5 MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFormError("");
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("jugadores-imagenes")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (error) {
      console.error("Error al subir imagen:", error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("jugadores-imagenes")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  // ── Save handler ────────────────────────────────────────

  const handleSave = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setFormError("");
    setFormSuccess("");

    // Validation
    if (!nombre.trim()) {
      setFormError("El nombre del jugador es obligatorio.");
      return;
    }
    if (!anioNacimiento || isNaN(parseInt(anioNacimiento, 10))) {
      setFormError("El año de nacimiento es obligatorio y debe ser un número.");
      return;
    }
    if (!equipo.trim()) {
      setFormError("El equipo es obligatorio.");
      return;
    }

    try {
      setIsSaving(true);

      let finalImageUrl = imagenUrl;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        } else {
          setFormError("No se pudo subir la imagen. Inténtalo de nuevo.");
          setIsSaving(false);
          return;
        }
      }

      const payload = {
        imagen_url: finalImageUrl || null,
        nombre: nombre.trim(),
        anio_nacimiento: parseInt(anioNacimiento, 10),
        equipo: equipo.trim(),
        equipo_formacion: equipoFormacion.trim() || null,
        lateralidad,
        contacto_telefono: contactoTelefono.trim() || null,
        contacto_amigo_de: contactoAmigoDe.trim() || null,
        representante: representante.trim() || null,
        tecnica,
        tactica,
        fisico,
        descripcion_general: descripcionGeneral.trim() || null,
        sueldo: sueldo.trim() || null,
        lugar_residencia: lugarResidencia.trim() || null,
        lugar_origen: lugarOrigen.trim() || null,
        notas_residencia_origen: notasResidenciaOrigen.trim() || null,
        coche,
        estudios: estudios.trim() || null,
        video_url: videoUrl.trim() || null,
        volumen_id: initialData?.volumen_id || null,
      };

      if (mode === "edit" && initialData?.id) {
        const { error } = await supabase
          .from("jugadores")
          .update(payload)
          .eq("id", initialData.id);
        if (error) throw error;
        setFormSuccess("Ficha actualizada correctamente.");
      } else {
        const { error } = await supabase.from("jugadores").insert([payload]);
        if (error) throw error;

        // Si se proviene de volumen_jugadores, marcar como promovido tras guardar con éxito la ficha
        if (initialData?.volumen_id) {
          const { error: volErr } = await supabase
            .from("volumen_jugadores")
            .update({ promovido: true })
            .eq("id", initialData.volumen_id);
          if (volErr) {
            console.error("Error al actualizar estado promovido en volumen_jugadores:", volErr);
          }
        }

        setFormSuccess("Jugador guardado correctamente.");
      }

      setTimeout(() => router.push("/jugadores"), 800);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error al guardar:", message);
      setFormError(`Error al guardar: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const lateralidadOptions: Array<"Diestro" | "Zurdo" | "Ambidiestro"> = [
    "Diestro",
    "Zurdo",
    "Ambidiestro",
  ];

  const handleNext = () => {
    // Validate step 1 before proceeding
    if (currentStep === 1) {
      if (!nombre.trim() || !anioNacimiento || !equipo.trim()) {
        setFormError("Por favor, rellena nombre, año de nacimiento y equipo antes de continuar.");
        return;
      }
    }
    setFormError("");
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-full bg-neutral-950 text-neutral-100 font-sans p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 md:mb-10 border-b border-emerald-950/50 pb-6 md:pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800 w-11 h-11 flex items-center justify-center rounded-xl transition"
            title="Volver"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 sm:gap-3">
              <span className="w-2.5 sm:w-3 h-5 sm:h-6 bg-emerald-500 rounded-sm inline-block" />
              {mode === "edit" ? "Editar Ficha" : "Nueva Ficha"}
            </h1>
            <p className="text-neutral-400 mt-1 text-[11px] sm:text-sm">
              {mode === "edit"
                ? "Modifica los datos de la ficha del jugador."
                : "Completa la ficha detallada del jugador para la base de datos."}
            </p>
          </div>
        </div>

        {/* ── MOBILE STEPPER PROGRESS ── */}
        <div className="md:hidden mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-400 mb-2 px-1">
            <span>Paso {currentStep} de {totalSteps}</span>
            <span className="text-emerald-500">
              {currentStep === 1 && "Datos Básicos"}
              {currentStep === 2 && "Contacto & Valoración"}
              {currentStep === 3 && "Info Personal"}
              {currentStep === 4 && "Media (Vídeo)"}
            </span>
          </div>
          <div className="flex gap-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 transition-colors duration-300 ${
                  step <= currentStep ? "bg-emerald-500" : "bg-neutral-800"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Alerts */}
        {formError && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {formError}
          </div>
        )}
        {formSuccess && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-emerald-300 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formSuccess}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="space-y-6 md:space-y-8"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
              e.preventDefault();
            }
          }}
        >
          
          {/* ======================================= */}
          {/* STEP 1: DATOS BÁSICOS                   */}
          {/* ======================================= */}
          <div className={`md:block ${currentStep === 1 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}`}>
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 md:p-6">
              <div className="hidden md:flex items-center gap-3 mb-5 mt-2">
                <span className="flex-shrink-0 w-7 h-7 rounded-md bg-emerald-600/20 border border-emerald-700/50 text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
                <h2 className="text-lg font-bold text-white tracking-tight">Datos Básicos</h2>
                <div className="flex-grow h-px bg-neutral-800" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
                {/* Image upload */}
                <div className="flex flex-col items-center gap-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-40 h-48 md:w-44 md:h-52 rounded-2xl border-2 border-dashed border-neutral-700 hover:border-emerald-500 bg-neutral-900 flex items-center justify-center cursor-pointer overflow-hidden transition-colors group"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <svg className="w-10 h-10 text-neutral-600 group-hover:text-emerald-500 mx-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-neutral-500 group-hover:text-neutral-300 mt-2 block transition-colors">
                          Añadir foto
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        setImagenUrl("");
                      }}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold p-2"
                    >
                      Eliminar foto
                    </button>
                  )}
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Nombre <span className="text-emerald-500">*</span></label>
                    <input type="text" required placeholder="Nombre completo del jugador" value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Año de nacimiento <span className="text-emerald-500">*</span></label>
                    <div className="flex items-center gap-3">
                      <input type="number" inputMode="numeric" required min="1970" max={new Date().getFullYear()} placeholder="Ej. 2002" value={anioNacimiento} onChange={(e) => setAnioNacimiento(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
                      {edad !== null && edad > 0 && (
                        <span className="flex-shrink-0 px-3 py-2.5 bg-emerald-950/50 border border-emerald-800/50 rounded-xl text-emerald-400 text-sm font-bold whitespace-nowrap min-h-[44px] flex items-center">
                          {edad} años
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Equipo <span className="text-emerald-500">*</span></label>
                    <input type="text" required placeholder="Equipo actual" value={equipo} onChange={(e) => setEquipo(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Equipo de formación</label>
                    <input type="text" placeholder="Equipo donde se formó" value={equipoFormacion} onChange={(e) => setEquipoFormacion(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Lateralidad</label>
                    <div className="flex gap-2">
                      {lateralidadOptions.map((opt) => (
                        <button key={opt} type="button" onClick={() => setLateralidad(opt)} className={`flex-1 px-2 py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-150 border min-h-[44px] ${lateralidad === opt ? "bg-emerald-600/20 border-emerald-600 text-emerald-400" : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================= */}
          {/* STEP 2: CONTACTO & VALORACIONES         */}
          {/* ======================================= */}
          <div className={`md:block space-y-6 md:space-y-8 ${currentStep === 2 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}`}>
            
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 md:p-6">
              <div className="hidden md:flex items-center gap-3 mb-5 mt-2">
                <span className="flex-shrink-0 w-7 h-7 rounded-md bg-emerald-600/20 border border-emerald-700/50 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                <h2 className="text-lg font-bold text-white tracking-tight">Contacto</h2>
                <div className="flex-grow h-px bg-neutral-800" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Teléfono</label>
                  <input type="tel" inputMode="tel" placeholder="Ej. +34 600 123 456" value={contactoTelefono} onChange={(e) => setContactoTelefono(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Amigo de</label>
                  <input type="text" placeholder="A través de quién se conoce" value={contactoAmigoDe} onChange={(e) => setContactoAmigoDe(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Representante <span className="text-neutral-500 font-normal lowercase">(opcional)</span></label>
                  <input type="text" placeholder="Agencia o nombre del agente" value={representante} onChange={(e) => setRepresentante(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 md:p-6">
              <div className="hidden md:flex items-center gap-3 mb-5 mt-2">
                <span className="flex-shrink-0 w-7 h-7 rounded-md bg-emerald-600/20 border border-emerald-700/50 text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                <h2 className="text-lg font-bold text-white tracking-tight">Valoración</h2>
                <div className="flex-grow h-px bg-neutral-800" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StarRating label="Técnica" value={tecnica} onChange={setTecnica} />
                <StarRating label="Táctica" value={tactica} onChange={setTactica} />
                <StarRating label="Físico" value={fisico} onChange={setFisico} />
              </div>

              {/* Media display */}
              <div className="mt-6 flex items-center gap-4 p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider hidden sm:block">Media</span>
                <span className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight">
                  {media}
                </span>
                <span className="text-sm text-neutral-500">/ 5.0</span>
                <div className="flex-grow h-2.5 bg-neutral-800 rounded-full overflow-hidden ml-2">
                  <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-300" style={{ width: `${(parseFloat(media) / 5) * 100}%` }} />
                </div>
              </div>
            </div>

          </div>

          {/* ======================================= */}
          {/* STEP 3: DESCRIPCIÓN & INFO PERSONAL     */}
          {/* ======================================= */}
          <div className={`md:block space-y-6 md:space-y-8 ${currentStep === 3 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}`}>
            
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 md:p-6">
              <div className="hidden md:flex items-center gap-3 mb-5 mt-2">
                <span className="flex-shrink-0 w-7 h-7 rounded-md bg-emerald-600/20 border border-emerald-700/50 text-emerald-400 flex items-center justify-center text-xs font-bold">4</span>
                <h2 className="text-lg font-bold text-white tracking-tight">Descripción</h2>
                <div className="flex-grow h-px bg-neutral-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Descripción general del jugador</label>
                <textarea rows={5} placeholder="Descripción detallada: posición, estilo, fortalezas, observaciones..." value={descripcionGeneral} onChange={(e) => setDescripcionGeneral(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition resize-y min-h-[44px]" />
              </div>
            </div>

            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 md:p-6">
              <div className="hidden md:flex items-center gap-3 mb-5 mt-2">
                <span className="flex-shrink-0 w-7 h-7 rounded-md bg-emerald-600/20 border border-emerald-700/50 text-emerald-400 flex items-center justify-center text-xs font-bold">5</span>
                <h2 className="text-lg font-bold text-white tracking-tight">Info Personal</h2>
                <div className="flex-grow h-px bg-neutral-800" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Sueldo</label>
                  <input type="text" inputMode="numeric" placeholder='Ej. 1.200€/mes' value={sueldo} onChange={(e) => setSueldo(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Estudios</label>
                  <input type="text" placeholder="Ej. Grado en ADE, ESO..." value={estudios} onChange={(e) => setEstudios(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Lugar de residencia</label>
                  <input type="text" placeholder="Ciudad o localidad actual" value={lugarResidencia} onChange={(e) => setLugarResidencia(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Lugar de origen</label>
                  <input type="text" placeholder="Ciudad o país de procedencia" value={lugarOrigen} onChange={(e) => setLugarOrigen(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Notas sobre residencia / origen</label>
                  <textarea rows={2} placeholder='Ej. "Vive lejos pero tiene coche"' value={notasResidenciaOrigen} onChange={(e) => setNotasResidenciaOrigen(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition resize-none min-h-[44px]" />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-800 rounded-xl">
                    <div>
                      <span className="block text-sm font-semibold text-white">¿Tiene coche?</span>
                      <span className="text-xs text-neutral-500">Indica si dispone de vehículo.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoche(!coche)}
                      className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none min-h-[44px] flex items-center justify-center shrink-0 ${coche ? "bg-emerald-600" : "bg-neutral-700"}`}
                    >
                      <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${coche ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ======================================= */}
          {/* STEP 4: MEDIA (YOUTUBE)                 */}
          {/* ======================================= */}
          <div className={`md:block ${currentStep === 4 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}`}>
            
            <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-5 md:p-6">
              <div className="hidden md:flex items-center gap-3 mb-5 mt-2">
                <span className="flex-shrink-0 w-7 h-7 rounded-md bg-emerald-600/20 border border-emerald-700/50 text-emerald-400 flex items-center justify-center text-xs font-bold">6</span>
                <h2 className="text-lg font-bold text-white tracking-tight">Media</h2>
                <div className="flex-grow h-px bg-neutral-800" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">URL de vídeo (YouTube)</label>
                <input type="url" inputMode="url" placeholder="https://www.youtube.com/watch?v=..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-base md:text-sm text-white rounded-xl px-4 py-3 outline-none transition min-h-[44px]" />
              </div>
              {youtubeId && (
                <div className="mt-4 rounded-xl overflow-hidden border border-neutral-800 bg-black aspect-video">
                  <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}`} title="Preview de vídeo" allowFullScreen />
                </div>
              )}
            </div>

          </div>

          {/* ─────── STEPPER ACCIONES (MÓVIL) ─────── */}
          <div className="md:hidden flex gap-3 pt-2 pb-10">
            <button
              type="button"
              onClick={currentStep === 1 ? () => router.back() : handlePrev}
              className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold px-4 py-3.5 rounded-xl transition min-h-[44px]"
            >
              {currentStep === 1 ? "Cancelar" : "← Anterior"}
            </button>

            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3.5 rounded-xl transition min-h-[44px] shadow-lg shadow-emerald-600/20"
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-4 py-3.5 rounded-xl transition flex items-center justify-center gap-2 min-h-[44px] shadow-lg shadow-emerald-600/20"
              >
                {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                {isSaving ? "Guardando..." : "Guardar Ficha ✓"}
              </button>
            )}
          </div>

          {/* ─────── ACCIONES (DESKTOP) ─────── */}
          <div className="hidden md:flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 pb-10 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium px-6 py-3 rounded-lg transition min-h-[44px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-emerald-500/10 transition flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isSaving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
              {isSaving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Guardar ficha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
