import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  const username = 'admin@polines.com';
  const plainPassword = 'admin';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  const { data, error } = await supabase
    .from('usuario')
    .insert([
      {
        nombre: 'Administrador Sistema',
        email: username,
        password: hashedPassword, // Note: I assume the column password exists or I should add it
        rol: 'PERSONAL', // Usando PERSONAL para el administrador
        activo: true
      }
    ])
    .select();

  if (error) {
    console.error('Error seeding admin:', error);
  } else {
    console.log('Admin seeded successfully:', data);
  }
}

seedAdmin();
