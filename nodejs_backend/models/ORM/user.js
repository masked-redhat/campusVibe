import models from "../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../db/sql/connection.js";
import Post from "./post/posts.js";
import PostLike from "./post/post_likes.js";
import PostComment from "./post/post_comments.js";
import PostCommentVote from "./post/post_comments_votes.js";
import Friend, { alias } from "./friends.js";
import Profile from "./profile.js";
import Forum from "./forum/forums.js";
import ForumVote from "./forum/forum_votes.js";
import Answer from "./forum/answers.js";
import AnswerVote from "./forum/answer_votes.js";
import AnswerComment from "./forum/answer_comments.js";
import AnswerCommentVote from "./forum/answer_comment_votes.js";

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

User.hasMany(Friend, { as: alias.userId, foreignKey, onDelete: "CASCADE" });
Friend.belongsTo(User, { as: alias.userId, foreignKey });

User.hasMany(Friend, {
  as: alias.friendId,
  foreignKey: "friendId",
  onDelete: "CASCADE",
});
Friend.belongsTo(User, {
  as: alias.friendId,
  foreignKey: "friendId",
});

User.hasOne(Profile, { foreignKey, onDelete: "CASCADE" });
Profile.belongsTo(User, { foreignKey });

User.hasMany(Forum, { foreignKey, onDelete: "CASCADE" });
Forum.belongsTo(User, { foreignKey });

User.hasMany(ForumVote, { foreignKey, onDelete: "CASCADE" });
ForumVote.belongsTo(User, { foreignKey });

User.hasMany(Answer, { foreignKey, onDelete: "CASCADE" });
Answer.belongsTo(User, { foreignKey });

User.hasMany(AnswerVote, { foreignKey, onDelete: "CASCADE" });
AnswerVote.belongsTo(User, { foreignKey });

User.hasMany(AnswerComment, { foreignKey, onDelete: "CASCADE" });
AnswerComment.belongsTo(User, { foreignKey });

User.hasMany(AnswerCommentVote, { foreignKey, onDelete: "CASCADE" });
AnswerCommentVote.belongsTo(User, { foreignKey });

User.afterCreate(async (user, options) => {
  const transaction = options.transaction;
  await Profile.create({ userId: user.id }, { transaction });
});

export default User;
