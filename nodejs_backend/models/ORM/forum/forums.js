import models from "../../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../../db/sql/connection.js";
import ForumVote from "./forum_votes.js";
import Answer from "./answers.js";

db.define("Forum", {
  id: models.SQLMODEL.ID,
  question: {
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
  answered: {
    type: DT.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  answers: {
    type: DT.INTEGER,
    defaultValue: 0,
    allowNull: false,
  },
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
});

const Forum = db.models.Forum;

Forum.hasMany(ForumVote, { foreignKey: "forumId", onDelete: "CASCADE" });
ForumVote.belongsTo(Forum, { foreignKey: "forumId" });

Forum.hasMany(Answer, { foreignKey: "forumId", onDelete: "CASCADE" });
Answer.belongsTo(Forum, { foreignKey: "forumId" });

export default Forum;
