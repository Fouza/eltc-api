import { CronJob } from 'cron';
import dayjs from 'dayjs';
import { booksCollection } from '../../models/index.js';
import notify from '../../services/notifications/notify.js';
import { ROLES } from '../../constants/roles.js';
import { startOfToday } from '../../helpers/dates.js';

// One alert a day per book and campus running low (at or below the book's lowStockAt).
export const runLowBookStock = async () => {
  const books = await booksCollection.find({ active: true }, { title: 1, stock: 1, lowStockAt: 1 }).populate('stock.campus', 'name').lean();
  let created = 0;
  for (const book of books) {
    for (const s of book.stock.filter((x) => x.campus && x.quantity <= (book.lowStockAt ?? 5))) {
      const n = await notify({
        type: 'low_book_stock',
        severity: s.quantity <= 0 ? 'danger' : 'warning',
        title: `${book.title}: ${s.quantity <= 0 ? 'out of stock' : `${s.quantity} left`} at ${s.campus.name}`,
        message: 'Order more copies before the next students enroll.',
        link: '/books',
        campus: s.campus._id,
        roles: [ROLES.SECRETARY],
        dedupeKey: `low_stock:${book._id}:${s.campus._id}:${dayjs(startOfToday()).format('YYYY-MM-DD')}`,
      });
      if (n) created++;
    }
  }
  return { created };
};

export default new CronJob('30 7 * * *', runLowBookStock, null, false, 'UTC');
