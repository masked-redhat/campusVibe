import models from "../../constants/db.js";
import { DataTypes as DT, Op } from "sequelize";
import db from "../../db/sql/connection.js";
import Profile from "./profile.js";
import User from "./user.js";

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

Friend.beforeUpdate(async (request, options) => {
  const transaction = options.transaction;

  const userIds = [request.userId, request.friendId];
  console.log(request.dataValues.rw, request.previous());
  if (
    request.dataValues.requestAccepted === true &&
    request.previous().requestAccepted === false
  ) {
    console.log("hello");
    await Profile.increment("friends", {
      by: 1,
      where: { userId: userIds },
      transaction,
    });
  }
});

Friend.afterDestroy(async (request, options) => {
  const transaction = options.transaction;

  const userIds = [request.userId, request.friendId];
  await Profile.decrement("friends", {
    by: 1,
    where: { userId: userIds },
    transaction,
  });
});

export const alias = {
  userId: "requestedBy",
  friendId: "requestedTo",
};

export default Friend;
