// ?page=1&limit=25 → { skip, limit, page }
export const getPagination = (query = {}, defaultLimit = 25, maxLimit = 200) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(query.limit) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

export const paginated = (items, total, { page, limit }) => ({ items, total, page, limit, pages: Math.ceil(total / limit) });
