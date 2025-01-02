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

const models = { SQLMODEL };

export default models;
