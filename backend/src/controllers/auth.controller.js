import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_123';

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
  }

  try {
    // 1. Buscar usuario por email
    const { data: usuario, error } = await supabase
      .from('usuario')
      .select('*, cliente_directo:cliente_directo_id(nombre), cliente_final:cliente_final_id(nombre)')
      .eq('email', email)
      .eq('activo', true)
      .single();

    if (error || !usuario) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // 2. Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, usuario.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    // 3. Determinar el rol compatible con el frontend (mapping)
    // El frontend espera ADMIN, CLIENTE_DIRECTO, CLIENTE_FINAL
    let frontendRole = usuario.rol;
    if (usuario.rol === 'PERSONAL') frontendRole = 'ADMIN';

    // 4. Determinar entityName
    let entityName = usuario.nombre;
    if (usuario.rol === 'CLIENTE_DIRECTO' && usuario.cliente_directo) {
      entityName = usuario.cliente_directo.nombre;
    } else if (usuario.rol === 'CLIENTE_FINAL' && usuario.cliente_final) {
      entityName = usuario.cliente_final.nombre;
    }

    // 5. Generar Token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        rol: frontendRole, 
        entityId: usuario.cliente_directo_id || usuario.cliente_final_id || null 
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 6. Retornar datos (sin el password)
    const { password: _, ...userSession } = usuario;
    res.json({
      success: true,
      token,
      user: {
        ...userSession,
        role: frontendRole,
        entityName,
        entityId: usuario.cliente_directo_id || usuario.cliente_final_id || null
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};
