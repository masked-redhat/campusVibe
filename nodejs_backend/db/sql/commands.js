import User from "../../models/ORM/user.js";
import Profile from "../../models/ORM/profile.js";

export const userInfoInclusion = {
  model: User,
  foreignKey: "userId",
  attributes: ["username"],
  include: [
    {
      model: Profile,
      attributes: [
        "fullName",
        "firstName",
        "lastName",
        "studentType",
        "instituteName",
      ],
    },
  ],
};

export const userInfoByAlias = (alias, foreignKey = "userId") => {
  const info = { ...userInfoInclusion, foreignKey, as: alias };
  return info;
};

export const getUserIdFromUsername = async () => {
  return (
    await User.findOne({
      attributes: ["id"],
      where: { username },
    })
  )?.id;
};
