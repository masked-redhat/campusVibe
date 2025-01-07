import { Router } from "express";
import codes from "../../utils/codes.js";
import { MESSAGES as m } from "../../constants/messages/profile.js";
import checks from "../../utils/checks.js";
import Profile from "../../models/ORM/profile.js";
import User from "../../models/ORM/user.js";
import { ValidationError } from "sequelize";

const router = Router();

router.get("/", async (req, res) => {
  // get username (optional), if wanting another user's profile
  const { username } = req.query;

  try {
    // get userId if username given
    const userId =
      username && username !== req.user.username
        ? (
            await User.findOne({
              attributes: ["id"],
              where: { username },
            })
          )?.id
        : req.user.id;

    // get profile id of the user found
    const profileId =
      !checks.isNuldefined(userId) && userId != req.user.id
        ? (
            await Profile.findOne({
              attributes: ["id"],
              where: { userId },
            })
          )?.id
        : userId === req.user.id
        ? req.user.profileId
        : null;

    // if no profile Id
    if (checks.isNuldefined(profileId))
      return res.failure(codes.BAD_REQUEST, m.USERNAME_INVALID);

    // find profile of the user
    const profile = await Profile.findOne({
      attributes: { exclude: ["id", "userId"] },
      where: { id: profileId },
    });

    res.ok(m.SUCCESS, {
      profile: {
        ...profile.dataValues,
        username: username ? username : req.user.username,
      },
    });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.patch("/", async (req, res) => {
  // get update parameters from request body
  const {
    firstName,
    lastName,
    age,
    instituteName,
    studentType,
    interests,
    pfp,
  } = req.body;

  // only update data that is given to be updated
  const updateData = Object.fromEntries(
    Object.entries({
      firstName,
      lastName,
      age,
      instituteName,
      studentType,
      interests,
      profilePic: pfp,
    }).filter(([_, value]) => !checks.isNuldefined(value))
  );

  try {
    await Profile.update(updateData, {
      where: { id: req.user.profileId, userId: req.user.id },
    });

    res.ok(m.UPDATED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.put("/", async (req, res) => {
  // get update parameters from request body
  const {
    firstName,
    lastName,
    age,
    instituteName,
    studentType,
    interests,
    pfp,
  } = req.body;

  if (checks.isAnyValueNull([firstName, instituteName, studentType]))
    return res.noParams();

  try {
    await Profile.update(
      {
        firstName,
        lastName,
        age,
        instituteName,
        studentType,
        interests,
        profilePic: pfp,
      },
      {
        where: { id: req.user.profileId, userId: req.user.id },
      }
    );

    res.ok(m.UPDATED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

export const ProfileRouter = router;
