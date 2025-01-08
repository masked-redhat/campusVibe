import { Router } from "express";
import Post from "../../models/ORM/post/posts.js";
import codes from "../../utils/codes.js";
import { MESSAGES as m } from "../../constants/messages/posts.js";
import checks from "../../utils/checks.js";
import { ValidationError } from "sequelize";
import { LikeRouter } from "./like.js";
import { CommentRouter } from "./comment.js";
import limits from "../../constants/limits.js";
import {
  getUserIdFromUsername,
  userInfoInclusion,
} from "../../db/sql/commands.js";
import transaction from "../../db/sql/transaction.js";

const LIMIT = limits.POST._;

const router = Router();

router.get("/", async (req, res) => {
  // get the offset and username if wanted another user's posts
  const { offset: rawOffset, username } = req.query;
  const offset = checks.isNuldefined(rawOffset) ? 0 : parseInt(rawOffset);

  try {
    // get userId for the username
    const userId =
      username && username !== req.user.username
        ? await getUserIdFromUsername(username)
        : req.user.id;

    // find and sort the posts and add an attribute
    // liked -> if the user of userId ever liked the post
    const posts = await Post.findAll({
      attributes: { exclude: ["userId"] },
      where: { userId },
      offset,
      limit: LIMIT,
      order: [["createdAt", "desc"]],
      include: [
        userInfoInclusion.include,
        [
          sequelize.literal(`(
            SELECT EXISTS (
              SELECT 1
              FROM "PostLikes" AS "PostLike"
              WHERE "PostLike"."postId" = "Post"."id"
                AND "PostLike"."userId" = ${userId}
            )
          )`),
          "liked",
        ],
      ],
    });

    res.ok(m.SUCCESS, { posts, offsetNext: posts.length + offset });
  } catch (err) {
    console.log(err);

    res.serverError();
  }
});

router.post("/", async (req, res) => {
  // get the post parameters from request body
  const { title = null, content = null, reposts = [], images = [] } = req.body;

  if (checks.isNuldefined(title)) return res.noParams();

  const t = await transaction();
  try {
    const post = await Post.create(
      { userId: req.user.id, title, content, images, reposts },
      { transaction: t }
    );

    await t.commit();

    res.created(m.CREATED, { postId: post.id });
  } catch (err) {
    console.log(err);
    await t.rollback();

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.patch("/", async (req, res) => {
  // get the to be update data and post id for updation
  const { title = null, content, reposts, postId, images = [] } = req.body;

  if (checks.isNuldefined(postId)) return res.noParams();

  // only update data that is given
  const updateData = Object.fromEntries(
    Object.entries({ title, content, images, reposts }).filter(
      ([_, value]) => !checks.isNuldefined(value)
    )
  );

  try {
    const [post] = await Post.update(updateData, {
      where: { id: postId, userId: req.user.id },
    });

    if (post === 0) return res.failure(codes.BAD_REQUEST, m.ID_WRONG_NO_ACCESS);

    res.ok(m.POST_UPDATED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.put("/", async (req, res) => {
  // get the to be update data and post id for updation
  const { title = null, content, reposts, postId, images = [] } = req.body;

  if (checks.isAnyValueNull([title, postId])) return res.noParams();

  // update all data
  const updateData = { title, content, images, reposts };

  try {
    const [post] = await Post.update(updateData, {
      where: { id: postId, userId: req.user.id },
    });

    if (post === 0) return res.failure(codes.BAD_REQUEST, m.ID_WRONG_NO_ACCESS);

    res.ok(m.POST_UPDATED);
  } catch (err) {
    console.log(err);

    if (err instanceof ValidationError) return res.invalidParams();

    res.serverError();
  }
});

router.delete("/", async (req, res) => {
  // get post id to be deleted from the request query
  const { postId } = req.query;

  if (checks.isNuldefined(postId)) return res.noParams();

  const t = await transaction();
  try {
    const post = await Post.destroy({
      where: { id: postId, userId: req.user.id },
      individualHooks: true,
      transaction: t,
    });

    await t.commit();

    if (post === 0) return res.failure(codes.BAD_REQUEST, m.ID_WRONG_NO_ACCESS);

    res.deleted();
  } catch (err) {
    console.log(err);
    await t.rollback();

    res.serverError();
  }
});

router.use("/like", LikeRouter);

router.use("/comment", CommentRouter);

export const PostsRouter = router;
