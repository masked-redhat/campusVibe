import models from "../../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../../db/sql/connection.js";
import PostComment from "./post_comments.js";

db.define(
  "PostCommentVote",
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

const PostCommentVote = db.models.PostCommentVote;

PostCommentVote.afterCreate(async (vote, options) => {
  const transaction = options.transaction;
  const newVote = vote.vote;
  if (newVote === -1)
    await PostComment.increment("downvotes", {
      by: 1,
      where: { id: vote.commentId },
      transaction,
    });
  else if (newVote === 1)
    await PostComment.increment("upvotes", {
      by: 1,
      where: { id: vote.commentId },
      transaction,
    });
});

PostCommentVote.afterUpdate(async (vote, options) => {
  const transaction = options.transaction;
  const prevVote = vote.previous("vote");
  const newVote = vote.vote;

  if (prevVote === 0) {
    if (newVote === -1)
      await PostComment.increment("downvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
    else if (newVote === 1)
      await PostComment.increment("upvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
  } else if (prevVote === -1) {
    if (newVote === 1) {
      await PostComment.decrement("downvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
      await PostComment.increment("upvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
    } else if (newVote === 0)
      await PostComment.decrement("downvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
  } else if (prevVote === 1) {
    if (newVote === -1) {
      await PostComment.decrement("upvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
      await PostComment.increment("downvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
    } else if (newVote === 0)
      await PostComment.decrement("upvotes", {
        by: 1,
        where: { id: vote.commentId },
        transaction,
      });
  }
});

export default PostCommentVote;
