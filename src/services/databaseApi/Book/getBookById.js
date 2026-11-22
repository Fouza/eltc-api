import { booksCollection } from '../../../models/index.js';

const getBookById = (id) =>
  booksCollection.findById(id).populate('levels.program', 'name audience levels color').populate('stock.campus', 'name code').lean();

export default getBookById;
