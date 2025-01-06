import models from "../../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../../db/sql/connection.js";
import AnswerVote from "./answer_votes.js";
import Forum from "./forums.js";
import AnswerComment from "./answer_comments.js";
import checks from "../../../utils/checks.js";
import { gzipSync, gunzipSync } from "zlib";

db.define(
  "Answer",
  {
    id: models.SQLMODEL.ID,
    content: {
      type: DT.TEXT,
      allowNull: false,
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
    comments: {
      type: DT.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    accepted: {
      type: DT.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["forumId"],
        where: {
          accepted: true, // Ensures only one `true` value per `answerId`
        },
      },
    ],
  }
);

const Answer = db.models.Answer;

Answer.hasMany(AnswerVote, { foreignKey: "answerId", onDelete: "CASCADE" });
AnswerVote.belongsTo(Answer, { foreignKey: "answerId" });

Answer.hasMany(AnswerComment, { foreignKey: "answerId", onDelete: "CASCADE" });
AnswerComment.belongsTo(Answer, { foreignKey: "answerId" });

Answer.afterCreate(async (ans, options) => {
  const transaction = options.transaction;

  await Forum.increment("answers", {
    by: 1,
    where: { id: ans.forumId },
    transaction,
  });
});

Answer.afterUpdate(async (ans, options) => {
  const transaction = options.transaction;
  if (ans.accepted === true)
    await Forum.update(
      { answered: true },
      { where: { id: ans.forumId }, transaction }
    );
  else if (ans.accepted === false && ans.previous().accepted === true)
    await Forum.update(
      { answered: false },
      { where: { id: ans.forumId }, transaction }
    );
});

Answer.afterDestroy(async (ans, options) => {
  const transaction = options.transaction;

  await Forum.decrement("answers", {
    by: 1,
    where: { id: ans.forumId },
    transaction,
  });
});

export default Answer;
