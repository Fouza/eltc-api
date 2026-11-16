import http from 'node:http';
import config from './config.js';
import { createApp } from './app.js';
import { initializeDb, disconnectDb } from './models/connection/index.js';
import { socketIO } from './socket.js';
import setupSocket from './middleware/socket.js';

if (!config.jwtSecret) throw new Error('JWT_SECRET is not set (copy .env.example to .env)');

initializeDb(() => {
  const app = createApp();
  const server = http.createServer(app);
  socketIO.attach(server);
  setupSocket(socketIO);
  server.listen(config.port, () => console.log(`ELTC API on http://localhost:${config.port} (${config.env})`));

  // Graceful stop (Heroku SIGTERM, Ctrl+C, node --watch restarts). server.close() alone waits forever
  // for open websockets and keep-alive connections, so close those explicitly, with a hard exit as a fallback.
  let stopping = false;
  const shutdown = async (signal) => {
    if (stopping) return process.exit(1); // second Ctrl+C: quit now
    stopping = true;
    console.log(`${signal} received, closing…`);
    setTimeout(() => process.exit(1), 5000).unref();
    socketIO.disconnectSockets(true);
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
    await disconnectDb();
    process.exit(0);
  };
  process.once('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}).catch((err) => {
  console.error('Cannot start the API', err);
  process.exit(1);
});
