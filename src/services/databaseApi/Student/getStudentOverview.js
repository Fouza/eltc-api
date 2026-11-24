import {
  enrollmentsCollection, invoicesCollection, paymentsCollection, attendancesCollection, examsCollection, certificatesCollection,
} from '../../../models/index.js';
import getStudentById from './getStudentById.js';
import { isOverdue } from '../../../helpers/dates.js';

// Everything for the student profile page in one call.
const getStudentOverview = async (id) => {
  const student = await getStudentById(id);
  if (!student) return null;

  const [enrollments, invoices, payments, attendance, exams, certificates] = await Promise.all([
    enrollmentsCollection
      .find({ student: id })
      .populate({
        path: 'group',
        select: 'name levelNumber schedule startDate endDate status teacher campus',
        populate: [{ path: 'teacher', select: 'firstName lastName' }, { path: 'campus', select: 'name code color' }],
      })
      .populate({ path: 'program', select: 'name audience color language', populate: { path: 'language', select: 'name code color' } })
      .sort({ enrolledAt: -1 })
      .lean(),
    invoicesCollection.find({ student: id }).sort({ dueDate: 1 }).lean(),
    paymentsCollection.find({ student: id }).populate('receivedBy', 'firstName lastName').sort({ paidAt: -1 }).lean(),
    attendancesCollection
      .find({ 'entries.student': id }, { group: 1, date: 1, topic: 1, 'entries.$': 1 })
      .populate('group', 'name')
      .sort({ date: -1 })
      .limit(200)
      .lean(),
    examsCollection
      .find({ 'results.student': id }, { title: 1, type: 1, date: 1, maxScore: 1, passScore: 1, coefficient: 1, group: 1, levelNumber: 1, 'results.$': 1 })
      .populate('group', 'name')
      .sort({ date: -1 })
      .lean(),
    certificatesCollection.find({ student: id }, { number: 1, enrollment: 1, status: 1, levelName: 1, programName: 1, issuedAt: 1, handedOverAt: 1, handedOverTo: 1 }).sort({ issuedAt: -1 }).lean(),
  ]);

  const open = invoices.filter((i) => ['unpaid', 'partial'].includes(i.status));
  const finance = {
    billed: invoices.filter((i) => i.status !== 'cancelled').reduce((s, i) => s + i.amount, 0),
    paid: payments.reduce((s, p) => s + p.amount, 0),
    due: open.reduce((s, i) => s + i.amount - i.paidAmount, 0),
    overdue: open.filter(isOverdue).reduce((s, i) => s + i.amount - i.paidAmount, 0),
  };

  const sessions = attendance.map((a) => ({ _id: a._id, date: a.date, topic: a.topic, group: a.group, ...a.entries[0] }));
  const counted = sessions.length;
  const absences = sessions.filter((s) => s.status === 'absent').length;

  return {
    student,
    enrollments,
    invoices: invoices.map((i) => ({ ...i, isOverdue: isOverdue(i) })),
    payments,
    finance,
    attendance: {
      sessions,
      total: counted,
      absences,
      late: sessions.filter((s) => s.status === 'late').length,
      rate: counted ? Math.round(((counted - absences) / counted) * 100) : null,
    },
    grades: exams.map((e) => ({ ...e, result: e.results[0], results: undefined })),
    certificates,
  };
};

export default getStudentOverview;
