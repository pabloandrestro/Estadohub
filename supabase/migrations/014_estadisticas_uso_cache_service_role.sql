-- =====================================================================
-- 014 · Permite que el service role lea las RPCs de estadísticas de uso
-- =====================================================================
-- La página /dashboard/admin/estadisticas ahora sirve los datos desde una
-- caché de 5 minutos calculada con el service role (sin cookies de usuario).
-- Las RPCs de la migración 013 filtran por `public.es_admin()`, que con el
-- service role da falso (auth.uid() es NULL) → devolvían cero filas.
--
-- Se ajusta la guarda a: es admin autenticado  O  contexto de servidor
-- (auth.uid() IS NULL). Sigue siendo seguro porque el EXECUTE está concedido
-- solo a `authenticated` y `service_role`, nunca a `anon`; y un usuario
-- `authenticated` no-admin siempre tiene auth.uid() → sigue recibiendo 0 filas.

CREATE OR REPLACE FUNCTION public.uso_por_dia(dias int DEFAULT 30)
RETURNS TABLE (dia date, eventos bigint, usuarios_unicos bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT date_trunc('day', creado_en)::date        AS dia,
         count(*)::bigint                           AS eventos,
         count(DISTINCT usuario_id)::bigint         AS usuarios_unicos
  FROM public.eventos_uso
  WHERE (public.es_admin() OR auth.uid() IS NULL)
    AND creado_en >= (now() - make_interval(days => dias))
  GROUP BY 1
  ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.uso_por_pais(dias int DEFAULT 30)
RETURNS TABLE (pais text, eventos bigint, usuarios_unicos bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(NULLIF(pais, ''), 'XX')           AS pais,
         count(*)::bigint                           AS eventos,
         count(DISTINCT usuario_id)::bigint         AS usuarios_unicos
  FROM public.eventos_uso
  WHERE (public.es_admin() OR auth.uid() IS NULL)
    AND creado_en >= (now() - make_interval(days => dias))
  GROUP BY 1
  ORDER BY 2 DESC;
$$;

CREATE OR REPLACE FUNCTION public.uso_por_ruta(dias int DEFAULT 30, limite int DEFAULT 15)
RETURNS TABLE (ruta text, eventos bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT COALESCE(NULLIF(ruta, ''), '(desconocida)') AS ruta,
         count(*)::bigint                            AS eventos
  FROM public.eventos_uso
  WHERE (public.es_admin() OR auth.uid() IS NULL)
    AND creado_en >= (now() - make_interval(days => dias))
  GROUP BY 1
  ORDER BY 2 DESC
  LIMIT limite;
$$;

CREATE OR REPLACE FUNCTION public.uso_resumen(dias int DEFAULT 30)
RETURNS TABLE (
  total_eventos    bigint,
  usuarios_activos bigint,
  paises           bigint,
  eventos_hoy      bigint
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT
    count(*)::bigint,
    count(DISTINCT usuario_id)::bigint,
    count(DISTINCT NULLIF(pais, ''))::bigint,
    count(*) FILTER (WHERE creado_en >= date_trunc('day', now()))::bigint
  FROM public.eventos_uso
  WHERE (public.es_admin() OR auth.uid() IS NULL)
    AND creado_en >= (now() - make_interval(days => dias));
$$;

-- Estas RPCs ahora solo las consume la capa de caché del servidor (service role).
-- Se retira el acceso de anon / authenticated / PUBLIC para que ningún cliente
-- pueda leer las estadísticas agregadas directamente: con la guarda relajada
-- (`OR auth.uid() IS NULL`), un `anon` con el grant por defecto de PUBLIC
-- habría podido consultarlas.
REVOKE EXECUTE ON FUNCTION public.uso_por_dia(int)       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.uso_por_pais(int)      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.uso_por_ruta(int, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.uso_resumen(int)       FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.uso_por_dia(int)       TO service_role;
GRANT EXECUTE ON FUNCTION public.uso_por_pais(int)      TO service_role;
GRANT EXECUTE ON FUNCTION public.uso_por_ruta(int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.uso_resumen(int)       TO service_role;
