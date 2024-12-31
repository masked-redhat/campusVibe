import { Router } from "express";
import PostLike from "../../models/ORM/post/post_likes.js";
import { ForeignKeyConstraintError, UniqueConstraintError } from "sequelize";
import codes from "../../utils/codes.js";
import MESSAGES from "../../constants/messages/global.js";
import { MESSAGES as m } from "../../constants/messages/posts.js";
import { serve } from "../../utils/response.js";
import { LIMIT, simpleOrder } from "./route.js";
import checks from "../../utils/checks.js";
import User from "../../models/ORM/user.js";

const router = Router();

router.get("/", async (req, res) => {
  const { postId, offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  let likes;
  try {
    likes = await PostLike.findAll({
      attributes: ["id", "createdAt"],
      where: { postId },
      limit: LIMIT,
      offset,
      order: simpleOrder("updatedAt"),
      include: [
        { model: User, foreignKey: "userId", attributes: ["username"] },
      ],
    });

    if (likes.length === 0) {
      serve(res, codes.NOT_FOUND, m.NO_LIKES);
      return;
    }
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }
  serve(res, codes.OK, "Liked by", {
    likes,
    offsetNext: likes.length + offset,
  });
});

router.post("/", async (req, res) => {
  const { postId } = req.body;

  try {
    const like = await PostLike.create({
      postId,
      userId: req.user.id,
    });
  } catch (err) {
    console.log(err);

    if (err instanceof UniqueConstraintError) {
      serve(res, codes.CONFLICT, m.ALREADY_LIKED);
      return;
    }

    if (err instanceof ForeignKeyConstraintError) {
      serve(res, codes.NOT_FOUND, m.ID_WRONG_NO_ACCESS);
      return;
    }

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }

  serve(res, codes.OK, m.LIKED);
});

router.delete("/", async (req, res) => {
  const { postId } = req.body;

  try {
    const like = await PostLike.destroy({
      where: {
        postId,
        userId: req.user.id,
      },
      individualHooks: true, // to make it NOT a bulk destory event
    });

    if (like === 0) {
      serve(res, codes.BAD_REQUEST, m.ID_WRONG_NO_ACCESS);
      return;
    }
  } catch (err) {
    console.log(err);

    serve(res, codes.INTERNAL_SERVER_ERROR, MESSAGES.SERVER_ERROR);
    return;
  }

  serve(res, codes.OK, m.UNLIKED);
});

export const LikeRouter = router;
