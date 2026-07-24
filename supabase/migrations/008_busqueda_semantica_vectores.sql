-- =============================================================================
-- 008 — Búsqueda semántica (etapa 1): columnas + índice + RPC
-- =============================================================================
-- Qué hace: prepara la base para buscar por “parecido de significado”, no solo
--           por coincidencia de texto (ilike).
-- Qué NO hace: no genera vectores, no cambia la API ni la UI, no reescribe datos.
--
--
-- Dimensión 1536: encaja con text-embedding-3-small (OpenAI) y equivalentes.
--

-- =============================================================================

-- Extensión de vectores de Postgres 
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Columnas en las tres tablas MP ───────────────────────────────────────────
-- vector_busqueda: representación numérica del contenido (nombre+desc+ítems).
-- texto_indice:    el texto exacto que se embebió (auditoría / re-indexar).
-- indexado_en:     cuándo se generó el vector (NULL = aún no indexado).

ALTER TABLE compra_agil
  ADD COLUMN IF NOT EXISTS vector_busqueda vector(1536),
  ADD COLUMN IF NOT EXISTS texto_indice    text,
  ADD COLUMN IF NOT EXISTS indexado_en     timestamptz;

ALTER TABLE licitaciones
  ADD COLUMN IF NOT EXISTS vector_busqueda vector(1536),
  ADD COLUMN IF NOT EXISTS texto_indice    text,
  ADD COLUMN IF NOT EXISTS indexado_en     timestamptz;

ALTER TABLE ordenes_compra
  ADD COLUMN IF NOT EXISTS vector_busqueda vector(1536),
  ADD COLUMN IF NOT EXISTS texto_indice    text,
  ADD COLUMN IF NOT EXISTS indexado_en     timestamptz;

-- Índices solo sobre filas ya indexadas (partial). Vacío al inicio = barato.
-- HNSW + distancia coseno: buena calidad para “¿qué se parece a esta frase?”.
CREATE INDEX IF NOT EXISTS idx_compra_agil_vector_busqueda
  ON compra_agil
  USING hnsw (vector_busqueda vector_cosine_ops)
  WHERE vector_busqueda IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_licitaciones_vector_busqueda
  ON licitaciones
  USING hnsw (vector_busqueda vector_cosine_ops)
  WHERE vector_busqueda IS NOT NULL;

-- Órdenes: columna lista, índice cuando empiecen a indexar (~140k filas).

-- =============================================================================
-- RPC: buscar por similitud (aún sin callers en la app)
-- =============================================================================
-- Devuelve filas ordenadas de más parecida a menos.
-- similitud = 1 - distancia_coseno  →  1 = idéntico, 0 = sin relación.


CREATE OR REPLACE FUNCTION buscar_compras_agiles_parecidas(
  vector_consulta   vector(1536),
  max_resultados    integer      DEFAULT 20,
  similitud_minima  double precision DEFAULT 0.25,
  monto_maximo      numeric      DEFAULT NULL,
  region_filtro     text         DEFAULT NULL,
  estado_filtro     text         DEFAULT NULL,
  solo_ultimos_dias integer      DEFAULT 7
)
RETURNS TABLE (
  codigo            text,
  nombre            text,
  organismo         text,
  region            text,
  monto             numeric,
  estado            text,
  fecha_cierre      timestamptz,
  descripcion       text,
  similitud         double precision
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    c.codigo,
    c.nombre,
    c.organismo,
    c.region,
    c.monto,
    c.estado,
    c.fecha_cierre,
    c.descripcion,
    (1 - (c.vector_busqueda <=> vector_consulta))::double precision AS similitud
  FROM compra_agil c
  WHERE c.vector_busqueda IS NOT NULL
    AND (1 - (c.vector_busqueda <=> vector_consulta)) >= similitud_minima
    AND (monto_maximo IS NULL OR c.monto IS NULL OR c.monto <= monto_maximo)
    AND (
      region_filtro IS NULL
      OR region_filtro = ''
      OR c.region ILIKE region_filtro
    )
    AND (
      estado_filtro IS NULL
      OR estado_filtro = ''
      OR c.estado = estado_filtro
    )
    AND (
      solo_ultimos_dias IS NULL
      OR c.fecha_creacion >= (now() - make_interval(days => solo_ultimos_dias))
    )
  ORDER BY c.vector_busqueda <=> vector_consulta
  LIMIT GREATEST(1, LEAST(COALESCE(max_resultados, 20), 50));
$$;

CREATE OR REPLACE FUNCTION buscar_licitaciones_parecidas(
  vector_consulta   vector(1536),
  max_resultados    integer      DEFAULT 20,
  similitud_minima  double precision DEFAULT 0.25,
  monto_maximo      numeric      DEFAULT NULL,
  region_filtro     text         DEFAULT NULL,
  estado_filtro     text         DEFAULT NULL,
  solo_vigentes     boolean      DEFAULT true
)
RETURNS TABLE (
  codigo            text,
  nombre            text,
  organismo         text,
  region_unidad     text,
  monto_estimado    numeric,
  estado            text,
  fecha_cierre      timestamptz,
  descripcion       text,
  similitud         double precision
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    l.codigo,
    l.nombre,
    l.organismo,
    l.region_unidad,
    l.monto_estimado,
    l.estado,
    l.fecha_cierre,
    l.descripcion,
    (1 - (l.vector_busqueda <=> vector_consulta))::double precision AS similitud
  FROM licitaciones l
  WHERE l.vector_busqueda IS NOT NULL
    AND (1 - (l.vector_busqueda <=> vector_consulta)) >= similitud_minima
    AND (
      monto_maximo IS NULL
      OR l.monto_estimado IS NULL
      OR l.monto_estimado <= monto_maximo
    )
    AND (
      region_filtro IS NULL
      OR region_filtro = ''
      OR l.region_unidad ILIKE region_filtro
    )
    AND (
      estado_filtro IS NULL
      OR estado_filtro = ''
      OR l.estado = estado_filtro
    )
    AND (
      solo_vigentes IS NOT TRUE
      OR l.fecha_cierre IS NULL
      OR l.fecha_cierre >= now()
    )
  ORDER BY l.vector_busqueda <=> vector_consulta
  LIMIT GREATEST(1, LEAST(COALESCE(max_resultados, 20), 50));
$$;

COMMENT ON COLUMN compra_agil.vector_busqueda IS
  'Vector semántico (1536) del contenido indexado. NULL = aún no indexada.';
COMMENT ON COLUMN compra_agil.texto_indice IS
  'Texto que se envió al modelo de embeddings; sirve para auditar y re-indexar.';
COMMENT ON COLUMN compra_agil.indexado_en IS
  'Momento en que se guardó vector_busqueda.';

COMMENT ON FUNCTION buscar_compras_agiles_parecidas IS
  'Etapa 1 búsqueda semántica: ranking por parecido + filtros opcionales de monto/región/estado/retención.';
COMMENT ON FUNCTION buscar_licitaciones_parecidas IS
  'Etapa 1 búsqueda semántica: ranking por parecido + filtros opcionales; por defecto solo vigentes.';
