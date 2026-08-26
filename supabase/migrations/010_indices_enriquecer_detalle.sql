-- Índices para acelerar listarPendientesDetalle() (services/supabase/mercadoPublicoRepo.js)
-- usado por /api/sync/enriquecer-detalle. Sin estos índices las consultas de
-- "pendientes de detalle" degradan a seq scan + sort a medida que crecen las
-- tablas, provocando "canceling statement due to statement timeout".

-- Licitaciones: filtra fecha_cierre >= now() AND payload->Comprador IS NULL,
-- ordenado por fecha_cierre. Índice parcial que cubre exactamente las filas
-- pendientes (Comprador ausente = detalle no enriquecido).
CREATE INDEX IF NOT EXISTS idx_licitaciones_pendiente_detalle
  ON licitaciones (fecha_cierre)
  WHERE (payload ->> 'Comprador') IS NULL;

-- Órdenes de compra: filtra fecha IS NULL, ordenado por sincronizado_en desc.
-- Índice parcial sobre el backlog (fecha nula = detalle no enriquecido).
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_pendiente_detalle
  ON ordenes_compra (sincronizado_en DESC)
  WHERE fecha IS NULL;

-- Compra ágil: paginación filtra fecha_creacion >= limite retención,
-- ordenada por fecha_cierre desc. Compuesto para evitar filtrar sin índice
-- y luego ordenar aparte.
CREATE INDEX IF NOT EXISTS idx_compra_agil_creacion_cierre
  ON compra_agil (fecha_creacion, fecha_cierre DESC);
