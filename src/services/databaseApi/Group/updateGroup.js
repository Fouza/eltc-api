import { groupsCollection, enrollmentsCollection, attendancesCollection, examsCollection, programsCollection } from '../../../models/index.js';
import { badRequest } from '../../../helpers/errors.js';
import { checkSessions, scheduleFromSessions, sortSessions } from '../../../constants/sessions.js';
import getGroupById from './getGroupById.js';

const updateGroup = async (id, data) => {
  const before = await groupsCollection.findById(id).lean();
  // Sessions (or the program, which sets kids/adults) changed: check them and rebuild the schedule.
  const { schedule: _schedule, cancelledSessions: _cancelled, ...set } = data; // the schedule comes from the sessions; cancellations have their own route
  if (data.sessions || data.program) {
    const program = await programsCollection.findById(data.program ?? before?.program).lean();
    const sessions = data.sessions ?? before?.sessions ?? [];
    const error = checkSessions(sessions, program?.audience);
    if (error) throw badRequest(error);
    Object.assign(set, { sessions: sortSessions(sessions), schedule: scheduleFromSessions(sessions) });
  }
  await groupsCollection.updateOne({ _id: id }, { $set: set }, { runValidators: true });
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
