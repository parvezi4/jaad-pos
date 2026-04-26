import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import menuRouter from './routes/menu';
import ordersRouter from './routes/orders';
import { initSocket } from './lib/socket';

const app = express();
const httpServer = createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

// Socket.io
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

initSocket(io);

// Middleware
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);

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
