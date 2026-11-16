import { notificationsCollection } from '../../../models/index.js';

// With a dedupeKey, the same alert is only created once. Returns null when it already existed.
const insertNotification = async (data) => {
  if (!data.dedupeKey) return (await notificationsCollection.create(data)).toObject();
  const res = await notificationsCollection.updateOne({ dedupeKey: data.dedupeKey }, { $setOnInsert: data }, { upsert: true });
  if (!res.upsertedId) return null;
  return notificationsCollection.findById(res.upsertedId).lean();
};

export default insertNotification;
