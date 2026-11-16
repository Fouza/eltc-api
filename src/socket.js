import { Server } from 'socket.io';
import config from './config.js';

// Singleton: import { socketIO } anywhere in the web process to emit.
// It is only attached to an HTTP server in src/index.js (not in the scheduler process).
export const socketIO = new Server({ cors: { origin: config.corsOrigin, credentials: true } });

export const isSocketAttached = () => Boolean(socketIO.httpServer);
