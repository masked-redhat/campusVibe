import models from "../../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../../db/sql/connection.js";
import { gzipSync, gunzipSync } from "zlib";
import checks from "../../../utils/checks.js";
import PostLike from "./post_likes.js";
import PostComment from "./post_comments.js";

db.define("Post", {
  id: models.SQLMODEL.ID,
  title: {
    type: DT.TEXT,
    allowNull: false,
  },
  content: {
    type: DT.TEXT,
    get() {
      const storedValue = this.getDataValue("content");
      if (checks.isNuldefined(storedValue)) return null;
      const gzippedBuffer = Buffer.from(storedValue, "base64");
      const unzippedBuffer = gunzipSync(gzippedBuffer);
      return unzippedBuffer.toString();
    },
    set(value) {
      if (checks.isNuldefined(value)) {
        this.setDataValue("content", null);
      } else {
        const gzippedBuffer = gzipSync(value);
        this.setDataValue("content", gzippedBuffer.toString("base64"));
      }
    },
  },
  images: DT.ARRAY(DT.STRING),
  likes: {
    type: DT.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  comments: {
    type: DT.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  reposts: {
    type: DT.ARRAY(models.SQLMODEL.ID.type),
    defaultValue: new Array(0),
    validate: {
      async areValidIds(value) {
        if (!Array.isArray(value)) {
          throw new Error("itemIds must be an array");
        }
        const validItems = await Post.findAll({
          where: { id: value },
          attributes: ["id"],
        });

        if (validItems.length !== value.length) {
          throw new Error("One or more itemIds are invalid");
        }
      },
    },
  },
});

const Post = db.models.Post;

Post.hasMany(PostLike, { foreignKey: "postId", onDelete: "CASCADE" });
PostLike.belongsTo(Post, { foreignKey: "postId" });

Post.hasMany(PostComment, { foreignKey: "postId", onDelete: "SET NULL" });
PostComment.belongsTo(Post, { foreignKey: "postId" });

export default Post;
