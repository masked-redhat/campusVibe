import User from "../../models/ORM/user.js";

export const userInfoInclusion = {
  model: User,
  foreignKey: "userId",
  attributes: ["username"],
};

export const userInfoByAlias = (alias, foreignKey = "userId") => {
  const info = { ...userInfoInclusion, foreignKey, as: alias };
  return info;
};
