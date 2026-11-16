import dayjs from 'dayjs';
import { invoicesCollection } from '../../../models/index.js';
import { startOfToday } from '../../../helpers/dates.js';

const getOverdueInvoices = ({ graceDays = 0 } = {}) =>
  invoicesCollection
    .find({ status: { $in: ['unpaid', 'partial'] }, dueDate: { $lt: dayjs(startOfToday()).subtract(graceDays, 'day').toDate() } })
    .populate('student', 'firstName lastName phone')
    .lean();

export default getOverdueInvoices;
