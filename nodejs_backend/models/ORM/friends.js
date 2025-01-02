import models from "../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../db/sql/connection.js";

db.define(
  "Friend",
  {
    id: models.SQLMODEL.ID,
    userId: {
      type: models.SQLMODEL.ID.type,
      allowNull: false,
    },
    friendId: {
      type: models.SQLMODEL.ID.type,
      allowNull: false,
    },
    requestAccepted: {
      type: DT.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    requestRejected: {
      type: DT.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    indexes: [
      {
        type: "UNIQUE",
        fields: ["userId", "friendId"],
      },
    ],
    validate: {
      requestDiffer() {
        if (
          this.requestAccepted === this.requestRejected &&
          this.requestAccepted === true
        )
          throw new Error(
            "Request cannot be accepted and rejected at the same damn time"
          );
      },
    },
  }
);

const Friend = db.models.Friend;

export const alias = {
  userId: "requestedBy",
  friendId: "requestedTo",
};

export default Friend;
