import { groupsCollection, enrollmentsCollection, attendancesCollection, examsCollection } from '../../../models/index.js';
import getGroupById from './getGroupById.js';

const updateGroup = async (id, data) => {
  const before = await groupsCollection.findById(id).lean();
  await groupsCollection.updateOne({ _id: id }, { $set: data }, { runValidators: true });
  // Keep denormalised fields in sync if the group moved campus.
  if (data.campus && String(data.campus) !== String(before?.campus)) {
    await Promise.all([
      enrollmentsCollection.updateMany({ group: id }, { $set: { campus: data.campus } }),
      attendancesCollection.updateMany({ group: id }, { $set: { campus: data.campus } }),
      examsCollection.updateMany({ group: id }, { $set: { campus: data.campus } }),
    ]);
  }
  return getGroupById(id);
};

export default updateGroup;
