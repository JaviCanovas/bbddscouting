export interface JugadorVolumen {
  id: string;
  nombre: string;
  equipo: string;
  posicion: string | null;
  dorsal: number;
  descripcion_corta: string;
  promovido: boolean;
  created_at: string;
}

export interface Jugador {
  id: string;
  imagen_url: string | null;
  nombre: string;
  anio_nacimiento: number;
  edad: number;
  equipo: string;
  contacto_telefono: string | null;
  contacto_amigo_de: string | null;
  representante: string | null;
  tecnica: 1 | 2 | 3 | 4 | 5;
  tactica: 1 | 2 | 3 | 4 | 5;
  fisico: 1 | 2 | 3 | 4 | 5;
  media: number;
  descripcion_general: string;
  equipo_formacion: string | null;
  lateralidad: 'Diestro' | 'Zurdo' | 'Ambidiestro';
  sueldo: string | null;
  lugar_residencia: string | null;
  lugar_origen: string | null;
  notas_residencia_origen: string | null;
  coche: boolean;
  estudios: string | null;
  video_url: string | null;
  volumen_id: string;
  created_at: string;
}
