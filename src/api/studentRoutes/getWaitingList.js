import * as databaseApi from '../../services/databaseApi/index.js';

const getWaitingList = async (req, res) => {
  res.json(await databaseApi.getWaitingList(req.query, req.user));
};

export default getWaitingList;
