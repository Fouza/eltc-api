export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Case-insensitive "starts with" on each word, so it can use indexes better than a free regex.
export const prefixRegex = (s = '') => new RegExp(`^${escapeRegex(s.trim())}`, 'i');

export const pick = (obj = {}, keys = []) =>
  keys.reduce((acc, k) => (obj[k] !== undefined ? { ...acc, [k]: obj[k] } : acc), {});

export const fullName = (p) => [p?.firstName, p?.lastName].filter(Boolean).join(' ');
