import User from "../../models/ORM/user.js";
import Profile from "../../models/ORM/profile.js";

export const userInfoInclusion = {
  include: {
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
  },
};

export const userInfoInclusionByAlias = (alias, foreignKey = "userId") => {
  const userInfo = { ...userInfoInclusion.include, foreignKey, as: alias };
  const inclusion = { include: userInfo };
  return inclusion;
};

export const getUserIdFromUsername = async () => {
  return (
    await User.findOne({
      attributes: ["id"],
      where: { username },
    })
  )?.id;
};
