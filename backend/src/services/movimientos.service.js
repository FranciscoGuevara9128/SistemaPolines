import { supabase } from '../config/supabase.js';

// ─────────────────────────────────────────────────────────────
// REGISTRAR ENTREGA
// ─────────────────────────────────────────────────────────────
export const registrarEntrega = async ({ cliente_directo_id, tipo_polin_id, color_polin_id, cantidad }) => {
  const { data: inv, error: invGetError } = await supabase
    .from('inventario')
    .select('*')
    .eq('tipo_polin_id', tipo_polin_id)
    .eq('color_polin_id', color_polin_id)
    .single();

  if (invGetError) throw new Error('No se encontró inventario para el tipo/color indicado.');
  if (inv.cantidad_disponible < cantidad) throw new Error('Inventario insuficiente.');

  const { data: movimiento, error: movError } = await supabase
    .from('movimiento_polines')
    .insert([{
      cliente_directo_id,
      tipo_polin_id,
      color_polin_id,
      cantidad,
      cantidad_restante: cantidad,
      tipo_movimiento: 'ENTREGA',
      estado_uso: 'ALMACENAMIENTO',
      fecha_inicio: new Date().toISOString()
    }])
    .select()
    .single();

  if (movError) throw new Error(movError.message);

  const { error: invUpdError } = await supabase
    .from('inventario')
    .update({ cantidad_disponible: inv.cantidad_disponible - cantidad })
    .eq('id', inv.id);

  if (invUpdError) throw new Error(invUpdError.message);

  return movimiento;
};

// ─────────────────────────────────────────────────────────────
// ENVIAR A TRANSPORTE (Modelo Híbrido + Trazabilidad)
//
// FIX: El constraint chk_padre_envio prohíbe tipo_movimiento='ENVIO'
// con movimiento_origen_id. Usamos tipo_movimiento='ENTREGA' en el
// movimiento hijo, diferenciado por estado_uso='TRANSPORTE' y
// movimiento_origen_id seteado.
// ─────────────────────────────────────────────────────────────
export const enviarTransporte = async ({ cliente_directo_id, tipo_polin_id, color_polin_id, cliente_final_id, cantidad_enviada }) => {
  if (!cliente_final_id) throw new Error('cliente_final_id es obligatorio.');
  if (!cliente_directo_id || !tipo_polin_id || !color_polin_id) throw new Error('Debe especificar el origen completo.');
  if (!cantidad_enviada || cantidad_enviada <= 0) throw new Error('cantidad_enviada debe ser mayor a 0.');

  // Obtener todos los lotes activos de ALMACENAMIENTO para este subgrupo, orden LIFO (fecha descendente)
  const { data: lotes, error: errGet } = await supabase
    .from('movimiento_polines')
    .select('*')
    .eq('cliente_directo_id', cliente_directo_id)
    .eq('tipo_polin_id', tipo_polin_id)
    .eq('color_polin_id', color_polin_id)
    .eq('estado_uso', 'ALMACENAMIENTO')
    .is('fecha_fin', null)
    .order('fecha_inicio', { ascending: false });

  if (errGet) throw new Error(errGet.message);

  let cantidad_restante_por_enviar = parseInt(cantidad_enviada, 10);
  const lotes_disponibles = lotes || [];

  const totalDisponible = lotes_disponibles.reduce((sum, lote) => sum + (lote.cantidad_restante ?? lote.cantidad), 0);
  if (cantidad_restante_por_enviar > totalDisponible) {
    throw new Error(`Cantidad a enviar (${cantidad_restante_por_enviar}) supera la disponible en almacén (${totalDisponible}).`);
  }

  const ahora = new Date().toISOString();
  const movimientos_hijos = [];

  for (const lote of lotes_disponibles) {
    if (cantidad_restante_por_enviar <= 0) break;

    const disponible = lote.cantidad_restante ?? lote.cantidad;
    const aDescontar = Math.min(disponible, cantidad_restante_por_enviar);
    const nuevaRestante = disponible - aDescontar;

    // Actualizar lote origen
    const updatePayload = { cantidad_restante: nuevaRestante };
    if (nuevaRestante === 0) updatePayload.fecha_fin = ahora;

    const { error: errUpd } = await supabase
      .from('movimiento_polines')
      .update(updatePayload)
      .eq('id', lote.id);

    if (errUpd) throw new Error(errUpd.message);

    // Crear movimiento hijo
    const { data: movHijo, error: errIns } = await supabase
      .from('movimiento_polines')
      .insert([{
        cliente_directo_id,
        cliente_final_id,
        tipo_polin_id,
        color_polin_id,
        cantidad: aDescontar,
        cantidad_restante: aDescontar,
        tipo_movimiento: 'ENTREGA',      // <-- FIX: evita chk_padre_envio
        estado_uso: 'TRANSPORTE',
        movimiento_origen_id: lote.id,
        fecha_inicio: ahora
      }])
      .select()
      .single();

    if (errIns) throw new Error(errIns.message);

    movimientos_hijos.push(movHijo);
    cantidad_restante_por_enviar -= aDescontar;
  }

  return {
    movimientos_hijos,
    trazabilidad: `Distribuidos en ${movimientos_hijos.length} lotes de origen.`,
    restante_en_origen: totalDisponible - cantidad_enviada
  };
};

