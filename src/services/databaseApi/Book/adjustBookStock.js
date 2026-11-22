import { badRequest } from '../../../helpers/errors.js';
import changeBookStock from './changeBookStock.js';
import getBookById from './getBookById.js';

// From the books page: copies received (+) or removed (−, lost, damaged) at a campus.
const adjustBookStock = async (id, { campus, change }) => {
  const n = Number(change);
  if (!campus || !Number.isFinite(n) || n === 0) throw badRequest('Choose a campus and a quantity');
  await changeBookStock(id, campus, Math.trunc(n));
  return getBookById(id);
};

export default adjustBookStock;
