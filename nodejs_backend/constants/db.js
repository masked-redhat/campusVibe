import { DataTypes as DT } from "sequelize";

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

export const Expiry = {
  EmailTokens: 5 * 60 * 1000,
};

const models = { SQLMODEL, Expiry };

export default models;
