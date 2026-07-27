CREATE TABLE IF NOT EXISTS remates (
  id          BIGSERIAL PRIMARY KEY,
  rol         TEXT UNIQUE NOT NULL,
  nombre_dueno TEXT,
  direccion   TEXT,
  comuna      TEXT,
  tribunal    TEXT,
  fecha_remate TIMESTAMP WITH TIME ZONE,
  monto_avaluo NUMERIC,
  monto_minimo NUMERIC,
  creado_en   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_remates_comuna ON remates(comuna);
CREATE INDEX IF NOT EXISTS idx_remates_fecha ON remates(fecha_remate); 