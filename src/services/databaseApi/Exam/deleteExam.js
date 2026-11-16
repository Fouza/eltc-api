import { examsCollection } from '../../../models/index.js';

const deleteExam = async (id) => {
  await examsCollection.deleteOne({ _id: id });
  return { ok: true };
};

export default deleteExam;
