import * as databaseApi from '../databaseApi/index.js';
import { socketIO, isSocketAttached } from '../../socket.js';
import { NOTIFICATION_NEW } from '../../constants/events.js';

// Saves a notification and pushes it live to the right role rooms.
// From the scheduler process there is no socket server: the web app picks it up on its next poll.
const notify = async (data) => {
  const notification = await databaseApi.insertNotification({ roles: [], ...data });
  if (notification && isSocketAttached()) {
    const rooms = notification.roles?.length ? [...notification.roles.map((r) => `role:${r}`), 'role:admin'] : ['staff'];
    socketIO.to(rooms).emit(NOTIFICATION_NEW, { ...notification, read: false, readBy: undefined });
  }
  return notification;
};

export default notify;
