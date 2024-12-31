import models from "../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../db/sql/connection.js";
import Post from "./post/posts.js";
import PostLike from "./post/post_likes.js";
import PostComment from "./post/post_comments.js";
import PostCommentVote from "./post/post_comments_votes.js";

db.define("User", {
  id: models.SQLMODEL.ID,
  username: {
    type: DT.STRING,
    unique: true,
    allowNull: false,
  },
  password: {
    type: DT.STRING,
    allowNull: false,
  },
  email: {
    type: DT.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  email_verified: {
    type: DT.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  blacklisted: {
    type: DT.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

const User = db.models.User;

const foreignKey = "userId";
User.hasMany(Post, { foreignKey, onDelete: "SET NULL" });
Post.belongsTo(User, { foreignKey });

User.hasMany(PostLike, { foreignKey, onDelete: "CASCADE" });
PostLike.belongsTo(User, { foreignKey });

User.hasMany(PostComment, { foreignKey, onDelete: "CASCADE" });
PostComment.belongsTo(User, { foreignKey });

User.hasMany(PostCommentVote, { foreignKey, onDelete: "CASCADE" });
PostCommentVote.belongsTo(User, { foreignKey });

export default User;
