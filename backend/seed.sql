-- Script de semilla (Seed) actualizado
-- Limpieza de Base de Datos
TRUNCATE TABLE detalle_facturacion, facturacion, tarifa, inventario, movimiento_polines, color_polin, tipo_polin, cliente_final, cliente_directo RESTART IDENTITY CASCADE;

-- 2. Insertar Clientes Directos (UUIDs Hexadecimales)
INSERT INTO cliente_directo (id, nombre, contacto, telefono, email, activo) VALUES
('c0000000-0000-0000-0000-000000000001', 'Aceitera Real', 'Sr. Gomez', '555-1234', 'alfa@ejemplo.com', true),
('c0000000-0000-0000-0000-000000000002', 'Arroz Faisan', 'Sra. Perez', '555-4321', 'beta@ejemplo.com', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Insertar Clientes Finales 
INSERT INTO cliente_final (id, nombre, ubicacion, cliente_directo_id) VALUES
('f0000000-0000-0000-0000-000000000001', 'Supermercado La Policia', 'Centro', 'c0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000002', 'Wallmart', 'Altagracia', 'c0000000-0000-0000-0000-000000000001'),
('f0000000-0000-0000-0000-000000000003', 'Supermercado La Colonia', 'Rubenia', 'c0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;

-- 4. Insertar Tipos y Colores de Polines (Usando 'a' y 'b' que son caracteres hex válidos)
INSERT INTO tipo_polin (id, nombre, descripcion) VALUES
('a0000000-0000-0000-0000-000000000001', 'Madera 3 Metros', 'Polín de madera curada de 3m'),
('a0000000-0000-0000-0000-000000000002', 'Metálico 4 Metros', 'Polín metálico reforzado de 4m')
ON CONFLICT (id) DO NOTHING;

INSERT INTO color_polin (id, nombre) VALUES
('b0000000-0000-0000-0000-000000000001', 'Rojo'),
('b0000000-0000-0000-0000-000000000002', 'Amarillo'),
('b0000000-0000-0000-0000-000000000003', 'Azul')
ON CONFLICT (id) DO NOTHING;

-- 5. Insertar Inventario Inicial
INSERT INTO inventario (tipo_polin_id, color_polin_id, cantidad_total, cantidad_disponible) VALUES
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 1000, 850),
('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 2000, 1700);

-- 6. Insertar Tarifas
INSERT INTO tarifa (tipo, precio_por_dia, activo) VALUES
('ALMACENAMIENTO', 1.00, true),
('TRANSPORTE', 0.80, true);

-- 7. Insertar Movimientos de Prueba
INSERT INTO movimiento_polines (cliente_directo_id, tipo_polin_id, color_polin_id, cantidad, tipo_movimiento, estado_uso, fecha_inicio) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 150, 'ENTREGA', 'ALMACENAMIENTO', NOW() - INTERVAL '15 days'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 300, 'ENTREGA', 'ALMACENAMIENTO', NOW() - INTERVAL '5 days');
