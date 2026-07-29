-- Sube el techo hard-coded del LIMIT de los RPC de similitud: 50 → 200.
-- La app debe pedir max_resultados acorde (MAX_HITS).

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
  LIMIT GREATEST(1, LEAST(COALESCE(max_resultados, 20), 200));
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
  LIMIT GREATEST(1, LEAST(COALESCE(max_resultados, 20), 200));
$$;
