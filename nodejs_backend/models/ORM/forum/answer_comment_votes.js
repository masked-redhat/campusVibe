import models from "../../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../../db/sql/connection.js";
import AnswerComment from "./answer_comments.js";

db.define(
  "AnswerCommentVote",
  {
    id: models.SQLMODEL.ID,
    userId: {
      type: models.SQLMODEL.ID.type,
      allowNull: false,
    },
    commentId: {
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
  { indexes: [{ type: "UNIQUE", fields: ["userId", "commentId"] }] }
);

const AnswerCommentVote = db.models.AnswerCommentVote;

AnswerCommentVote.afterCreate(async (vote, options) => {
  const transaction = options.transaction;
  const newVote = vote.vote;
  if (newVote === -1)
    await AnswerComment.increment("downvotes", {
      by: 1,
      where: { id: vote.commentId },
      transaction,
    });
  else if (newVote === 1)
    await AnswerComment.increment("upvotes", {
      by: 1,
      where: { id: vote.commentId },
      transaction,
    });
});

AnswerCommentVote.afterUpdate(async (vote, options) => {
  const transaction = options.transaction;
  const prevVote = vote.previous("vote");
  const newVote = vote.vote;

  if (prevVote === 0) {
    if (newVote === -1)
      await AnswerComment.increment("downvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
    else if (newVote === 1)
      await AnswerComment.increment("upvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
  } else if (prevVote === -1) {
    if (newVote === 1) {
      await AnswerComment.decrement("downvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
      await AnswerComment.increment("upvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
    } else if (newVote === 0)
      await AnswerComment.decrement("downvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
  } else if (prevVote === 1) {
    if (newVote === -1) {
      await AnswerComment.decrement("upvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
      await AnswerComment.increment("downvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
    } else if (newVote === 0)
      await AnswerComment.decrement("upvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
  }
});

export default AnswerCommentVote;
