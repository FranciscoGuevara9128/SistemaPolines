import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

// --- CLIENTES DIRECTOS ---
export const listarClientesDirectos = async () => {
  const { data, error } = await supabase.from('cliente_directo').select('*').order('nombre');
  if (error) throw new Error(error.message);
  return data;
};

export const crearClienteDirecto = async (datos) => {
  const { data, error } = await supabase.from('cliente_directo').insert([datos]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const actualizarClienteDirecto = async (id, datos) => {
  const { data, error } = await supabase.from('cliente_directo').update(datos).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};

// --- CLIENTES FINALES ---
export const listarClientesFinales = async () => {
  const { data, error } = await supabase
    .from('cliente_final')
    .select('*, rel_cliente_directo_final(cliente_directo_id)')
    .order('nombre');
  if (error) throw new Error(error.message);
  return data;
};

export const crearClienteFinal = async (datos, directosIds = []) => {
  // 1. Crear cliente final
  const { data, error } = await supabase.from('cliente_final').insert([datos]).select().single();
  if (error) throw new Error(error.message);

  // 2. Crear relaciones
  if (directosIds.length > 0) {
    const rels = directosIds.map(cdId => ({ cliente_final_id: data.id, cliente_directo_id: cdId }));
    const { error: errRel } = await supabase.from('rel_cliente_directo_final').insert(rels);
    if (errRel) throw new Error(errRel.message);
  }

  return data;
};

export const actualizarClienteFinal = async (id, datos, directosIds = []) => {
  // 1. Actualizar datos base
  const { data, error } = await supabase.from('cliente_final').update(datos).eq('id', id).select().single();
  if (error) throw new Error(error.message);

  // 2. Sincronizar relaciones (eliminar y recrear)
  const { error: errDel } = await supabase.from('rel_cliente_directo_final').delete().eq('cliente_final_id', id);
  if (errDel) throw new Error(errDel.message);

  if (directosIds.length > 0) {
    const rels = directosIds.map(cdId => ({ cliente_final_id: id, cliente_directo_id: cdId }));
    const { error: errIns } = await supabase.from('rel_cliente_directo_final').insert(rels);
    if (errIns) throw new Error(errIns.message);
  }

  return data;
};

// --- USUARIOS ---
export const listarUsuarios = async () => {
  const { data, error } = await supabase
    .from('usuario')
    .select('*, cliente_directo:cliente_directo_id(nombre), cliente_final:cliente_final_id(nombre)')
    .order('nombre');
  if (error) throw new Error(error.message);
  return data;
};

export const crearUsuario = async (datos) => {
  if (datos.password) {
    datos.password = await bcrypt.hash(datos.password, 10);
  }
  const { data, error } = await supabase.from('usuario').insert([datos]).select().single();
  if (error) throw new Error(error.message);
  return data;
};

export const actualizarUsuario = async (id, datos) => {
  if (datos.password && datos.password.trim() !== '') {
    datos.password = await bcrypt.hash(datos.password, 10);
  } else {
    delete datos.password; // No actualizar si está vacío
  }
  const { data, error } = await supabase.from('usuario').update(datos).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};

// --- INVENTARIO ---
export const listarInventario = async () => {
  const { data, error } = await supabase
    .from('inventario')
    .select('*, tipo_polin:tipo_polin_id(nombre), color_polin:color_polin_id(nombre)')
    .order('id');
  if (error) throw new Error(error.message);
  return data;
};

export const actualizarInventario = async (id, datos) => {
  const { data, error } = await supabase.from('inventario').update(datos).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
};
