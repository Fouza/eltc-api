import { invoicesCollection } from '../../../models/index.js';
import { isOverdueFilter } from '../../../helpers/dates.js';

// Unpaid invoices past their overdueAt date (course months after a month, books at the end of the level).
const getOverdueInvoices = () =>
  invoicesCollection.find(isOverdueFilter()).populate('student', 'firstName lastName phone').lean();

export default getOverdueInvoices;
