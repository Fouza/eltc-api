import { examsCollection } from '../../../models/index.js';
import { pick } from '../../../helpers/strings.js';

const updateExam = (id, data) =>
  examsCollection
    .findByIdAndUpdate(id, { $set: pick(data, ['title', 'type', 'date', 'maxScore', 'passScore', 'coefficient', 'notes']) }, { returnDocument: 'after', runValidators: true })
    .lean();

export default updateExam;
