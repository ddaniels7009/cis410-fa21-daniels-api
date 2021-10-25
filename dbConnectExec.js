const sql = require("mssql");
const databaseConfig = require("./config.js");

const config = {
  user: databaseConfig.DB.user,
  password: databaseConfig.DB.password,
  server: databaseConfig.DB.server,
  database: databaseConfig.DB.database,
};

async function executeQuery(aQuery) {
  let connection = await sql.connect(config);
  let result = await connection.query(aQuery);

  //console.log(result);
  return result.recordsets;
}

module.exports = { executeQuery: executeQuery };