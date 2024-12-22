import { Sequelize } from "sequelize";
import { MYSQL } from "../../constants/env.js";
import restart from "../../utils/restart.js";

const DB = MYSQL;

const mysql = new Sequelize(DB.DB, DB.USER, DB.PASS, {
  host: DB.HOST,
  dialect: DB.DIALECT,
});

export const connectToMysql = async () => {
  try {
    await mysql.authenticate();
    await mysql.sync();

    console.log("Connected to SQL!");
  } catch (err) {
    console.log(err);

    console.log("Not connected to SQL");

    restart(connectToMysql);
  }
};

export default mysql;
