-- RPC para la tarjeta "Monto total oferta" en las 3 secciones de Mercado
-- Público. Suma en la DB (no en la app) para no traer miles de filas al
-- cliente solo para sumarlas.
--
-- Alcance por módulo (mismo universo base que ya usa la tarjeta "Registros",
-- ver aplicarFiltrosBase en services/supabase/mercadoPublicoRepo.js):
--   - licitaciones:    solo vigentes (fecha_cierre >= now())
--   - compra-agil:     solo dentro de la ventana de retención (7 días,
--                       ver DIAS_RETENCION_CA en lib/mercado-publico/constantesMp.js)
--   - ordenes-compra:  histórico completo (no hay noción de "vigente";
--                       son compras ya emitidas, así que se muestra como
--                       "monto total transado", no como "potencial")
CREATE OR REPLACE FUNCTION mp_suma_monto_oferta(p_modulo text)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  resultado numeric;
BEGIN
  IF p_modulo = 'licitaciones' THEN
    SELECT COALESCE(SUM(monto_estimado), 0) INTO resultado
    FROM licitaciones
    WHERE fecha_cierre >= now();
  ELSIF p_modulo = 'compra-agil' THEN
    SELECT COALESCE(SUM(monto), 0) INTO resultado
    FROM compra_agil
    WHERE fecha_creacion >= (now() - interval '7 days');
  ELSIF p_modulo = 'ordenes-compra' THEN
    SELECT COALESCE(SUM(monto_total), 0) INTO resultado
    FROM ordenes_compra;
  ELSE
    RAISE EXCEPTION 'Módulo no soportado: %', p_modulo;
  END IF;

  RETURN resultado;
END;
$$;
