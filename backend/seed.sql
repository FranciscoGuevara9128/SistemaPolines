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
  ('a0000000-0000-0000-0000-000000000001', 'Madera 3 Metros',   'Polín de madera curada, largo 3m'),
  ('a0000000-0000-0000-0000-000000000002', 'Metálico 4 Metros', 'Polín metálico reforzado, largo 4m'),
  ('a0000000-0000-0000-0000-000000000003', 'Plástico 2.5 Metros','Polín plástico liviano, largo 2.5m')
ON CONFLICT (id) DO NOTHING;

-- Colores
INSERT INTO color_polin (id, nombre) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Rojo'),
  ('b0000000-0000-0000-0000-000000000002', 'Amarillo'),
  ('b0000000-0000-0000-0000-000000000003', 'Azul')
ON CONFLICT (id) DO NOTHING;

-- Tarifas (una por estado de uso)
INSERT INTO tarifa (tipo, precio_por_dia, activo) VALUES
  ('ALMACENAMIENTO', 1.00, true),
  ('TRANSPORTE',     0.80, true),
  ('PULL_FIJO',      1.20, true),
  ('SINIESTRO',     10.00, true)
ON CONFLICT (tipo) DO NOTHING;

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
  ('f0000000-0000-0000-0000-000000000001', 'Supermercado La Colonia',  'Altamira'),
  ('f0000000-0000-0000-0000-000000000002', 'Walmart Managua',          'Carretera a Masaya'),
  -- Clientes finales de Arroz Faisan
  ('f0000000-0000-0000-0000-000000000003', 'Pali Mercado Central',     'Centro'),
  -- Clientes finales de La Perfecta
  ('f0000000-0000-0000-0000-000000000004', 'La Union Metrocentro',     'Metrocentro'),
  ('f0000000-0000-0000-0000-000000000005', 'MaxiPali Las Mercedes',    'Las Mercedes')
ON CONFLICT (id) DO NOTHING;

