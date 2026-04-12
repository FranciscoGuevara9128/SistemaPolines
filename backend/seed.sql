-- ═══════════════════════════════════════════════════════════════
-- SEED v3 — Sistema de Polines
-- Cubre todos los módulos: entregas, transporte híbrido,
-- trazabilidad, liberaciones parciales y facturación por tramos.
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 0. MIGRACIONES SEGURAS (idempotentes)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE movimiento_polines
  ADD COLUMN IF NOT EXISTS movimiento_origen_id uuid REFERENCES movimiento_polines(id),
  ADD COLUMN IF NOT EXISTS cantidad_restante integer;

ALTER TABLE detalle_facturacion
  ADD COLUMN IF NOT EXISTS estado_tramo text;

-- ─────────────────────────────────────────────────────────────
-- 1. LIMPIAR DATOS
-- ─────────────────────────────────────────────────────────────
TRUNCATE TABLE
  detalle_facturacion, facturacion, tarifa, inventario,
  movimiento_polines, color_polin, tipo_polin,
  cliente_final, cliente_directo
RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────────────────────────
-- 2. CATÁLOGOS BASE
-- ─────────────────────────────────────────────────────────────

-- Tipos de Polín
INSERT INTO tipo_polin (id, nombre, descripcion) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Madera 3 Metros',   'Polín de madera curada, largo 3m')
ON CONFLICT (id) DO NOTHING;

-- Colores
INSERT INTO color_polin (id, nombre) VALUES
  ('b0000000-0000-0000-0000-000000000002', 'Amarillo')
ON CONFLICT (id) DO NOTHING;

-- Tarifas (una por estado de uso)
INSERT INTO tarifa (tipo, precio_por_dia, activo) VALUES
  ('ALMACENAMIENTO', 0.02580645161, true),
  ('TRANSPORTE',     0.03225806451, true),
  ('PULL_FIJO',      0.0193548387, true),
  ('SINIESTRO',     10.00, true);

-- ─────────────────────────────────────────────────────────────
-- 3. CLIENTES
-- ─────────────────────────────────────────────────────────────

-- Clientes Directos (empresas facturadas)
INSERT INTO cliente_directo (id, nombre, contacto, telefono, email, activo) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Aceitera Real',    'Carlos Gómez',  '2222-1234', 'cgomez@aceitera.com',   true),
  ('c0000000-0000-0000-0000-000000000002', 'Arroz Faisan',     'María Pérez',   '2222-4321', 'mperez@faisan.com',     true),
  ('c0000000-0000-0000-0000-000000000003', 'La Perfecta S.A.', 'Jorge Méndez',  '2222-5678', 'jmendez@perfecta.com',  true)
ON CONFLICT (id) DO NOTHING;

-- Clientes Finales (destinos de entrega) sin cliente_directo_id
INSERT INTO cliente_final (id, nombre, ubicacion) VALUES
  -- Clientes finales de Aceitera Real
  ('f0000000-0000-0000-0000-000000000001', 'CEDIS Grupo Mantica',  'Altamira'),
  ('f0000000-0000-0000-0000-000000000002', 'CEDIS Walmart',    'Carretera a Masaya')
ON CONFLICT (id) DO NOTHING;

-- Tabla intermedia: rel_cliente_directo_final
INSERT INTO rel_cliente_directo_final (cliente_directo_id, cliente_final_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000002');

-- ─────────────────────────────────────────────────────────────
-- 4. INVENTARIO
-- Cantidad disponible = total - lo que está activo en campo.
-- Ver resumen contable al final del archivo.
-- ─────────────────────────────────────────────────────────────
INSERT INTO inventario (tipo_polin_id, color_polin_id, cantidad_total, cantidad_disponible) VALUES
  -- Madera/Amarillo: 5000 total.
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',  5000,  5000);