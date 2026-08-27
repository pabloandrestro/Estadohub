-- =====================================================================
-- 013 · Roles de usuario + Estadísticas de uso (sección solo-admin)
-- =====================================================================

-- ── 1. Rol en la tabla de usuarios ───────────────────────────────────
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS rol TEXT NOT NULL DEFAULT 'usuario';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_rol_check'
  ) THEN
    ALTER TABLE public.usuarios
      ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('usuario', 'admin'));
  END IF;
END $$;

-- ── 2. Helper: ¿el usuario actual es admin? ──────────────────────────
-- SECURITY DEFINER → corre como owner y se salta el RLS de `usuarios`,
-- lo que evita recursión infinita al usarlo dentro de sus propias policies.
CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.es_admin() TO anon, authenticated;

-- ── 3. Anti-escalada de privilegios ─────────────────────────────────
-- El cliente hace `usuarios.upsert(...)` bajo la policy UPDATE (auth.uid() = id).
-- Sin esto, cualquiera podría mandarse `rol = 'admin'`. Congelamos la columna
-- `rol` salvo que quien edita sea admin, o un contexto de servidor
-- (service role / SQL Editor, donde auth.uid() es NULL).
CREATE OR REPLACE FUNCTION public.proteger_rol()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.es_admin() THEN
    IF TG_OP = 'INSERT' THEN
      NEW.rol := 'usuario';
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.rol := OLD.rol;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_rol ON public.usuarios;
CREATE TRIGGER trg_proteger_rol
  BEFORE INSERT OR UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.proteger_rol();

-- ── 4. Policy extra: el admin ve/edita todas las filas de usuarios ───
DROP POLICY IF EXISTS "usuarios_admin_todo" ON public.usuarios;
CREATE POLICY "usuarios_admin_todo" ON public.usuarios
  FOR ALL
  USING (public.es_admin())
  WITH CHECK (public.es_admin());

-- ── 5. Tabla de eventos de uso ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.eventos_uso (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id  UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ruta        TEXT,
  pais        TEXT,          -- ISO 3166-1 alpha-2 (ej. 'CL'), desde cabeceras de Vercel
  ciudad      TEXT,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_uso_creado  ON public.eventos_uso (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_uso_pais    ON public.eventos_uso (pais);
CREATE INDEX IF NOT EXISTS idx_eventos_uso_usuario ON public.eventos_uso (usuario_id);

ALTER TABLE public.eventos_uso ENABLE ROW LEVEL SECURITY;

-- Solo el admin puede leer. La inserción la hace /api/track con el service role
-- (que se salta el RLS), por eso NO hay policy de INSERT: nadie escribe con la
-- anon key desde el navegador.
DROP POLICY IF EXISTS "eventos_uso_admin_select" ON public.eventos_uso;
CREATE POLICY "eventos_uso_admin_select" ON public.eventos_uso
  FOR SELECT USING (public.es_admin());

-- ── 6. RPCs de agregación (solo-admin) ─────────────────────────────
-- Son SECURITY DEFINER (se saltan RLS), así que TODAS filtran por es_admin():
-- un no-admin recibe cero filas.

CREATE OR REPLACE FUNCTION public.uso_por_dia(dias int DEFAULT 30)
RETURNS TABLE (dia date, eventos bigint, usuarios_unicos bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT date_trunc('day', creado_en)::date        AS dia,
         count(*)::bigint                           AS eventos,
         count(DISTINCT usuario_id)::bigint         AS usuarios_unicos
  FROM public.eventos_uso
  WHERE public.es_admin()
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
  WHERE public.es_admin()
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
  WHERE public.es_admin()
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
  WHERE public.es_admin()
    AND creado_en >= (now() - make_interval(days => dias));
$$;

GRANT EXECUTE ON FUNCTION public.uso_por_dia(int)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.uso_por_pais(int)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.uso_por_ruta(int, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.uso_resumen(int)       TO authenticated;

-- ── 7. Bootstrap del primer admin ─────────────────────────────────
-- Ejecutar UNA VEZ en el SQL Editor de Supabase, después de haber iniciado
-- sesión al menos una vez (para que exista la fila en public.usuarios):
--
--   UPDATE public.usuarios SET rol = 'admin' WHERE email = 'TU_CORREO@gmail.com';
