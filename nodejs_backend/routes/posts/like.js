import { Router } from "express";
import PostLike from "../../models/ORM/post/post_likes.js";
import {
  ForeignKeyConstraintError,
  UniqueConstraintError,
  ValidationError,
} from "sequelize";
import codes from "../../utils/codes.js";
import { MESSAGES as m } from "../../constants/messages/posts.js";
import checks from "../../utils/checks.js";
import limits from "../../constants/limits.js";
import transaction from "../../db/sql/transaction.js";
import { userInfoInclusion } from "../../db/sql/commands.js";

const LIMIT = limits.POST.LIKE;

const router = Router();

router.get("/", async (req, res) => {
  const { postId, offset: rawOffset } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  // if no post Id given
  if (checks.isNuldefined(postId)) return res.noParams();

  let likes;
  try {
    // find all the likes of the users
    likes = await PostLike.findAll({
      attributes: ["id", "createdAt"],
      where: { postId },
      offset,
      limit: LIMIT,
      order: [["updatedAt", "desc"]],
      include: [userInfoInclusion]
    });

    if (likes.length === 0)
      return res.failure(codes.NOT_FOUND, m.LIKES_UNAVAILABLE);

    res.ok(m.LIKED_BY, { likes, offsetNext: likes.length + offset });
  } catch (err) {
    console.log(err);

    // if post Id is not of appropriate type
    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.post("/", async (req, res) => {
  // get the post Id from request body
  const { postId } = req.body;

  if (checks.isNuldefined(postId)) return res.noParams();

  const t = await transaction();
  try {
    await PostLike.create({ postId, userId: req.user.id }, { transaction: t });

    await t.commit();

    res.ok(m.LIKED);
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof UniqueConstraintError)
      return res.failure(codes.CONFLICT, m.ALREADY_LIKED);

    if (err instanceof ForeignKeyConstraintError)
      return res.failure(codes.NOT_FOUND, m.ID_WRONG_NO_ACCESS);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.delete("/", async (req, res) => {
  // get post Id from request query
  const { postId } = req.query;

  if (checks.isNuldefined(postId)) return res.noParams();

  const t = await transaction();
  try {
    const like = await PostLike.destroy({
      where: {
        postId,
        userId: req.user.id,
      },
      individualHooks: true, // to make it NOT a bulk destory event
      transaction: t,
    });

    if (like === 0) return res.failure(codes.BAD_REQUEST, m.NOT_LIKED);

    await t.commit();

    res.ok(m.UNLIKED);
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

export const LikeRouter = router;
