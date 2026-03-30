import { supabase } from '../config/supabase.js';

export const generarFacturacion = async ({ cliente_directo_id, mes, anio }) => {
  const fechaInicioMes = new Date(anio, mes - 1, 1).toISOString();
  const fechaFinMes = new Date(anio, mes, 0, 23, 59, 59).toISOString();

  const { data: movimientos, error: movsErr } = await supabase
    .from('movimiento_polines')
    .select(`*`)
    .eq('cliente_directo_id', cliente_directo_id)
    .lte('fecha_inicio', fechaFinMes);

  if (movsErr) throw new Error(movsErr.message);

  const movsMes = movimientos.filter(m => !m.fecha_fin || m.fecha_fin >= fechaInicioMes);

  const { data: tarifas, error: tarifasErr } = await supabase.from('tarifa').select('*');
  if (tarifasErr) throw new Error(tarifasErr.message);

  let total_almacenamiento = 0;
  let total_transporte = 0;
  const detalles = [];

  for (const mov of movsMes) {
    const start = new Date(Math.max(new Date(mov.fecha_inicio).getTime(), new Date(fechaInicioMes).getTime()));
    const end = mov.fecha_fin ? new Date(Math.min(new Date(mov.fecha_fin).getTime(), new Date(fechaFinMes).getTime())) : new Date(fechaFinMes);
    
    const diffTime = Math.abs(end - start);
    let dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (dias === 0) dias = 1;

    const tarifaAplicable = tarifas.find(t => t.tipo === mov.estado_uso && t.activo !== false);
    const precio_por_dia = tarifaAplicable ? tarifaAplicable.precio_por_dia : 0;
    const subtotal = dias * (precio_por_dia * mov.cantidad);

    if (mov.estado_uso === 'ALMACENAMIENTO') {
      total_almacenamiento += subtotal;
    } else if (mov.estado_uso === 'TRANSPORTE') {
      total_transporte += subtotal;
    }

    detalles.push({
      movimiento_id: mov.id,
      dias: dias,
      cantidad: mov.cantidad,
      tarifa: precio_por_dia,
      subtotal: subtotal
    });
  }

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

  const detallesToInsert = detalles.map(d => ({
    facturacion_id: factura.id,
    ...d
  }));

  if (detallesToInsert.length > 0) {
    const { error: detErr } = await supabase.from('detalle_facturacion').insert(detallesToInsert);
    if (detErr) throw new Error(detErr.message);
  }

  return factura;
};

