import { supabase } from '../config/supabase.js';

export const registrarEntrega = async ({ cliente_directo_id, tipo_polin_id, color_polin_id, cantidad }) => {
  // 1. Insertar movimiento
  const { data: movimiento, error: movError } = await supabase
    .from('movimiento_polines')
    .insert([
      {
        cliente_directo_id,
        tipo_polin_id,
        color_polin_id,
        cantidad,
        tipo_movimiento: 'ENTREGA',
        estado_uso: 'ALMACENAMIENTO',
        fecha_inicio: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (movError) throw new Error(movError.message);

  // 2. Disminuir inventario disponible
  // Buscamos el inventario actual
  const { data: inv, error: invGetError } = await supabase
    .from('inventario')
    .select('*')
    .eq('tipo_polin_id', tipo_polin_id)
    .eq('color_polin_id', color_polin_id)
    .single();

  if (invGetError) throw new Error(invGetError.message);
  
  if (inv.cantidad_disponible < cantidad) {
    throw new Error('Inventario insuficiente');
  }

  const { error: invUpdError } = await supabase
    .from('inventario')
    .update({ cantidad_disponible: inv.cantidad_disponible - cantidad })
    .eq('id', inv.id);

  if (invUpdError) throw new Error(invUpdError.message);

  return movimiento;
};

export const enviarTransporte = async ({ id_movimiento, cliente_final_id }) => {
  if (!cliente_final_id) throw new Error('cliente_final_id es obligatorio');

  // Actualizar movimiento a transporte o crear nuevo? 
  // Según requerimiento: "Inserta en movimiento_polines: tipo=ENVIO, estado=TRANSPORTE, cliente_final_id obligatorio"
  // Asumo que se crea un NUEVO registro de movimiento vinculado al original o se cierra el de almacenamiento.
  // Pero el doc dice "Inserta en movimiento_polines". Entonces cerramos el anterior y creamos nuevo.

  // 1. Obtener movimiento original
  const { data: movOriginal, error: errGet } = await supabase
    .from('movimiento_polines')
    .select('*')
    .eq('id', id_movimiento)
    .single();

  if (errGet) throw new Error(errGet.message);

  // Cerrar movimiento anterior (ALMACENAMIENTO)
  const ahora = new Date().toISOString();
  await supabase
    .from('movimiento_polines')
    .update({ fecha_fin: ahora })
    .eq('id', id_movimiento);

  // 2. Insertar nuevo movimiento
  const { data: nuevoMovimiento, error: errIns } = await supabase
    .from('movimiento_polines')
    .insert([
      {
        cliente_directo_id: movOriginal.cliente_directo_id,
        cliente_final_id,
        tipo_polin_id: movOriginal.tipo_polin_id,
        color_polin_id: movOriginal.color_polin_id,
        cantidad: movOriginal.cantidad,
        tipo_movimiento: 'ENVIO',
        estado_uso: 'TRANSPORTE',
        fecha_inicio: ahora
      }
    ])
    .select()
    .single();

  if (errIns) throw new Error(errIns.message);

  return nuevoMovimiento;
};

export const liberarPolines = async (id_movimiento) => {
  const { data: mov, error: errGet } = await supabase
    .from('movimiento_polines')
    .select('*')
    .eq('id', id_movimiento)
    .single();

  if (errGet) throw new Error(errGet.message);

  // 1. Actualizar fecha_fin
  const ahora = new Date().toISOString();
  const { error: errUpd } = await supabase
    .from('movimiento_polines')
    .update({ fecha_fin: ahora })
    .eq('id', id_movimiento);

  if (errUpd) throw new Error(errUpd.message);

  // 2. Aumentar inventario
  const { data: inv, error: invGetError } = await supabase
    .from('inventario')
    .select('*')
    .eq('tipo_polin_id', mov.tipo_polin_id)
    .eq('color_polin_id', mov.color_polin_id)
    .single();

  if (!invGetError && inv) {
    await supabase
      .from('inventario')
      .update({ cantidad_disponible: inv.cantidad_disponible + mov.cantidad })
      .eq('id', inv.id);
  }

  return { success: true, message: 'Polines liberados correctamente' };
};
