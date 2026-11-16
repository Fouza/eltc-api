import { notificationsCollection } from '../../../models/index.js';
import notificationFilterForUser from './notificationFilterForUser.js';

const getNotificationsForUser = async (user, { limit = 30, unread } = {}) => {
  const filter = notificationFilterForUser(user);
  const unreadFilter = { ...filter, readBy: { $ne: user._id } };
  const [items, unreadCount] = await Promise.all([
    notificationsCollection
      .find(unread ? unreadFilter : filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 30, 200))
      .lean(),
    notificationsCollection.countDocuments(unreadFilter),
  ]);
  return {
    items: items.map(({ readBy, ...n }) => ({ ...n, read: readBy.some((id) => String(id) === String(user._id)) })),
    unread: unreadCount,
  };
};

export default getNotificationsForUser;
