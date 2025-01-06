import User from "../../models/ORM/user.js";
import Profile from "../../models/ORM/profile.js";

export const userInfoInclusion = {
  model: User,
  foreignKey: "userId",
  attributes: ["username"],
  include: [
    {
      model: Profile,
      attributes: { exclude: ["id", "userId", "interests", "friends", "posts", "comments", "createdAt", "updatedAt"] },
    },
  ],
};

export const userInfoByAlias = (alias, foreignKey = "userId") => {
  const info = { ...userInfoInclusion, foreignKey, as: alias };
  return info;
};
