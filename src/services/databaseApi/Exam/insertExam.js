import { examsCollection, groupsCollection } from '../../../models/index.js';
import { notFound } from '../../../helpers/errors.js';
import getSettings from '../Setting/getSettings.js';

const insertExam = async (data, userId) => {
  const group = await groupsCollection.findById(data.group).lean();
  if (!group) throw notFound('Group not found');
  const settings = await getSettings();
  const exam = await examsCollection.create({
    passScore: settings.defaultPassScore,
    ...data,
    maxScore: 100, // scores are percentages
    program: group.program,
    levelNumber: group.levelNumber,
    campus: group.campus,
    results: [],
    status: 'scheduled',
    recordedBy: userId,
  });
  return exam.toObject();
};

export default insertExam;
