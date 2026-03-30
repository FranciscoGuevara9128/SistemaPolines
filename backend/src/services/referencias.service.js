import { supabase } from '../config/supabase.js';

export const obtenerReferencias = async () => {
  // 1. Clientes Directos
  const { data: clientesDirectos, error: errCD } = await supabase
    .from('cliente_directo')
    .select('id, nombre, contacto, telefono, email');
  if (errCD) throw new Error(errCD.message);

  // 2. Clientes Finales
  const { data: clientesFinales, error: errCF } = await supabase
    .from('cliente_final')
    .select('id, nombre, ubicacion, cliente_directo_id');
  if (errCF) throw new Error(errCF.message);

  // 3. Tipos de Polines
  const { data: tiposPolin, error: errTP } = await supabase
    .from('tipo_polin')
    .select('id, nombre, descripcion');
  if (errTP) throw new Error(errTP.message);

  // 4. Colores de Polines
  const { data: coloresPolin, error: errCP } = await supabase
    .from('color_polin')
    .select('id, nombre');
  if (errCP) throw new Error(errCP.message);

  // 5. Movimientos Activos (para Transporte y Liberación)
  // estado_uso = 'ALMACENAMIENTO' -> Disponible para Transporte
  // estado_uso = 'TRANSPORTE' -> Disponible para Liberación
  // La consulta trae ambos y el frontend filtra según la necesidad.
  const { data: movimientosActivos, error: errMA } = await supabase
    .from('movimiento_polines')
    .select(`
      id,
      cantidad,
      tipo_movimiento,
      estado_uso,
      fecha_inicio,
      cliente_directo:cliente_directo_id ( id, nombre ),
      cliente_final:cliente_final_id ( id, nombre ),
      tipo_polin:tipo_polin_id ( id, nombre ),
      color_polin:color_polin_id ( id, nombre )
    `)
    .is('fecha_fin', null); // Solo los que no han sido cerrados

  if (errMA) throw new Error(errMA.message);

  // Formatear los movimientos para que tengan un label legible
  const movimientosFormateados = movimientosActivos.map(mov => {
    const clienteName = mov.cliente_directo?.nombre || 'Sin cliente';
    const tipoName = mov.tipo_polin?.nombre || 'Polín';
    const colorName = mov.color_polin?.nombre || '';
    const destinoName = mov.cliente_final ? ` (Hacia: ${mov.cliente_final.nombre})` : '';
    
    return {
      id: mov.id,
      estado_uso: mov.estado_uso,
      label: `${mov.tipo_movimiento} | ${mov.cantidad} ${tipoName} ${colorName} | ${clienteName}${destinoName}`
    };
  });

  return {
    clientes_directos: clientesDirectos,
    clientes_finales: clientesFinales,
    tipos_polin: tiposPolin,
    colores_polin: coloresPolin,
    movimientos_activos: movimientosFormateados
  };
};
