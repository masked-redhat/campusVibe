import models from "../../constants/db.js";
import { DataTypes as DT } from "sequelize";
import db from "../../db/sql/connection.js";
import checks from "../../utils/checks.js";
import IMAGES from "../../constants/images.js";

db.define("Profile", {
  id: models.SQLMODEL.ID,
  userId: {
    type: models.SQLMODEL.ID.type,
    allowNull: false,
  },
  firstName: DT.STRING,
  lastName: DT.STRING,
  profilePic: {
    type: DT.STRING,
    allowNull: false,
    defaultValue: IMAGES.PROFILE,
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
  fullName: {
    type: DT.VIRTUAL,
    get() {
      return checks.isNuldefined(this.firstName) &&
        checks.isNuldefined(this.lastName)
        ? null
        : `${checks.isNuldefined(this.firstName) ? " " : this.firstName} ${
            checks.isNuldefined(this.lastName) ? " " : this.lastName
          }`.trim();
    },
  },
});

const Profile = db.models.Profile;

export default Profile;
