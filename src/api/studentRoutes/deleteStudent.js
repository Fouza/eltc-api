import * as databaseApi from '../../services/databaseApi/index.js';

const deleteStudent = async (req, res) => {
  res.json(await databaseApi.deleteStudent(req.params.id));
};

export default deleteStudent;
