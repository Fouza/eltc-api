import { notificationsCollection } from '../../../models/index.js';

const markNotificationRead = async (id, userId) => {
  await notificationsCollection.updateOne({ _id: id }, { $addToSet: { readBy: userId } });
  return { ok: true };
};

export default markNotificationRead;
