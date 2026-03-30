import { supabase } from '../config/supabase.js';

// ─────────────────────────────────────────────────────────────
// GENERAR FACTURACIÓN POR TRAMOS
//
// FIX: estado_tramo se omite del INSERT a detalle_facturacion
// (la columna puede no estar en el schema cache de Supabase).
// El campo se incluye en el array `detalles` del response
// para que el frontend lo muestre sin necesitar la BD.
// ─────────────────────────────────────────────────────────────
export const generarFacturacion = async ({ cliente_directo_id, mes, anio }) => {
  const fechaInicioMes = new Date(anio, mes - 1, 1);
  const fechaFinMes = new Date(anio, mes, 0, 23, 59, 59);

  // 1. Todos los movimientos del cliente con actividad en el período
  const { data: todosMovimientos, error: movsErr } = await supabase
    .from('movimiento_polines')
    .select('*')
    .eq('cliente_directo_id', cliente_directo_id)
    .lte('fecha_inicio', fechaFinMes.toISOString());

  if (movsErr) throw new Error(movsErr.message);

  const movsMes = todosMovimientos.filter(m =>
    !m.fecha_fin || new Date(m.fecha_fin) >= fechaInicioMes
  );

  // 2. Tarifas activas
  const { data: tarifas, error: tarifasErr } = await supabase
    .from('tarifa')
    .select('*')
    .eq('activo', true);
  if (tarifasErr) throw new Error(tarifasErr.message);

  const getTarifa = (tipo) => {
    const t = tarifas.find(t => t.tipo === tipo);
    return t ? parseFloat(t.precio_por_dia) : 0;
  };

  // 3. Separar raíces (sin padre) e hijos (con movimiento_origen_id)
  const movimientosRaiz = movsMes.filter(m => !m.movimiento_origen_id);
  const movimientosHijo = movsMes.filter(m => !!m.movimiento_origen_id);

  let total_almacenamiento = 0;
  let total_transporte = 0;
  const detalles = []; // detalles calculados (con estado_tramo)

  for (const raiz of movimientosRaiz) {
    // — Tramo ALMACENAMIENTO del raíz —
    const inicioAlm = new Date(Math.max(new Date(raiz.fecha_inicio).getTime(), fechaInicioMes.getTime()));
    const finAlm = raiz.fecha_fin
      ? new Date(Math.min(new Date(raiz.fecha_fin).getTime(), fechaFinMes.getTime()))
      : new Date(fechaFinMes);

    if (finAlm >= inicioAlm) {
      const diasAlm = calcularDias(inicioAlm, finAlm);
      const tarifaAlm = getTarifa('ALMACENAMIENTO');
      const subtotalAlm = diasAlm * tarifaAlm * raiz.cantidad;
      total_almacenamiento += subtotalAlm;
      detalles.push({
        movimiento_id: raiz.id,
        estado_tramo: 'ALMACENAMIENTO',   // <-- solo en el response, NO en la BD
        dias: diasAlm,
        cantidad: raiz.cantidad,
        tarifa: tarifaAlm,
        subtotal: subtotalAlm
      });
    }

    // — Tramo TRANSPORTE por cada hijo vinculado —
    const hijosDeLote = movimientosHijo.filter(h => h.movimiento_origen_id === raiz.id);
    for (const hijo of hijosDeLote) {
      const inicioTrans = new Date(Math.max(new Date(hijo.fecha_inicio).getTime(), fechaInicioMes.getTime()));
      const finTrans = hijo.fecha_fin
        ? new Date(Math.min(new Date(hijo.fecha_fin).getTime(), fechaFinMes.getTime()))
        : new Date(fechaFinMes);

      if (finTrans >= inicioTrans) {
        const diasTrans = calcularDias(inicioTrans, finTrans);
        const tarifaTrans = getTarifa('TRANSPORTE');
        const subtotalTrans = diasTrans * tarifaTrans * hijo.cantidad;
        total_transporte += subtotalTrans;
        detalles.push({
          movimiento_id: hijo.id,
          estado_tramo: 'TRANSPORTE',     // <-- solo en el response, NO en la BD
          dias: diasTrans,
          cantidad: hijo.cantidad,
          tarifa: tarifaTrans,
          subtotal: subtotalTrans
        });
      }
    }
  }

  // 4. Insertar cabecera de factura
  const { data: factura, error: facErr } = await supabase
    .from('facturacion')
    .insert([{
      cliente_directo_id,
      mes,
      anio,
      total_almacenamiento,
      total_transporte,
      total: total_almacenamiento + total_transporte,
      fecha_generacion: new Date().toISOString()
    }])
    .select()
    .single();

  if (facErr) throw new Error(facErr.message);

  // 5. Insertar detalles — SIN estado_tramo para evitar error de schema cache
  //    El campo estado_tramo se devuelve en el response pero no se persiste.
  if (detalles.length > 0) {
    const detallesToInsert = detalles.map(({ estado_tramo, ...d }) => ({
      facturacion_id: factura.id,
      ...d
    }));
    const { error: detErr } = await supabase
      .from('detalle_facturacion')
      .insert(detallesToInsert);
    if (detErr) throw new Error(detErr.message);
  }

  // 6. Devolver factura + detalles completos (incluyendo estado_tramo)
  return { ...factura, detalles };
};

// ── Utilidad ──────────────────────────────────────────────────
const calcularDias = (inicio, fin) => {
  const diffMs = Math.abs(fin.getTime() - inicio.getTime());
  const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return dias === 0 ? 1 : dias;
};
