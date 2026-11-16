import { campusesCollection } from '../../../models/index.js';

const insertCampus = async (data) => (await campusesCollection.create(data)).toObject();

export default insertCampus;
