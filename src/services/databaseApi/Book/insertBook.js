import { booksCollection } from '../../../models/index.js';
import { pick } from '../../../helpers/strings.js';
import getBookById from './getBookById.js';

export const BOOK_FIELDS = ['title', 'publisher', 'price', 'image', 'levels', 'lowStockAt', 'active', 'notes'];

const insertBook = async (data) => {
  const book = await booksCollection.create(pick(data, [...BOOK_FIELDS, 'stock']));
  return getBookById(book._id);
};

export default insertBook;
