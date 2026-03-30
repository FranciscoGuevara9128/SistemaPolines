import { supabase } from '../config/supabase.js';

export const obtenerEstadoPolines = async (cliente_directo_id) => {
  const { data: movimientos, error } = await supabase
    .from('movimiento_polines')
    .select('estado_uso, cantidad, cantidad_restante')  // <-- incluir cantidad_restante
    .eq('cliente_directo_id', cliente_directo_id)
    .is('fecha_fin', null); // Solo activos

  if (error) throw new Error(error.message);

  const estado = {
    almacenamiento: 0,
    transporte: 0
  };

  movimientos.forEach(m => {
    // cantidad_restante refleja la cantidad actual activa en este estado.
    // Si no existe (registros anteriores a la migración), se usa cantidad.
    const activa = m.cantidad_restante ?? m.cantidad;
    if (m.estado_uso === 'ALMACENAMIENTO') {
      estado.almacenamiento += activa;
    } else if (m.estado_uso === 'TRANSPORTE') {
      estado.transporte += activa;
    }
  });

  return estado;
};
