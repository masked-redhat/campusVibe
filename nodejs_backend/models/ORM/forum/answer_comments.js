import models from "../../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../../db/sql/connection.js";
import checks from "../../../utils/checks.js";
import { gzipSync, gunzipSync } from "zlib";
import AnswerCommentVote from "./answer_comment_votes.js";
import Profile from "../profile.js";
import Answer from "./answers.js";

db.define("AnswerComment", {
  id: models.SQLMODEL.ID,
  answerId: {
    type: models.SQLMODEL.ID.type,
    allowNull: false,
  },
  userId: {
    type: models.SQLMODEL.ID.type,
    allowNull: false,
  },
  comment: {
    type: DT.TEXT,
    allowNull: false,
    get() {
      const storedValue = this.getDataValue("comment");
      if (checks.isNuldefined(storedValue)) return null;
      const gzippedBuffer = Buffer.from(storedValue, "base64");
      const unzippedBuffer = gunzipSync(gzippedBuffer);
      return unzippedBuffer.toString();
    },
    set(value) {
      if (checks.isNuldefined(value)) {
        this.setDataValue("comment", null);
      } else {
        const gzippedBuffer = gzipSync(value);
        this.setDataValue("comment", gzippedBuffer.toString("base64"));
      }
    },
  },
  images: DT.ARRAY(DT.STRING),
  upvotes: {
    type: DT.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  downvotes: {
    type: DT.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  replies: {
    type: DT.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
  votes: {
    type: DT.VIRTUAL,
    get() {
      return this.upvotes - this.downvotes;
    },
  },
  replyId: {
    type: models.SQLMODEL.ID.type,
  },
});

const AnswerComment = db.models.AnswerComment;

AnswerComment.hasMany(AnswerCommentVote, {
  foreignKey: "commentId",
  onDelete: "CASCADE",
});
AnswerCommentVote.belongsTo(AnswerComment, { foreignKey: "commentId" });

AnswerComment.hasMany(AnswerComment, {
  foreignKey: "replyId",
  onDelete: "CASCADE",
});
AnswerComment.belongsTo(AnswerComment, { foreignKey: "replyId" });

AnswerComment.afterCreate(async (comment, options) => {
  const transaction = options.transaction;
  await Answer.increment("comments", {
    by: 1,
    where: { id: comment.answerId },
    transaction,
  });
  if (!checks.isNuldefined(comment.replyId))
    await AnswerComment.increment("replies", {
      by: 1,
      where: { id: replyId },
      transaction,
    });
  await Profile.increment("comments", {
    by: 1,
    where: { userId: comment.userId },
    transaction,
  });
});

AnswerComment.afterDestroy(async (comment, options) => {
  const transaction = options.transaction;
  await Answer.decrement("comments", {
    by: 1,
    where: { id: comment.answerId },
    transaction,
  });
  if (!checks.isNuldefined(comment.replyId))
    await AnswerComment.decrement("replies", {
      by: 1,
      where: { id: replyId },
      transaction,
    });
  await Profile.decrement("comments", {
    by: 1,
    where: { userId: comment.userId },
    transaction,
  });
});

export default AnswerComment;
