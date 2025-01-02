import { Router } from "express";
import Post from "../../models/ORM/post/posts.js";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
import { serve } from "../../utils/response.js";
import checks from "../../utils/checks.js";
import limits from "../../constants/limits.js";
import Friend from "../../models/ORM/friends.js";
import { Op } from "sequelize";
import User from "../../models/ORM/user.js";

const router = Router();

const LIMIT = limits.FEED._;

const types = {
  FORYOU: "relevance",
  GLOBAL: "all",
};

router.get("/", async (req, res) => {
  const uid = req.user.id;
  const { offset: rawOffset, type: rawType } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  const type = !checks.isNuldefined(rawType)
    ? rawType.trim() === types.FORYOU
      ? types.FORYOU
      : types.GLOBAL
    : types.GLOBAL;

  try {
    let friends = [];
    if (type === types.FORYOU) {
      friends = await Friend.findAll({
        attributes: ["userId", "friendId"],
        where: {
          [Op.or]: [{ userId: uid }, { friendId: uid }],
        },
      });

      friends = friends.map((ids) =>
        ids.userId === uid ? ids.friendId : ids.userId
      );
    }

    const posts = await Post.findAll({
      where: {
        userId:
          type === types.FORYOU
            ? {
                [Op.in]: friends,
                [Op.not]: uid,
              }
            : { [Op.not]: uid },
      },
      order: [
        ["updatedAt", "desc"],
        ["likes", "desc"],
      ],
      limit: LIMIT,
      offset,
      include: {
        model: User,
        foreignKey: "userId",
        attributes: ["username"],
      },
    });

    serve(res, codes.OK, "Your Feed", {
      posts,
      offsetNext: offset + posts.length,
    });
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
  }
});

router.all("*", (_, res) => {
  res.sendStatus(405);
});

export const FeedRouter = router;
