import * as databaseApi from '../../services/databaseApi/index.js';

const getStudents = async (req, res) => {
  res.json(await databaseApi.getStudents(req.query, req.user));
};

export default getStudents;
