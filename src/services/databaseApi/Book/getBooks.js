import mongoose from 'mongoose';
import { booksCollection } from '../../../models/index.js';

// Filters: program, level (with program), active ('true' | 'false'), q (title). Pass withImage=false for light lists.
const getBooks = (query = {}) => {
  const filter = {};
  if (query.program) {
    const program = new mongoose.Types.ObjectId(String(query.program));
    filter.levels = query.level ? { $elemMatch: { program, levelNumber: Number(query.level) } } : { $elemMatch: { program } };
  }
  if (query.active) filter.active = query.active === 'true';
  if (query.q) filter.title = { $regex: String(query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  return booksCollection
    .find(filter, query.withImage === 'false' ? { image: 0 } : {})
    .populate('levels.program', 'name audience levels color')
    .populate('stock.campus', 'name code')
    .sort({ title: 1 })
    .lean();
};

export default getBooks;
