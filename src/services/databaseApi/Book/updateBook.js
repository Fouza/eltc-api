import { booksCollection } from '../../../models/index.js';
import { pick } from '../../../helpers/strings.js';
import { notFound } from '../../../helpers/errors.js';
import { BOOK_FIELDS } from './insertBook.js';
import getBookById from './getBookById.js';

// Stock is changed with adjustBookStock, not here. Invoices already issued keep their price.
const updateBook = async (id, data) => {
  const res = await booksCollection.updateOne({ _id: id }, { $set: pick(data, BOOK_FIELDS) }, { runValidators: true });
  if (!res.matchedCount) throw notFound('Book not found');
  return getBookById(id);
};

export default updateBook;
