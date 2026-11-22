import { booksCollection } from '../../../models/index.js';

// Adds (or removes, with a negative change) copies at one campus. Returns the new quantity.
const changeBookStock = async (bookId, campusId, change) => {
  const res = await booksCollection.updateOne({ _id: bookId, 'stock.campus': campusId }, { $inc: { 'stock.$.quantity': change } });
  if (!res.matchedCount) await booksCollection.updateOne({ _id: bookId }, { $push: { stock: { campus: campusId, quantity: change } } });
  const book = await booksCollection.findById(bookId, { stock: 1 }).lean();
  return book?.stock.find((s) => String(s.campus) === String(campusId))?.quantity ?? 0;
};

export default changeBookStock;
