import { attendancesCollection } from '../../../models/index.js';

const deleteAttendanceSheet = async (id) => {
  await attendancesCollection.deleteOne({ _id: id });
  return { ok: true };
};

export default deleteAttendanceSheet;
