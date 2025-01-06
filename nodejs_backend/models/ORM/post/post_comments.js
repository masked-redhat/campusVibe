import models from "../../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../../db/sql/connection.js";
import Post from "./posts.js";
import PostCommentVote from "./post_comments_votes.js";
import checks from "../../../utils/checks.js";
import { gzipSync, gunzipSync } from "zlib";
import Profile from "../profile.js";

db.define("PostComment", {
  id: models.SQLMODEL.ID,
  postId: {
    type: models.SQLMODEL.ID.type,
    allowNull: false,
  },
  userId: {
    type: models.SQLMODEL.ID.type,
    allowNull: false,
  },
  comment: {
    type: DT.TEXT,
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

const PostComment = db.models.PostComment;

PostComment.hasMany(PostCommentVote, {
  foreignKey: "commentId",
  onDelete: "CASCADE",
});
PostCommentVote.belongsTo(PostComment, { foreignKey: "commentId" });

PostComment.hasMany(PostComment, {
  foreignKey: "replyId",
  onDelete: "CASCADE",
});
PostComment.belongsTo(PostComment, { foreignKey: "replyId" });

PostComment.afterCreate(async (comment, options) => {
  const transaction = options.transaction;
  if (checks.isNuldefined(comment.replyId))
    await Post.increment("comments", {
      by: 1,
      where: { id: comment.postId },
      transaction,
    });
  if (!checks.isNuldefined(comment.replyId))
    await PostComment.increment("replies", {
      by: 1,
      where: { id: comment.replyId },
      transaction,
    });
  await Profile.increment("comments", {
    by: 1,
    where: { userId: comment.userId },
    transaction,
  });
});

PostComment.afterDestroy(async (comment, options) => {
  const transaction = options.transaction;
  if (checks.isNuldefined(comment.replyId))
    await Post.decrement("comments", {
      by: 1,
      where: { id: comment.postId },
      transaction,
    });
  if (!checks.isNuldefined(comment.replyId))
    await PostComment.decrement("replies", {
      by: 1,
      where: { id: comment.replyId },
      transaction,
    });
  await Profile.decrement("comments", {
    by: 1,
    where: { userId: comment.userId },
    transaction,
  });
});

export default PostComment;
