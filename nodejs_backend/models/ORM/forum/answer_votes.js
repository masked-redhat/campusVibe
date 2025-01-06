import models from "../../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../../db/sql/connection.js";
import Answer from "./answers.js";

db.define(
  "AnswerVote",
  {
    id: models.SQLMODEL.ID,
    answerId: {
      type: models.SQLMODEL.ID.type,
      allowNull: false,
    },
    vote: {
      type: DT.INTEGER,
      allowNull: false,
      validate: {
        isIn: [[-1, 0, 1]], // Allowed integer values
      },
    },
  },
  { indexes: [{ type: "UNIQUE", fields: ["userId", "answerId"] }] }
);

const AnswerVote = db.models.AnswerVote;

AnswerVote.afterCreate(async (vote, options) => {
  const transaction = options.transaction;
  const newVote = vote.vote;
  if (newVote === -1)
    await Answer.increment("downvotes", {
      by: 1,
      where: { id: vote.answerId },
      transaction,
    });
  else if (newVote === 1)
    await Answer.increment("upvotes", {
      by: 1,
      where: { id: vote.answerId },
      transaction,
    });
});

AnswerVote.afterUpdate(async (vote, options) => {
  const transaction = options.transaction;
  const prevVote = vote.previous("vote");
  const newVote = vote.vote;

  if (prevVote === 0) {
    if (newVote === -1)
      await Answer.increment("downvotes", {
        by: 1,
        where: { id: vote.answerId },
        transaction,
      });
    else if (newVote === 1)
      await Answer.increment("upvotes", {
        by: 1,
        where: { id: vote.answerId },
        transaction,
      });
  } else if (prevVote === -1) {
    if (newVote === 1) {
      await Answer.decrement("downvotes", {
        by: 1,
        where: { id: vote.answerId },
        transaction,
      });
      await Answer.increment("upvotes", {
        by: 1,
        where: { id: vote.answerId },
        transaction,
      });
    } else if (newVote === 0)
      await Answer.decrement("downvotes", {
        by: 1,
        where: { id: vote.answerId },
        transaction,
      });
  } else if (prevVote === 1) {
    if (newVote === -1) {
      await Answer.decrement("upvotes", {
        by: 1,
        where: { id: vote.answerId },
        transaction,
      });
      await Answer.increment("downvotes", {
        by: 1,
        where: { id: vote.answerId },
        transaction,
      });
    } else if (newVote === 0)
      await Answer.decrement("upvotes", {
        by: 1,
        where: { id: vote.answerId },
        transaction,
      });
  }
});

export default AnswerVote;
