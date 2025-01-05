import models from "../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../db/sql/connection.js";

db.define("Profile", {
  id: models.SQLMODEL.ID,
  userId: {
    type: models.SQLMODEL.ID.type,
    allowNull: false,
  },
  age: { type: DT.INTEGER },
  studentType: {
    type: DT.ENUM(
      "Primary School Student",
      "High School Student",
      "College Student",
      "University Student"
    ),
  },
  instituteName: { type: DT.STRING },
  interests: { type: DT.ARRAY(DT.STRING), allowNull: false, defaultValue: [] },
  friends: { type: DT.INTEGER, allowNull: false, defaultValue: 0 },
  posts: { type: DT.INTEGER, allowNull: false, defaultValue: 0 },
  comments: { type: DT.INTEGER, allowNull: false, defaultValue: 0 },
});

const Profile = db.models.Profile;

export default Profile;
