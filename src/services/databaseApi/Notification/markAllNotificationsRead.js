import { notificationsCollection } from '../../../models/index.js';
import notificationFilterForUser from './notificationFilterForUser.js';

const markAllNotificationsRead = async (user) => {
  await notificationsCollection.updateMany({ ...notificationFilterForUser(user), readBy: { $ne: user._id } }, { $addToSet: { readBy: user._id } });
  return { ok: true };
};

export default markAllNotificationsRead;
