import { Sequelize } from "sequelize";
import { DATABASE } from "../../constants/env.js";
import restart from "../../utils/restart.js";

const DB = DATABASE;

const SqlDatabase = new Sequelize(DB.DB, DB.USER, DB.PASS, {
  host: DB.HOST,
  dialect: DB.DIALECT,
});

export const connectToSqlDatabase = async () => {
  try {
    await SqlDatabase.authenticate();
    await SqlDatabase.sync({ force: true });

    console.log("Connected to SQL!");
  } catch (err) {
    console.log(err);

    console.log("Not connected to SQL");

    restart(connectToSqlDatabase);
  }
};

export default SqlDatabase;
