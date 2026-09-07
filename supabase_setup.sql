-- ============================================================
-- BASE DE DATOS SCOUTING - Setup completo para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLA: volumen_jugadores (apartado general / volumen)
-- ------------------------------------------------------------

CREATE TABLE volumen_jugadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  equipo TEXT NOT NULL,
  posicion TEXT,
  dorsal INTEGER,
  descripcion_corta TEXT,
  promovido BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE volumen_jugadores IS 'Apartado de volumen: listado general de jugadores detectados en scouting';
COMMENT ON COLUMN volumen_jugadores.promovido IS 'Indica si el jugador ha sido promovido al apartado especifico (tabla jugadores)';

-- ------------------------------------------------------------
-- 2. TABLA: jugadores (apartado especifico)
-- ------------------------------------------------------------

CREATE TABLE jugadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volumen_id UUID REFERENCES volumen_jugadores(id) ON DELETE CASCADE,
  imagen_url TEXT,
  nombre TEXT NOT NULL,
  anio_nacimiento INTEGER NOT NULL,
  equipo TEXT NOT NULL,
  contacto_telefono TEXT,
  contacto_amigo_de TEXT,
  representante TEXT,
  tecnica SMALLINT CHECK (tecnica BETWEEN 1 AND 5),
  tactica SMALLINT CHECK (tactica BETWEEN 1 AND 5),
  fisico SMALLINT CHECK (fisico BETWEEN 1 AND 5),
  descripcion_general TEXT,
  equipo_formacion TEXT,
  lateralidad TEXT CHECK (lateralidad IN ('Diestro', 'Zurdo', 'Ambidiestro')),
  sueldo TEXT,
  lugar_residencia TEXT,
  lugar_origen TEXT,
  notas_residencia_origen TEXT,
  coche BOOLEAN DEFAULT FALSE,
  estudios TEXT,
  video_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE jugadores IS 'Apartado especifico: ficha completa de jugadores promovidos desde volumen';
COMMENT ON COLUMN jugadores.volumen_id IS 'FK a volumen_jugadores.id - referencia al registro original en volumen';
COMMENT ON COLUMN jugadores.anio_nacimiento IS 'Anio de nacimiento del jugador (la edad se calcula en frontend)';
COMMENT ON COLUMN jugadores.tecnica IS 'Valoracion tecnica del 1 al 5';
COMMENT ON COLUMN jugadores.tactica IS 'Valoracion tactica del 1 al 5';
COMMENT ON COLUMN jugadores.fisico IS 'Valoracion fisica del 1 al 5';

-- ------------------------------------------------------------
-- 3. INDICES para busquedas por nombre y equipo
-- ------------------------------------------------------------

-- Indices en volumen_jugadores
CREATE INDEX idx_volumen_jugadores_nombre ON volumen_jugadores USING btree (nombre);
CREATE INDEX idx_volumen_jugadores_equipo ON volumen_jugadores USING btree (equipo);
CREATE INDEX idx_volumen_jugadores_promovido ON volumen_jugadores USING btree (promovido);

-- Indices en jugadores
CREATE INDEX idx_jugadores_nombre ON jugadores USING btree (nombre);
CREATE INDEX idx_jugadores_equipo ON jugadores USING btree (equipo);
CREATE INDEX idx_jugadores_volumen_id ON jugadores USING btree (volumen_id);

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY - Politicas permisivas (uso interno)
-- ------------------------------------------------------------

-- Activar RLS en ambas tablas
ALTER TABLE volumen_jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;

-- Politica permisiva para volumen_jugadores (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Permitir lectura publica en volumen_jugadores"
  ON volumen_jugadores FOR SELECT
  USING (true);

CREATE POLICY "Permitir insercion publica en volumen_jugadores"
  ON volumen_jugadores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualizacion publica en volumen_jugadores"
  ON volumen_jugadores FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir eliminacion publica en volumen_jugadores"
  ON volumen_jugadores FOR DELETE
  USING (true);

-- Politica permisiva para jugadores (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Permitir lectura publica en jugadores"
  ON jugadores FOR SELECT
  USING (true);

CREATE POLICY "Permitir insercion publica en jugadores"
  ON jugadores FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir actualizacion publica en jugadores"
  ON jugadores FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir eliminacion publica en jugadores"
  ON jugadores FOR DELETE
  USING (true);

-- ------------------------------------------------------------
-- 5. STORAGE - Bucket para imagenes de jugadores
-- ------------------------------------------------------------

-- Crear bucket publico para imagenes
INSERT INTO storage.buckets (id, name, public)
VALUES ('jugadores-imagenes', 'jugadores-imagenes', true);

-- Politica: permitir SELECT (descargar/ver) a todos
CREATE POLICY "Permitir lectura publica de imagenes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'jugadores-imagenes');

-- Politica: permitir INSERT (subir) a todos
CREATE POLICY "Permitir subida publica de imagenes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'jugadores-imagenes');

-- Politica: permitir UPDATE (sobrescribir) a todos
CREATE POLICY "Permitir actualizacion publica de imagenes"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'jugadores-imagenes')
  WITH CHECK (bucket_id = 'jugadores-imagenes');

-- Politica: permitir DELETE (eliminar) a todos
CREATE POLICY "Permitir eliminacion publica de imagenes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'jugadores-imagenes');
