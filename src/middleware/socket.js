import { verifyToken } from '../services/authenticationApi/index.js';

// The socket is authenticated with the JWT in the handshake: io(url, { auth: { token } }).
// Rooms are joined server-side from the verified user, never from what the client says.
const setupSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      socket.data.user = await verifyToken(socket.handshake.auth?.token);
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    socket.join([String(user._id), 'staff', ...user.roles.map((r) => `role:${r}`)]);
  });
};

export default setupSocket;
