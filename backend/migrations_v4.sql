-- ==============================================================================
-- MIGRACIÓN V4: Pull Fijo, Recepción y Relación Clientes
-- EJECUTAR EN SUPABASE SQL EDITOR
-- ==============================================================================

-- 1. NUEVAS TARIFAS
INSERT INTO tarifa (tipo, precio_por_dia, activo) VALUES
  ('PULL_FIJO', 1.20, true),
  ('SINIESTRO', 10.00, true)
ON CONFLICT (tipo) DO NOTHING;

-- 2. AJUSTES EN MOVIMIENTO_POLINES
-- Eliminar la restricción de estado_uso si existe, o asegurarse que PULL_FIJO sea aceptado.
-- (Supabase normalmente usa TEXT sin CHECK en la DB, pero por precaución:)
ALTER TABLE movimiento_polines DROP CONSTRAINT IF EXISTS chk_estado_uso;
ALTER TABLE movimiento_polines
  ADD CONSTRAINT chk_estado_uso CHECK (estado_uso IN ('ALMACENAMIENTO', 'TRANSPORTE', 'PULL_FIJO'));

ALTER TABLE movimiento_polines 
  ADD COLUMN IF NOT EXISTS costo_entrega NUMERIC(12,6) DEFAULT 0;

-- 3. RECEPCIÓN DE POLINES
CREATE TABLE IF NOT EXISTS recepcion_polines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movimiento_origen_id uuid REFERENCES movimiento_polines(id) ON DELETE CASCADE,
  cantidad_liberada integer NOT NULL CHECK (cantidad_liberada > 0),
  cantidad_buenos integer DEFAULT 0,
  cantidad_siniestrados integer DEFAULT 0,
  estado_recepcion text NOT NULL DEFAULT 'PENDIENTE' CHECK (estado_recepcion IN ('PENDIENTE', 'RECIBIDO')),
  fecha_liberacion timestamptz DEFAULT now(),
  fecha_recepcion timestamptz
);

-- 4. NUEVA RELACIÓN CLIENTE DIRECTO - CLIENTE FINAL
-- Crear tabla intermedia
CREATE TABLE IF NOT EXISTS rel_cliente_directo_final (
  cliente_directo_id uuid REFERENCES cliente_directo(id) ON DELETE CASCADE,
  cliente_final_id uuid REFERENCES cliente_final(id) ON DELETE CASCADE,
  PRIMARY KEY (cliente_directo_id, cliente_final_id)
);

-- Migrar las relaciones existentes ANTES de eliminar la columna
INSERT INTO rel_cliente_directo_final (cliente_directo_id, cliente_final_id)
SELECT cliente_directo_id, id FROM cliente_final
WHERE cliente_directo_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Eliminar columna cliente_directo_id de cliente_final
ALTER TABLE cliente_final DROP COLUMN IF EXISTS cliente_directo_id;

-- 5. SINIESTROS MENSUALES (Para Facturación Opcional Expresa, 
-- pero usaremos recepcion_polines cerrado para sumar facturación)
-- No crearemos tabla extra para siniestros; facturaremos directo de recepcion_polines.

-- === RESUMEN OK ===
SELECT 'Migración Completada Exitosamente' as resultado;
