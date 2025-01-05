import db from "./connection.js";

const transaction = async () => {
  return await db.transaction();
};

export default transaction;
