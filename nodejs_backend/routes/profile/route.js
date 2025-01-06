import { Router } from "express";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
// import { MESSAGES as m } from "../../constants/messages/posts.js";
import { serve } from "../../utils/response.js";
import checks from "../../utils/checks.js";
import Profile from "../../models/ORM/profile.js";
import IMAGES from "../../constants/images.js";
import User from "../../models/ORM/user.js";

const router = Router();

router.get("/", async (req, res) => {
  const pid = req.user.profileId;
  const { username } = req.query;

  try {
    const userId = username
      ? (
          await User.findOne({
            attributes: ["id"],
            where: { username },
          })
        )?.id
      : req.user.id;

    console.log(userId, req.user.id);

    const profileId =
      !checks.isNuldefined(userId) && userId != req.user.id
        ? (
            await Profile.findOne({
              attributes: ["id"],
              where: { userId },
            })
          )?.id
        : userId === req.user.id
        ? pid
        : null;

    if (checks.isNuldefined(profileId)) {
      serve(res, codes.BAD_REQUEST, "No user with that username");
      return;
    }

    const profile = await Profile.findOne({
      attributes: { exclude: ["id", "userId"] },
      where: { id: profileId },
    });

    serve(res, codes.OK, "User profile", {
      profile: {
        ...profile.dataValues,
        username: username ? username : req.user.username,
      },
    });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }
});

router.patch("/", async (req, res) => {
  const pid = req.user.profileId;
  const { firstName, lastName, age, instituteName, studentType, interests } =
    req.body;
  const profilePic = req.files?.map((val) => val.filename)?.[0] ?? null;

  const updateData = Object.fromEntries(
    Object.entries({
      firstName,
      lastName,
      age,
      instituteName,
      studentType,
      interests,
      profilePic,
    }).filter(([_, value]) => !checks.isNuldefined(value))
  );

  try {
    await Profile.update(updateData, {
      where: { id: pid, userId: req.user.id },
    });

    serve(res, codes.OK, "Profile updated");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.put("/", async (req, res) => {
  const pid = req.user.profileId;
  const {
    firstName = null,
    lastName = null,
    age = null,
    instituteName = null,
    studentType = null,
    interests = [],
  } = req.body;
  const profilePic =
    req.files?.map((val) => val.filename)?.[0] ?? IMAGES.PROFILE;

  if (!Array.isArray(interests)) {
    serve(res, codes.BAD_REQUEST, "Invalid format of details given", {
      interests,
    });
  }

  try {
    const profileUpdate = await Profile.update(
      {
        firstName,
        lastName,
        age,
        instituteName,
        studentType,
        interests,
        profilePic,
      },
      {
        where: { id: pid, userId: req.user.id },
      }
    );

    serve(res, codes.OK, "Profile updated");
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const ProfileRouter = router;
