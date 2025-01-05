import Profile from "../../models/ORM/profile.js";
import User from "../../models/ORM/user.js";
import checks from "../../utils/checks.js";

export const getUserData = async (username) => {
  const user = await User.findOne({ where: { username } });
  let profile;
  if (!checks.isNuldefined(user?.id))
    profile = await Profile.findOne({ where: { userId: user.id } });

  const userData = {
    id: user.id,
    profileId: profile?.id,
    username: user.username,
  };

  return userData;
};
