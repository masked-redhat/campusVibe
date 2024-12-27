import models from "../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../db/sql/connection.js";

db.define("User", {
  id: models.SQLMODEL.ID,
  username: {
    type: DT.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DT.STRING,
    allowNull: false,
  },
  email: {
    type: DT.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  email_verified: {
    type: DT.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  blacklisted: {
    type: DT.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

const User = db.models.User;

export default User;
