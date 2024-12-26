import { DataTypes as DT } from "sequelize";

const SQLMODEL = {
  ID: {
    type: DT.INTEGER,
    autoIncrement: true,
    allowNull: false,
    unique: true,
    primaryKey: true,
  },
};

const models = { SQLMODEL };

export default models;
