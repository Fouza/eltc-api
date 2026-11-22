import { booksCollection, invoicesCollection } from '../../../models/index.js';
import { conflict } from '../../../helpers/errors.js';

const deleteBook = async (id) => {
  if (await invoicesCollection.exists({ book: id })) throw conflict('Students were already charged for this book. Deactivate it instead.');
  await booksCollection.deleteOne({ _id: id });
  return { ok: true };
};

export default deleteBook;
