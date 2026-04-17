import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import movimientosRoutes from './routes/movimientos.routes.js';
import facturacionRoutes from './routes/facturacion.routes.js';
import clientesRoutes from './routes/clientes.routes.js';
import referenciasRoutes from './routes/referencias.routes.js';
import authRoutes from './routes/auth.routes.js';
import gestionRoutes from './routes/gestion.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', movimientosRoutes);
app.use('/api', facturacionRoutes);
app.use('/api/gestion', gestionRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/referencias', referenciasRoutes);

app.get('/health', (req, res) => res.send('OK'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
