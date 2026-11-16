import mongoose from 'mongoose';
import { forbidden } from './errors.js';

// Row-level access: a user with campusIds = [] sees every campus. Otherwise only theirs.
export const userCampusIds = (user) => (user?.campusIds ?? []).map(String);

export const canAccessCampus = (user, campusId) => {
  const ids = userCampusIds(user);
  return ids.length === 0 || !campusId || ids.includes(String(campusId));
};

export const assertCampusAccess = (user, campusId) => {
  if (!canAccessCampus(user, campusId)) throw forbidden('You do not have access to this campus');
};

// Mongo filter for list queries. `requested` is an optional ?campus= filter from the UI.
export const campusFilter = (user, requested, field = 'campus') => {
  const ids = userCampusIds(user);
  if (requested) {
    if (ids.length && !ids.includes(String(requested))) throw forbidden('You do not have access to this campus');
    return { [field]: new mongoose.Types.ObjectId(String(requested)) };
  }
  return ids.length ? { [field]: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } } : {};
};
