import { DataTypes as DT } from "sequelize";
import User from "../models/ORM/user.js";

const SQLMODEL = {
  ID: {
    type: DT.UUID,
    defaultValue: DT.UUIDV4,
    // autoIncrement: true,
    allowNull: false,
    unique: true,
    primaryKey: true,
  },
};

export const userInfoInclusion = {
  model: User,
  foreignKey: "userId",
  attributes: ["username"],
};

export const userInfoByAlias = (alias, foreignKey = "userId") => {
  const info = userInfoInclusion;
  info.foreignKey = foreignKey;
  info.as = alias;
  return info;
};

export const Expiry = {
  EmailTokens: 5 * 60 * 1000,
};

const models = { SQLMODEL, Expiry };

export default models;
