import { enrollmentsCollection, studentsCollection } from '../../../models/index.js';

// active if in at least one group; otherwise inactive (prospects and graduates are left as they are).
const syncStudentStatus = async (studentId) => {
  const student = await studentsCollection.findById(studentId, { status: 1 }).lean();
  if (!student) return;
  const hasActive = await enrollmentsCollection.exists({ student: studentId, status: 'active' });
  if (hasActive && student.status !== 'active') await studentsCollection.updateOne({ _id: studentId }, { $set: { status: 'active' } });
  if (!hasActive && student.status === 'active') await studentsCollection.updateOne({ _id: studentId }, { $set: { status: 'inactive' } });
};

export default syncStudentStatus;
