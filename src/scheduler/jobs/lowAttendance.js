import { CronJob } from 'cron';
import notifyLowAttendance from '../../services/notifications/notifyLowAttendance.js';

// Safety net: the check also runs when a sheet is saved (api/attendance.js).
export const runLowAttendance = async () => {
  const { checked, created } = await notifyLowAttendance();
  return { checked, created: created.length };
};

export default new CronJob('0 7 * * *', runLowAttendance, null, false, 'UTC');
