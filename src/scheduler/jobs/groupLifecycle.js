import { CronJob } from 'cron';
import * as databaseApi from '../../services/databaseApi/index.js';
import { groupsCollection } from '../../models/index.js';
import notify from '../../services/notifications/notify.js';
import { ROLES } from '../../constants/roles.js';
import { startOfToday } from '../../helpers/dates.js';

// Planned groups whose start date has come become "ongoing".
// Ongoing groups past their end date raise an alert (final results, promotion) but are closed by a human.
export const runGroupLifecycle = async () => {
  const today = startOfToday();
  const started = await groupsCollection.updateMany({ status: 'planned', startDate: { $lte: today } }, { $set: { status: 'ongoing' } });
  const ended = await databaseApi.getGroups({ status: 'ongoing', endDate: { $lt: today } });
  for (const g of ended) {
    await notify({
      type: 'group_ended',
      severity: 'info',
      title: `${g.name} has reached its end date`,
      message: 'Record the final exam, then promote the students who passed and close the group.',
      link: `/groups/${g._id}`,
      campus: g.campus?._id,
      roles: [ROLES.SECRETARY],
      dedupeKey: `group_ended:${g._id}`,
    });
  }
  return { started: started.modifiedCount, ended: ended.length };
};

export default new CronJob('0 6 * * *', runGroupLifecycle, null, false, 'UTC');
