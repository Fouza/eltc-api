import { CronJob } from 'cron';
import dayjs from 'dayjs';
import * as databaseApi from '../../services/databaseApi/index.js';
import notify from '../../services/notifications/notify.js';
import { ROLES } from '../../constants/roles.js';

// Exams in the past with no result typed yet.
export const runExamsNotGraded = async () => {
  const exams = await databaseApi.getUngradedExams();
  let created = 0;
  for (const exam of exams) {
    const n = await notify({
      type: 'exam_not_graded',
      severity: 'info',
      title: `Results missing: ${exam.title}`,
      message: `${exam.group?.name ?? 'Group'} · exam of ${dayjs(exam.date).format('D MMM YYYY')}. Type the results from the teacher's list.`,
      link: `/exams/${exam._id}`,
      campus: exam.campus,
      roles: [ROLES.SECRETARY],
      dedupeKey: `exam_not_graded:${exam._id}`,
    });
    if (n) created++;
  }
  return { checked: exams.length, created };
};

export default new CronJob('30 7 * * *', runExamsNotGraded, null, false, 'UTC');
