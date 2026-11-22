import * as databaseApi from '../databaseApi/index.js';
import notify from './notify.js';
import { ROLES } from '../../constants/roles.js';
import { fullName } from '../../helpers/strings.js';

// Same rule for the daily job and for the moment a sheet is saved.
// One alert per student, group and absence count: the 3rd absence alerts, the 4th alerts again, a re-save doesn't.
const notifyLowAttendance = async (filters = {}) => {
  const settings = await databaseApi.getSettings();
  const rows = await databaseApi.getLowAttendance({ threshold: settings.lowAttendanceThreshold, ...filters });
  const created = [];
  for (const r of rows) {
    const contact = r.student.guardian?.phone || r.student.phone;
    const n = await notify({
      type: 'low_attendance',
      severity: r.absences >= settings.lowAttendanceThreshold * 2 ? 'danger' : 'warning',
      title: `${fullName(r.student)} missed ${r.absences} classes`,
      message: `In ${r.group.name} over the last 30 days.${contact ? ` Contact: ${contact}` : ''}`,
      link: `/students/${r.student._id}?tab=attendance`,
      campus: r.campus,
      roles: [ROLES.SECRETARY],
      dedupeKey: `low_attendance:${r.student._id}:${r.group._id}:${r.absences}`,
    });
    if (n) created.push(n);
  }
  return { checked: rows.length, created };
};

export default notifyLowAttendance;
