import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import menuRouter from './routes/menu';
import ordersRouter from './routes/orders';
import paymentsRouter from './routes/payments';
import { initSocket } from './lib/socket';

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

const allowedOrigins = Array.from(
  new Set([
    CLIENT_URL,
    ...DEFAULT_ALLOWED_ORIGINS,
    ...(process.env.CORS_ORIGINS || '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ]),
);

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    // Allow non-browser and same-origin requests with no Origin header.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  credentials: true,
};

// Socket.io
const io = new SocketIOServer(httpServer, {
  cors: corsOptions,
});

initSocket(io);

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Root info
app.get('/', (req, res) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}`;

  res.json({
    name: 'Jaad POS Backend API',
    status: 'ok',
    endpoints: {
      health: `${baseUrl}/health`,
      menuBySlug: `${baseUrl}/api/menu/slug/jaad-cafe`,
      createOrder: `${baseUrl}/api/orders`,
    },
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server (only when not in test mode)
if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔌 Socket.io ready`);
  });
}

export { app, httpServer };
