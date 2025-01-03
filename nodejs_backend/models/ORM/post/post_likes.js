import models from "../../../constants/db.js";
import db from "../../../db/sql/connection.js";
import Post from "./posts.js";

db.define(
  "PostLike",
  {
    id: models.SQLMODEL.ID,
    postId: {
      type: models.SQLMODEL.ID.type,
      allowNull: false,
    },
    userId: {
      type: models.SQLMODEL.ID.type,
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        type: "UNIQUE",
        fields: ["userId", "postId"],
      },
    ],
  }
);

const PostLike = db.models.PostLike;

PostLike.afterCreate(async (like, options) => {
  const transaction = options.transaction;
  await Post.increment("likes", {
    by: 1,
    where: { id: like.postId },
    transaction,
  });
});

PostLike.beforeDestroy(async (like, options) => {
  const transaction = options.transaction;
  await Post.decrement("likes", {
    by: 1,
    where: { id: like.postId },
    transaction,
  });
});

export default PostLike;
