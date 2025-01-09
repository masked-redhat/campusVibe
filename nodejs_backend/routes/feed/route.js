import { Router } from "express";
import Post from "../../models/ORM/post/posts.js";
import { MESSAGES as m } from "../../constants/messages/feed.js";
import checks from "../../utils/checks.js";
import limits from "../../constants/limits.js";
import Friend from "../../models/ORM/friends.js";
import { Op, literal } from "sequelize";
import { PostRouter } from "./post.js";
import { userInfoInclusion } from "../../db/sql/commands.js";
import Forum from "../../models/ORM/forum/forums.js";

const LIMIT = limits.FEED._;

const router = Router();

// types of feed that can be
const types = {
  FORYOU: "relevance",
  GLOBAL: "all",
};

router.get("/", async (req, res) => {
  const userId = req.user.id;

  // get the offset and type
  const { offset: rawOffset, type: rawType } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  // set type to something from the 'types'
  const type = !checks.isNuldefined(rawType)
    ? rawType.trim() === types.FORYOU
      ? types.FORYOU
      : types.GLOBAL
    : types.GLOBAL;

  try {
    let friends = [];
    if (type === types.FORYOU) await fillFriends(friends, userId);

    // get posts as per the requirements
    const posts = await Post.findAll({
      attributes: { exclude: "userId" },
      where: {
        userId:
          type === types.FORYOU
            ? {
                [Op.in]: friends,
                [Op.not]: userId,
              }
            : { [Op.not]: userId },
      },
      order: [
        ["updatedAt", "desc"],
        ["likes", "desc"],
      ],
      limit: LIMIT,
      offset,
      include: [userInfoInclusion]
    });

    res.ok(m.SUCCESS, { posts, offsetNext: offset + posts.length });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.get("/forum", async (req, res) => {
  const userId = req.user.id;

  const { offset: rawOffset, type: rawType } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  const type = !checks.isNuldefined(rawType)
    ? rawType.trim() === types.FORYOU
      ? types.FORYOU
      : types.GLOBAL
    : types.GLOBAL;

  try {
    let friends = [];
    if (type === types.FORYOU) await fillFriends(friends, userId);

    const forums = await Forum.findAll({
      attributes: { exclude: "userId" },
      where: {
        userId:
          type === types.FORYOU
            ? {
                [Op.in]: friends,
                [Op.not]: userId,
              }
            : { [Op.not]: userId },
      },
      order: [
        ["answered", "asc"],
        ["updatedAt", "desc"],
        [literal("upvotes - downvotes"), "desc"],
        ["upvotes", "desc"],
        ["downvotes", "asc"],
      ],
      limit: LIMIT,
      offset,
      include: [userInfoInclusion]
    });

    res.ok(m.SUCCESS, { forums, offsetNext: offset + forums.length });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.use("/post", PostRouter);

// get friends of the userID: uid
const fillFriends = async (friends, uid) => {
  const CHUNK_SIZE = 10000; // Adjust chunk size
  let offset = 0;

  while (true) {
    const chunk = await Friend.findAll({
      attributes: [
        [
          literal(`
                  CASE
                    WHEN "userId" = ${uid} THEN "friendId"
                    ELSE "userId"
                  END
                `),
          "friendId",
        ],
      ],
      where: {
        [Op.or]: [{ userId: uid }, { friendId: uid }],
      },
      limit: CHUNK_SIZE,
      offset,
      raw: true, // Use plain objects
    });

    if (chunk.length === 0) break; // Exit if no more data

    friends = friends.concat(chunk.map((row) => row.friendId));
    offset += CHUNK_SIZE;
  }
};

export const FeedRouter = router;
