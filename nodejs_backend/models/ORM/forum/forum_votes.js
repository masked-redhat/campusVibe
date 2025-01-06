import models from "../../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../../db/sql/connection.js";
import Forum from "./forums.js";

db.define(
  "ForumVote",
  {
    id: models.SQLMODEL.ID,
    forumId: {
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
  { indexes: [{ type: "UNIQUE", fields: ["userId", "forumId"] }] }
);

const ForumVote = db.models.ForumVote;

ForumVote.afterCreate(async (vote, options) => {
  const transaction = options.transaction;
  const newVote = vote.vote;
  if (newVote === -1)
    await Forum.increment("downvotes", {
      by: 1,
      where: { id: vote.forumId },
      transaction,
    });
  else if (newVote === 1)
    await Forum.increment("upvotes", {
      by: 1,
      where: { id: vote.forumId },
      transaction,
    });
});

ForumVote.afterUpdate(async (vote, options) => {
  const transaction = options.transaction;
  const prevVote = vote.previous("vote");
  const newVote = vote.vote;

  if (prevVote === 0) {
    if (newVote === -1)
      await Forum.increment("downvotes", {
        by: 1,
        where: { id: vote.forumId },
        transaction,
      });
    else if (newVote === 1)
      await Forum.increment("upvotes", {
        by: 1,
        where: { id: vote.forumId },
        transaction,
      });
  } else if (prevVote === -1) {
    if (newVote === 1) {
      await Forum.decrement("downvotes", {
        by: 1,
        where: { id: vote.forumId },
        transaction,
      });
      await Forum.increment("upvotes", {
        by: 1,
        where: { id: vote.forumId },
        transaction,
      });
    } else if (newVote === 0)
      await Forum.decrement("downvotes", {
        by: 1,
        where: { id: vote.forumId },
        transaction,
      });
  } else if (prevVote === 1) {
    if (newVote === -1) {
      await Forum.decrement("upvotes", {
        by: 1,
        where: { id: vote.forumId },
        transaction,
      });
      await Forum.increment("downvotes", {
        by: 1,
        where: { id: vote.forumId },
        transaction,
      });
    } else if (newVote === 0)
      await Forum.decrement("upvotes", {
        by: 1,
        where: { id: vote.forumId },
        transaction,
      });
  }
});

export default ForumVote;
