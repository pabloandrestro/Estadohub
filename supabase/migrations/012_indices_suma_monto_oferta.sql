-- Corrige "canceling statement due to statement timeout" en el RPC
-- mp_suma_monto_oferta (011_rpc_suma_monto_oferta.sql).
--
-- El problema no es la cantidad de filas en sí, sino que cada fila arrastra
-- columnas JSONB pesadas (payload, items, productos) que SUM() no necesita.
-- Sin índice de cobertura, Postgres lee la fila completa del heap solo para
-- sacar el monto. Con INCLUDE, la suma se resuelve leyendo únicamente el
-- índice (index-only scan), evitando el heap por completo.

-- Licitaciones: WHERE fecha_cierre >= now() ya usa idx_licitaciones_fecha_cierre
-- para ubicar las filas; agregamos monto_estimado al índice para no tener
-- que ir al heap a buscarlo.
CREATE INDEX IF NOT EXISTS idx_licitaciones_monto_vigentes
  ON licitaciones (fecha_cierre)
  INCLUDE (monto_estimado);

-- Compra ágil: mismo caso para la ventana de retención (fecha_creacion).
CREATE INDEX IF NOT EXISTS idx_compra_agil_monto_reciente
  ON compra_agil (fecha_creacion)
  INCLUDE (monto);

-- Órdenes de compra: sin WHERE (histórico completo, ~140k filas). El índice
-- por sí solo permite un index-only scan de toda la tabla en vez de un seq
-- scan que arrastra payload + items de cada fila.
CREATE INDEX IF NOT EXISTS idx_ordenes_compra_monto_total
  ON ordenes_compra (monto_total);
