import { supabase } from '../config/supabase.js';

export const obtenerEstadoPolines = async (cliente_directo_id) => {
  const { data: movimientos, error } = await supabase
    .from('movimiento_polines')
    .select('estado_uso, cantidad')
    .eq('cliente_directo_id', cliente_directo_id)
    .is('fecha_fin', null); // Solo activos

  if (error) throw new Error(error.message);

  const estado = {
    almacenamiento: 0,
    transporte: 0
  };

  movimientos.forEach(m => {
    if (m.estado_uso === 'ALMACENAMIENTO') {
      estado.almacenamiento += m.cantidad;
    } else if (m.estado_uso === 'TRANSPORTE') {
      estado.transporte += m.cantidad;
    }
  });

  return estado;
};