-- Tabla intermedia: rel_cliente_directo_final
INSERT INTO rel_cliente_directo_final (cliente_directo_id, cliente_final_id) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001'),
  ('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002'),
  ('c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000003'),
  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000004'),
  ('c0000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 4. INVENTARIO
-- Cantidad disponible = total - lo que está activo en campo.
-- Ver resumen contable al final del archivo.
-- ─────────────────────────────────────────────────────────────
INSERT INTO inventario (tipo_polin_id, color_polin_id, cantidad_total, cantidad_disponible) VALUES
  -- Madera/Rojo: 1000 total.  En campo: 200 (mov-A) + 80 (mov-C cerrado; ya retornaron al cierre de E1).
  -- Activo en campo: 200 alm + 150 trans = 350. Disponible: 1000 - 350 = 650
  ('a0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000001', 1000, 650),
  -- Metálico/Azul: 2000 total.  En campo: 300 (mov-D). Disponible: 2000 - 300 = 1700
  ('a0000000-0000-0000-0000-000000000002','b0000000-0000-0000-0000-000000000003', 2000, 1700),
  -- Plástico/Amarillo: 500 total.  En campo: 120 (mov-F) + 60 (mov-G parcial).  Disponible: 500 - 180 = 320
  ('a0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000002',  500,  320);

-- ═══════════════════════════════════════════════════════════════
-- 5. MOVIMIENTOS DE PRUEBA
--
-- LEYENDA DE IDs:
--   mov-A  = m...001  Aceitera / Madera Rojo  → ENTREGA raíz, HÍBRIDO (100 alm. + 100 trans.)
--   mov-A1 = m...002  Hijo de A               → 100 en TRANSPORTE a Colonia
--   mov-B  = m...003  Aceitera / Madera Rojo  → ENTREGA raíz, COMPLETA a transporte (cerrada)
--   mov-B1 = m...004  Hijo de B               → 150 en TRANSPORTE a Walmart (activo)
--   mov-D  = m...005  Arroz / Metálico Azul   → ENTREGA raíz, solo ALMACENAMIENTO
--   mov-F  = m...006  La Perfecta / Plástico   → ENTREGA raíz, solo ALMACENAMIENTO
--   mov-G  = m...007  La Perfecta / Plástico   → ENTREGA raíz, liberación parcial ya hecha
--   mov-G1 = m...008  Hijo de G               → 60 en TRANSPORTE a MaxiPali
--
-- NOTA: tipo_movimiento = 'ENTREGA' en todos para cumplir chk_padre_envio.
--       Los movimientos TRANSPORTE se distinguen por estado_uso = 'TRANSPORTE'
--       y movimiento_origen_id != NULL.
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ACEITERA REAL — Escenario Híbrido
-- 200 polines entregados hace 28 días.
-- 100 se enviaron a transporte hace 12 días (PARCIAL).
-- 100 quedan en almacenamiento.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- mov-A: Raíz ALMACENAMIENTO (200 originales, 100 restantes por envío parcial)
INSERT INTO movimiento_polines
  (id, cliente_directo_id, tipo_polin_id, color_polin_id,
   cantidad, cantidad_restante, tipo_movimiento, estado_uso, fecha_inicio)
VALUES (
  'e0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  200, 100,                      -- original 200, restante 100
  'ENTREGA', 'ALMACENAMIENTO',
  NOW() - INTERVAL '28 days'
);

-- mov-A1: Hijo de mov-A → 100 en transporte a Supermercado La Colonia
INSERT INTO movimiento_polines
  (id, cliente_directo_id, cliente_final_id, tipo_polin_id, color_polin_id,
   cantidad, cantidad_restante, tipo_movimiento, estado_uso,
   movimiento_origen_id, fecha_inicio)
VALUES (
  'e0000000-0000-0000-0000-000000000002',
  'c0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000001',   -- La Colonia
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  100, 100,                      -- 100 polines en transporte
  'ENTREGA', 'TRANSPORTE',
  'e0000000-0000-0000-0000-000000000001',   -- trazabilidad: hijo de mov-A
  NOW() - INTERVAL '12 days'
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ACEITERA REAL — Escenario Envío Total (lote cerrado)
-- 150 polines entregados hace 35 días.
-- Lote completo enviado a Walmart hace 20 días.
-- El origen quedó cerrado (fecha_fin), el hijo sigue activo.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- mov-B: Raíz CERRADA (lote agotado en envío total)
INSERT INTO movimiento_polines
  (id, cliente_directo_id, tipo_polin_id, color_polin_id,
   cantidad, cantidad_restante, tipo_movimiento, estado_uso,
   fecha_inicio, fecha_fin)
VALUES (
  'e0000000-0000-0000-0000-000000000003',
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  150, 0,                        -- 0 restante: lote agotado
  'ENTREGA', 'ALMACENAMIENTO',
  NOW() - INTERVAL '35 days',
  NOW() - INTERVAL '20 days'     -- cerrado cuando se envió todo
);

-- mov-B1: Hijo de mov-B → 150 en transporte a Walmart (aún activo en campo)
INSERT INTO movimiento_polines
  (id, cliente_directo_id, cliente_final_id, tipo_polin_id, color_polin_id,
   cantidad, cantidad_restante, tipo_movimiento, estado_uso,
   movimiento_origen_id, fecha_inicio)
VALUES (
  'e0000000-0000-0000-0000-000000000004',
  'c0000000-0000-0000-0000-000000000001',
  'f0000000-0000-0000-0000-000000000002',   -- Walmart
  'a0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  150, 150,
  'ENTREGA', 'TRANSPORTE',
  'e0000000-0000-0000-0000-000000000003',   -- hijo de mov-B
  NOW() - INTERVAL '20 days'
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ARROZ FAISAN — Solo Almacenamiento
-- 300 polines entregados hace 6 días, sin envíos aún.
-- Disponibles para enviar a transporte.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- mov-D: Raíz activa, lote completo en almacenamiento
INSERT INTO movimiento_polines
  (id, cliente_directo_id, tipo_polin_id, color_polin_id,
   cantidad, cantidad_restante, tipo_movimiento, estado_uso, fecha_inicio)
VALUES (
  'e0000000-0000-0000-0000-000000000005',
  'c0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  300, 300,
  'ENTREGA', 'ALMACENAMIENTO',
  NOW() - INTERVAL '6 days'
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- LA PERFECTA — Solo Almacenamiento
-- 120 polines entregados hace 14 días, sin movimiento.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- mov-F: Solo en almacenamiento, disponible para envío
INSERT INTO movimiento_polines
  (id, cliente_directo_id, tipo_polin_id, color_polin_id,
   cantidad, cantidad_restante, tipo_movimiento, estado_uso, fecha_inicio)
VALUES (
  'e0000000-0000-0000-0000-000000000006',
  'c0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000002',
  120, 120,
  'ENTREGA', 'ALMACENAMIENTO',
  NOW() - INTERVAL '14 days'
);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- LA PERFECTA — Liberación Parcial ya realizada
-- 100 polines entregados hace 18 días.
-- 40 fueron liberados hace 5 días (parcial → 60 quedan activos).
-- El resto (60) están en transporte a MaxiPali.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- mov-G: Raíz con liberación parcial aplicada (100 → 40 liberados, 60 restantes en alm)
INSERT INTO movimiento_polines
  (id, cliente_directo_id, tipo_polin_id, color_polin_id,
   cantidad, cantidad_restante, tipo_movimiento, estado_uso, fecha_inicio)
VALUES (
  'e0000000-0000-0000-0000-000000000007',
  'c0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000002',
  100, 60,                       -- 40 liberados parcialmente, 60 quedan activos
  'ENTREGA', 'ALMACENAMIENTO',
  NOW() - INTERVAL '18 days'
);

-- mov-G1: Hijo de mov-G → 60 enviados a MaxiPali (transporte activo)
INSERT INTO movimiento_polines
  (id, cliente_directo_id, cliente_final_id, tipo_polin_id, color_polin_id,
   cantidad, cantidad_restante, tipo_movimiento, estado_uso,
   movimiento_origen_id, fecha_inicio)
VALUES (
  'e0000000-0000-0000-0000-000000000008',
  'c0000000-0000-0000-0000-000000000003',
  'f0000000-0000-0000-0000-000000000005',   -- MaxiPali Las Mercedes
  'a0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000002',
  60, 60,
  'ENTREGA', 'TRANSPORTE',
  'e0000000-0000-0000-0000-000000000007',   -- hijo de mov-G
  NOW() - INTERVAL '8 days'
);

-- ─────────────────────────────────────────────────────────────
-- RESUMEN CONTABLE (referencia para verificar inventario)
-- ─────────────────────────────────────────────────────────────
-- Madera Rojo (1000 total):
--   Activos en campo: mov-A(100 alm) + mov-A1(100 trans) + mov-B1(150 trans) = 350
--   Disponible = 1000 - 350 = 650  ✓
--
-- Metálico Azul (2000 total):
--   Activos en campo: mov-D(300 alm) = 300
--   Disponible = 2000 - 300 = 1700  ✓
--
-- Plástico Amarillo (500 total):
--   Activos en campo: mov-F(120 alm) + mov-G(60 alm) + mov-G1(60 trans) = 240
--   Los 40 liberados de mov-G ya retornaron al inventario.
--   Disponible = 500 - 240 = 260  → ajustar a 260 ✓

-- (Corrección del disponible de Plástico/Amarillo)
UPDATE inventario
  SET cantidad_disponible = 260
  WHERE tipo_polin_id = 'a0000000-0000-0000-0000-000000000003'
    AND color_polin_id = 'b0000000-0000-0000-0000-000000000002';

-- ═══════════════════════════════════════════════════════════════
-- ESTADO ESPERADO EN EL DASHBOARD TRAS CORRER ESTE SEED
-- ─────────────────────────────────────────────────────────────
-- Aceitera Real:   Almacenamiento=100  | Transporte=250
-- Arroz Faisan:    Almacenamiento=300  | Transporte=0
-- La Perfecta:     Almacenamiento=180  | Transporte=60
-- ═══════════════════════════════════════════════════════════════