// ─────────────────────────────────────────────────────────────
// LIBERAR POLINES (Liberación Libre + Parcial)
//
// - Funciona en cualquier estado activo (ALMACENAMIENTO o TRANSPORTE).
// - Si cantidad_liberar < cantidad_restante: liberación parcial.
//   Se reduce cantidad_restante pero el movimiento permanece abierto.
// - Si cantidad_liberar >= cantidad_restante (o no se especifica):
//   liberación total, se cierra el movimiento con fecha_fin.
// ─────────────────────────────────────────────────────────────
export const liberarPolines = async ({ id_movimiento, cantidad_liberar }) => {
  const { data: mov, error: errGet } = await supabase
    .from('movimiento_polines')
    .select('*')
    .eq('id', id_movimiento)
    .is('fecha_fin', null)
    .single();

  if (errGet) throw new Error('Movimiento no encontrado o ya fue liberado.');

  const disponible = mov.cantidad_restante ?? mov.cantidad;
  const aLiberar = cantidad_liberar ? parseInt(cantidad_liberar, 10) : disponible;

  if (aLiberar <= 0) throw new Error('La cantidad a liberar debe ser mayor a 0.');
  if (aLiberar > disponible) {
    throw new Error(`Cantidad a liberar (${aLiberar}) supera la disponible (${disponible}).`);
  }

  const ahora = new Date().toISOString();
  const nuevaRestante = disponible - aLiberar;
  const esTotal = nuevaRestante === 0;

  // 1. Actualizar movimiento
  const updatePayload = { cantidad_restante: nuevaRestante };
  if (esTotal) updatePayload.fecha_fin = ahora;

  const { error: errUpd } = await supabase
    .from('movimiento_polines')
    .update(updatePayload)
    .eq('id', id_movimiento);

  if (errUpd) throw new Error(errUpd.message);

  // 2. Devolver cantidad al inventario global
  const { data: inv, error: invGetError } = await supabase
    .from('inventario')
    .select('*')
    .eq('tipo_polin_id', mov.tipo_polin_id)
    .eq('color_polin_id', mov.color_polin_id)
    .single();

  if (!invGetError && inv) {
    await supabase
      .from('inventario')
      .update({ cantidad_disponible: inv.cantidad_disponible + aLiberar })
      .eq('id', inv.id);
  }

  return {
    success: true,
    parcial: !esTotal,
    cantidad_liberada: aLiberar,
    cantidad_restante: nuevaRestante,
    estado_previo: mov.estado_uso,
    message: esTotal
      ? `Liberación total completada (${mov.estado_uso}).`
      : `Liberación parcial: ${aLiberar} liberadas, ${nuevaRestante} permanecen activas.`
  };
};
