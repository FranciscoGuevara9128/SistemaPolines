import { supabase } from '../config/supabase.js';

export const obtenerReferencias = async (userRole, entityId) => {
  // 1. Clientes Directos
  let qDirectos = supabase.from('cliente_directo').select('id, nombre, contacto, telefono, email').eq('activo', true);
  if (userRole === 'CLIENTE_DIRECTO') qDirectos = qDirectos.eq('id', entityId);

  const { data: clientesDirectos, error: errCD } = await qDirectos;
  if (errCD) throw new Error(errCD.message);

  // 2. Clientes Finales
  let qFinales = supabase.from('cliente_final').select('id, nombre, ubicacion, cliente_directo_id');
  if (userRole === 'CLIENTE_DIRECTO') qFinales = qFinales.eq('cliente_directo_id', entityId);
  if (userRole === 'CLIENTE_FINAL') qFinales = qFinales.eq('id', entityId);

  const { data: clientesFinales, error: errCF } = await qFinales;
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

  // 5. Movimientos Activos
  let qMov = supabase
    .from('movimiento_polines')
    .select(`
      id,
      cantidad,
      cantidad_restante,
      tipo_movimiento,
      estado_uso,
      fecha_inicio,
      movimiento_origen_id,
      cliente_directo:cliente_directo_id ( id, nombre ),
      cliente_final:cliente_final_id ( id, nombre ),
      tipo_polin:tipo_polin_id ( id, nombre ),
      color_polin:color_polin_id ( id, nombre )
    `)
    .is('fecha_fin', null)
    .order('fecha_inicio', { ascending: false });

  if (userRole === 'CLIENTE_DIRECTO') qMov = qMov.eq('cliente_directo_id', entityId);
  if (userRole === 'CLIENTE_FINAL') {
    qMov = qMov.eq('cliente_final_id', entityId).eq('estado_uso', 'TRANSPORTE');
  }

  const { data: movimientosActivos, error: errMA } = await qMov;

  // Formatear con label legible e información de disponibilidad
  const movimientosFormateados = movimientosActivos.map(mov => {
    const clienteName = mov.cliente_directo?.nombre || 'Sin cliente';
    const tipoName = mov.tipo_polin?.nombre || 'Polín';
    const colorName = mov.color_polin?.nombre || '';
    const destinoName = mov.cliente_final ? ` → ${mov.cliente_final.nombre}` : '';
    const restante = mov.cantidad_restante ?? mov.cantidad;

    return {
      id: mov.id,
      estado_uso: mov.estado_uso,
      tipo_movimiento: mov.tipo_movimiento,
      cantidad: mov.cantidad,
      cantidad_restante: restante,
      es_hijo: !!mov.movimiento_origen_id,
      cliente_directo: mov.cliente_directo,
      tipo_polin: mov.tipo_polin,
      color_polin: mov.color_polin,
      cliente_final: mov.cliente_final,
      label: `[${mov.estado_uso}] ${restante} ${tipoName} ${colorName} | ${clienteName}${destinoName}`
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
